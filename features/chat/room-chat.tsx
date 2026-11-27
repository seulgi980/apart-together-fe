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
import { MessageFullView } from "@/features/chat/message-full-view"
import { SharePlaceButton } from "@/features/chat/share-place-button"
import { useChatToggle } from "@/features/chat/use-chat-toggle"
import { useChat } from "@/hooks/use-chat"
import { useIsDesktop } from "@/hooks/use-is-desktop"
import { usePlaces } from "@/hooks/use-places"
import { useRoom } from "@/hooks/use-room"
import { placeMeta } from "@/lib/domain/labels"
import { CHAT_PREVIEW_MAX } from "@/lib/domain/limits"

/** 채팅 왼쪽(모바일은 채팅 위)에 띄우는 것: 멤버 프로필 또는 긴 메시지 전체 보기. 한 번에 하나만 뜬다. */
type SidePanel = { kind: "profile"; userId: string } | { kind: "message"; messageId: string }

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

  // 옆에 띄운 패널. 같은 사진이나 같은 [전체 보기]를 한 번 더 누르면 닫힌다.
  const isDesktop = useIsDesktop()
  const [side, setSide] = React.useState<SidePanel | null>(null)
  const toggleProfile = (userId: string) =>
    setSide((current) =>
      current?.kind === "profile" && current.userId === userId ? null : { kind: "profile", userId }
    )
  const toggleFullMessage = (messageId: string) =>
    setSide((current) =>
      current?.kind === "message" && current.messageId === messageId
        ? null
        : { kind: "message", messageId }
    )
  const closeSide = () => setSide(null)

  if (!view) return null

  let sideContent: React.ReactNode = null
  if (side?.kind === "profile") {
    // 추가한 카드 수: 방의 카드는 이미 화면에 다 불러와 있으니 서버에 다시 묻지 않고 그 목록에서 센다
    const member = view.getMember(side.userId)
    sideContent = member && (
      <MemberProfileCard
        member={member}
        placeCount={places.filter((placeView) => placeView.place.createdBy === side.userId).length}
        onClose={closeSide}
      />
    )
  } else if (side?.kind === "message") {
    const message = messages.find((item) => item.id === side.messageId)
    const member = message?.userId ? view.getMember(message.userId) : null
    sideContent = message && member && (
      <MessageFullView member={member} time={message.time} text={message.text} onClose={closeSide} />
    )
  }
  // 전체 보기는 내용을 길게 읽어야 해서 채팅 높이만큼, 프로필은 1/3만큼 띄운다
  const tall = side?.kind === "message"

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
        // 긴 메시지는 앞부분만 보여주고 [전체 보기]로 옆에 펼친다
        const long = message.text.length > CHAT_PREVIEW_MAX
        return (
          <React.Fragment key={message.id}>
            {divider}
            <ChatMessage
              variant="user"
              member={view.getMember(message.userId)}
              time={message.time}
              onAvatarClick={() => toggleProfile(message.userId!)}
            >
              {long ? `${Array.from(message.text).slice(0, CHAT_PREVIEW_MAX).join("")}…` : message.text}
              {long && (
                <button
                  type="button"
                  data-chat-side-toggle
                  aria-expanded={side?.kind === "message" && side.messageId === message.id}
                  className="self-start rounded-sm text-caption font-bold text-brand-750 underline underline-offset-2 outline-none hover:text-brand-900 focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => toggleFullMessage(message.id)}
                >
                  전체 보기
                </button>
              )}
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
        {sideContent && (
          <div
            className={
              tall
                ? "absolute inset-3 z-10 flex flex-col overflow-hidden rounded-xl border border-line bg-popover shadow-pop animate-in fade-in-0 zoom-in-95"
                : "absolute inset-x-3 top-3 z-10 h-1/3 min-h-56 rounded-xl border border-line bg-popover shadow-pop animate-in fade-in-0 zoom-in-95"
            }
          >
            {sideContent}
          </div>
        )}
      </div>
    )
  }

  // 웹: 채팅 패널 왼쪽 위에 붙여 띄운다 (프로필은 채팅 높이의 1/3, 전체 보기는 채팅 높이만큼)
  return (
    <Popover open={!!sideContent} onOpenChange={(open) => !open && closeSide()}>
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
        // 다른 사진이나 다른 [전체 보기]를 누르면 닫혔다 다시 열리지 않고 바로 바뀌게, 그 클릭은 바깥 클릭으로 치지 않는다
        onInteractOutside={(event) => {
          if ((event.target as Element | null)?.closest?.("[data-chat-avatar], [data-chat-side-toggle]")) {
            event.preventDefault()
          }
        }}
        className={
          tall
            ? "h-[calc(var(--radix-popover-trigger-height)-1.5rem)] w-80 overflow-hidden p-0"
            : "h-[max(14rem,calc(var(--radix-popover-trigger-height)/3))] w-60 p-0"
        }
      >
        {sideContent}
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
