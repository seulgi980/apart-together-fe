"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

import { BottomTabs, type RoomSection } from "@/components/app/bottom-tabs"
import { ScreenSkeleton } from "@/components/app/screen-skeleton"
import { SideNav } from "@/components/app/side-nav"
import { ChatDock, ChatSheet } from "@/features/chat/room-chat"
import { useChatToggle } from "@/features/chat/use-chat-toggle"
import { ProfileMenu } from "@/features/rooms/profile-menu"
import { SchedulePlacePanel } from "@/features/schedule/schedule-place-panel"
import { useRoom, useRoomId, useSession } from "@/hooks/use-room"
import { realtime } from "@/lib/realtime/socket"
import { useStore } from "@/lib/store/store"

const SECTIONS: RoomSection[] = ["places", "schedule", "map"]

/**
 * 여행방 화면의 공통 틀.
 * 웹: 상단 내비 + 본문 (+ 일정 화면의 채팅 패널) / 모바일: 본문 + 하단 탭.
 * 참여자가 아니면 방 데이터에 접근할 수 없다 (F1-5).
 */
export function RoomShell({ children }: { children: React.ReactNode }) {
  const roomId = useRoomId()
  const router = useRouter()
  const pathname = usePathname()
  const { hydrated, user } = useSession()
  const view = useRoom(roomId)
  const chat = useChatToggle(roomId)

  React.useEffect(() => {
    if (!hydrated) return
    if (!user) router.replace("/login")
    else if (!view) router.replace("/rooms")
  }, [hydrated, user, view, router])

  // 방에 들어오면 방 데이터를 불러오고 실시간 연결을 맺는다. 나가면 끊는다.
  const isMember = view !== null
  React.useEffect(() => {
    if (!hydrated || !isMember) return
    const store = useStore.getState()
    void store.loadRoom(roomId)
    realtime.connect(roomId, {
      onEvent: (id, event) => useStore.getState().applyEvent(id, event),
      onReconnect: (id) => void useStore.getState().loadRoom(id),
      onForbidden: () => void useStore.getState().loadRooms(),
      currentDay: (id) => useStore.getState().dayByRoom[id] ?? 1,
    })
    return () => realtime.disconnect()
  }, [hydrated, isMember, roomId])

  if (!hydrated || !user || !view) return <ScreenSkeleton />

  const segment = pathname.split("/")[3]
  const active = SECTIONS.find((section) => section === segment) ?? null

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SideNav
        roomId={roomId}
        roomTitle={view.room.title}
        active={active}
        chatOpen={chat.open}
        unreadLabel={chat.unreadLabel}
        onToggleChat={chat.toggle}
        profile={<ProfileMenu me={view.me} roomId={roomId} />}
      />
      <div className="flex min-h-0 flex-1">
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</main>
        {chat.dockMode && chat.open && <ChatDock roomId={roomId} />}
        <SchedulePlacePanel />
      </div>
      <BottomTabs roomId={roomId} active={active} />
      <ChatSheet roomId={roomId} />
    </div>
  )
}
