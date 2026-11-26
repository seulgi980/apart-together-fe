"use client"

import { X } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { MemberView } from "@/lib/types"

/**
 * 채팅에서 프로필 사진을 누르면 뜨는 멤버 프로필.
 * 큰 원형 사진(멤버 색 테두리) 아래에 닉네임과 추가한 카드 수를 보여준다.
 */
export function MemberProfileCard({
  member,
  placeCount,
  onClose,
}: {
  member: MemberView
  /** 이 멤버가 방에 추가한 장소 카드 수 */
  placeCount: number
  onClose: () => void
}) {
  return (
    <div className="relative flex size-full flex-col items-center justify-center gap-3 px-4 py-5">
      <Button
        variant="ghost"
        size="icon"
        aria-label="프로필 닫기"
        className="absolute top-2 right-2 size-8 lg:size-8"
        onClick={onClose}
      >
        <X />
      </Button>
      {/* 멤버 색 테두리 + 흰 여백으로 사진을 한 번 감싼다 */}
      <div
        data-member={member.color ?? undefined}
        className="rounded-full bg-member p-1 shadow-card"
      >
        <Avatar className="size-20 border-2 border-brand-0 text-title">
          {member.avatarUrl && (
            <AvatarImage src={member.avatarUrl} alt={member.nickname} />
          )}
          <AvatarFallback className="bg-member text-brand-900">
            {member.nickname.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="flex min-w-0 max-w-full flex-col items-center gap-1">
        <p className="max-w-full truncate text-subtitle font-bold text-brand-900">
          {member.nickname}
          {member.isMe && (
            <span className="ml-1 text-caption font-medium text-brand-750">(나)</span>
          )}
        </p>
        <p className="text-caption text-brand-750">
          추가한 카드{" "}
          <span className="font-bold text-brand-900">{placeCount}</span>개
        </p>
      </div>
    </div>
  )
}
