"use client"

import * as React from "react"
import Link from "next/link"

import { ChatMessage, ChatPlaceCard } from "@/components/app/chat-message"
import { ChatPanel } from "@/components/app/chat-panel"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { SharePlaceButton } from "@/features/chat/share-place-button"
import { useChatToggle } from "@/features/chat/use-chat-toggle"
import { useChat } from "@/hooks/use-chat"
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

  if (!view) return null

  return (
    <ChatPanel
      messageCount={messages.length}
      hasOlder={hasOlder}
      onLoadOlder={loadOlder}
      onSend={send}
      attach={<SharePlaceButton places={places} onShare={sharePlace} />}
    >
      {messages.map((message) => {
        if (message.kind === "system" || !message.userId) {
          return (
            <ChatMessage key={message.id} variant="system">
              {message.text}
            </ChatMessage>
          )
        }
        const shared = places.find((view) => view.place.id === message.placeId)
        return (
          <ChatMessage
            key={message.id}
            variant="user"
            member={view.getMember(message.userId)}
            time={message.time}
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
        )
      })}
    </ChatPanel>
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
        overlay={false}
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
