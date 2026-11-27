"use client"

import { X } from "lucide-react"

import { MemberAvatar } from "@/components/app/member-avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { MemberView } from "@/lib/types"

/**
 * 긴 채팅 메시지 전체 보기.
 * 말풍선의 [전체 보기]를 누르면 프로필 카드처럼 채팅 패널 왼쪽(모바일은 채팅 위)에 뜬다.
 * 내용이 길면 이 안에서 스크롤한다.
 */
export function MessageFullView({
  member,
  time,
  text,
  onClose,
}: {
  member: MemberView
  time: string
  text: string
  onClose: () => void
}) {
  return (
    <div className="flex size-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-line py-2 pr-2 pl-3">
        <MemberAvatar member={member} size="chat" ring />
        <p className="min-w-0 flex-1 truncate text-caption text-brand-750">
          <span className="font-bold text-brand-900">{member.nickname}</span> · {time}
        </p>
        <Button
          variant="ghost"
          size="icon"
          aria-label="전체 보기 닫기"
          className="size-8 lg:size-8"
          onClick={onClose}
        >
          <X />
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <p className="px-4 py-3 text-body whitespace-pre-wrap wrap-anywhere text-brand-900">
          {text}
        </p>
      </ScrollArea>
    </div>
  )
}
