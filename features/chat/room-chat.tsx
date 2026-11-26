"use client"

import * as React from "react"
import Link from "next/link"

import {
  ChatDateDivider,
  ChatMessage,
  ChatPlaceCard,
} from "@/components/app/chat-message"
import { ChatPanel } from "@/components/app/chat-panel"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { MemberProfileCard } from "@/features/chat/member-profile-card"
import { SharePlaceButton } from "@/features/chat/share-place-button"
import { useChatToggle } from "@/features/chat/use-chat-toggle"
import { useChat } from "@/hooks/use-chat"
import { useIsDesktop } from "@/hooks/use-is-desktop"
import { usePlaces } from "@/hooks/use-places"
import { useRoom } from "@/hooks/use-room"
import { placeMeta } from "@/lib/domain/labels"

/** 채팅 내용: 메시지 목록 + 입력. 열려 있는 동안 읽음 처리한다. */
function ChatBody({ roomId }: { roomId: string }) {
  const view = useRoom(roomId)
  const { places } = usePlaces(roomId)
  const { messages, hasOlder, send, sharePlace, loadOlder, markRead } =
    useChat(roomId)

  // 열려 있는 동안 새 메시지가 오면(내 시스템 메시지 포함) 마지막 메시지까지 바로 읽음 처리한다
  const lastSeq = messages.length > 0 ? messages[messages.length - 1].seq : 0
  React.useEffect(() => {
    markRead()
  }, [markRead, lastSeq])

  // 카드 ID -> 카드. 메시지마다 카드 목록을 뒤지지 않게 한 번 만들어 둔다.
  const placeById = new Map(places.map((placeView) => [placeView.place.id, placeView]))

  // 프로필을 연 멤버. 사진을 한 번 더 누르면 닫힌다.
  const isDesktop = useIsDesktop()
  const [profileId, setProfileId] = React.useState<string | null>(null)
  const toggleProfile = (userId: string) =>
    setProfileId((current) => (current === userId ? null : userId))
  const closeProfile = () => setProfileId(null)

  if (!view) return null

  // 추가한 카드 수: 방의 카드는 이미 화면에 다 불러와 있으니 서버에 다시 묻지 않고 그 목록에서 센다
  const profileMember = profileId ? view.getMember(profileId) : null
  const profile = profileMember && (
    <MemberProfileCard
      member={profileMember}
      placeCount={places.filter((placeView) => placeView.place.createdBy === profileId).length}
      onClose={closeProfile}
    />
  )

  const panel = (
    <ChatPanel
      messageCount={messages.length}
      hasOlder={hasOlder}
      onLoadOlder={loadOlder}
      onSend={send}
      attach={<SharePlaceButton places={places} onShare={sharePlace} />}
    >
      {messages.map((message, index) => {
        // 날짜가 바뀌는 첫 메시지 위에만 날짜 구분선을 넣는다 (맨 위 메시지는 항상)
        const divider =
          index === 0 || messages[index - 1].date !== message.date ? (
            <ChatDateDivider key={`date-${message.id}`} date={message.date} />
          ) : null
        if (message.kind === "system" || !message.userId) {
          return (
            <React.Fragment key={message.id}>
              {divider}
              <ChatMessage variant="system">{message.text}</ChatMessage>
            </React.Fragment>
          )
        }
        const shared = message.placeId ? placeById.get(message.placeId) : undefined
        return (
          <React.Fragment key={message.id}>
            {divider}
            <ChatMessage
              variant="user"
              member={view.getMember(message.userId)}
              time={message.time}
              onAvatarClick={() => toggleProfile(message.userId!)}
            >
              {message.text}
              {message.kind === "place" &&
                (shared ? (
                  <Link
                    href={`/rooms/${roomId}/places/${shared.place.id}`}
                    draggable={false}
                    className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ChatPlaceCard
                      name={shared.place.name}
                      meta={placeMeta(shared.place.category, shared.place.area, shared.place.areaEn)}
                    />
                  </Link>
                ) : (
                  <ChatPlaceCard name="삭제된 장소 카드" meta="더 이상 볼 수 없어요" />
                ))}
            </ChatMessage>
          </React.Fragment>
        )
      })}
    </ChatPanel>
  )

  // 모바일: 채팅 왼쪽에 자리가 없어서 채팅 안쪽 위에 겹쳐 띄운다
  if (!isDesktop) {
    return (
      <div className="relative flex min-h-0 flex-1 flex-col">
        {panel}
        {profile && (
          <div className="absolute inset-x-3 top-3 z-10 h-1/3 min-h-56 rounded-xl border border-line bg-popover shadow-pop animate-in fade-in-0 zoom-in-95">
            {profile}
          </div>
        )}
      </div>
    )
  }

  // 웹: 채팅 패널 왼쪽 위에 채팅 높이의 1/3 크기로 붙여 띄운다
  return (
    <Popover open={profile !== null} onOpenChange={(open) => !open && closeProfile()}>
      <PopoverAnchor asChild>
        <div className="flex min-h-0 flex-1 flex-col">{panel}</div>
      </PopoverAnchor>
      <PopoverContent
        side="left"
        align="start"
        sideOffset={12}
        alignOffset={12}
        avoidCollisions={false}
        onOpenAutoFocus={(event) => event.preventDefault()}
        // 다른 사람 사진을 누르면 닫혔다 다시 열리지 않고 바로 그 사람으로 바뀌게, 사진 클릭은 바깥 클릭으로 치지 않는다
        onInteractOutside={(event) => {
          if ((event.target as Element | null)?.closest?.("[data-chat-avatar]")) {
            event.preventDefault()
          }
        }}
        className="h-[max(14rem,calc(var(--radix-popover-trigger-height)/3))] w-60 p-0"
      >
        {profile}
      </PopoverContent>
    </Popover>
  )
}

/** 웹 일정 화면 오른쪽 채팅 패널 (폭 400). 일정 위에 겹치지 않고 옆에 놓인다. */
export function ChatDock({ roomId }: { roomId: string }) {
  const view = useRoom(roomId)
  return (
    <aside
      aria-label="채팅"
      className="flex min-h-0 w-chat shrink-0 flex-col border-l border-line bg-brand-50"
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
        <h2 className="text-title font-bold text-brand-900">채팅</h2>
        <p className="text-caption text-brand-750">
          {view?.members.length ?? 0}명 참여 중
        </p>
      </div>
      <ChatBody roomId={roomId} />
    </aside>
  )
}

/**
 * 모바일 채팅 슬라이드 패널.
 * 배경을 가리지 않는 비모달 패널이라 채팅을 열어둔 채 뒤 화면을 조작할 수 있다.
 */
export function ChatSheet({ roomId }: { roomId: string }) {
  const view = useRoom(roomId)
  const { dockMode, open, closeSheet, show } = useChatToggle(roomId)
  const sheetOpen = !dockMode && open

  return (
    <Sheet
      modal={false}
      open={sheetOpen}
      onOpenChange={(next) => (next ? show() : closeSheet())}
    >
      <SheetContent
        side="right"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <SheetHeader className="border-b border-line">
          <SheetTitle>채팅</SheetTitle>
          <SheetDescription>
            {view?.members.length ?? 0}명 참여 중
          </SheetDescription>
        </SheetHeader>
        {sheetOpen && <ChatBody roomId={roomId} />}
      </SheetContent>
    </Sheet>
  )
}
