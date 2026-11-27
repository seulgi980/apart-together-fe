"use client"

import * as React from "react"
import { Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CHAT_MESSAGE_MAX } from "@/lib/domain/limits"
import { notifyFailed } from "@/lib/notify"

/**
 * 채팅 패널의 틀: 메시지 목록 + 입력창.
 * 웹에서는 일정 옆 패널, 모바일에서는 슬라이드 패널 안에 넣어 쓴다.
 * 헤더는 감싸는 쪽(패널/시트)이 그린다.
 */
export function ChatPanel({
  messageCount,
  hasOlder,
  onLoadOlder,
  onSend,
  attach,
  children,
}: {
  /** 새 메시지가 오면 맨 아래로 내리기 위한 값 */
  messageCount: number
  hasOlder: boolean
  onLoadOlder: () => void
  onSend: (text: string) => void
  /** 입력창 왼쪽에 놓는 버튼 (장소 카드 올리기) */
  attach?: React.ReactNode
  /** ChatMessage 목록 */
  children: React.ReactNode
}) {
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const [text, setText] = React.useState("")
  const lastCount = React.useRef(0)

  // 새 메시지가 추가되면 맨 아래로. 이전 메시지를 불러왔을 때는 위치를 유지한다.
  React.useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const added = messageCount - lastCount.current
    if (lastCount.current === 0 || added === 1) {
      viewport.scrollTop = viewport.scrollHeight
    }
    lastCount.current = messageCount
  }, [messageCount])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    // 너무 길면 보내지 않고 알린다. 입력한 글은 지우지 않아서 줄여서 다시 보낼 수 있다.
    if (trimmed.length > CHAT_MESSAGE_MAX) {
      notifyFailed(
        `최대 ${CHAT_MESSAGE_MAX.toLocaleString()}자를 초과했습니다. (지금 ${trimmed.length.toLocaleString()}자)`
      )
      return
    }
    onSend(trimmed)
    setText("")
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* 스크롤은 사이트 공통 ScrollArea를 쓴다 */}
      <ScrollArea
        viewportRef={viewportRef}
        className="flex-1"
        onScroll={() => {
          // 위로 스크롤하면 이전 메시지를 이어서 불러온다 (F6-6)
          if (hasOlder && viewportRef.current?.scrollTop === 0) onLoadOlder()
        }}
      >
        <div className="flex flex-col gap-4 p-4">
          {hasOlder ? (
            <Button variant="ghost" size="sm" onClick={onLoadOlder}>
              이전 메시지 불러오기
            </Button>
          ) : (
            <p className="text-center text-caption text-brand-750">
              대화의 시작입니다
            </p>
          )}
          <ul className="flex flex-col gap-4">{children}</ul>
        </div>
      </ScrollArea>
      <form
        onSubmit={submit}
        className="flex shrink-0 items-center gap-3 border-t border-line bg-brand-50 p-3"
      >
        {attach}
        <Input
          aria-label="메시지"
          placeholder="메시지를 입력하세요"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <Button type="submit" disabled={!text.trim()}>
          <Send />
          전송
        </Button>
      </form>
    </div>
  )
}
