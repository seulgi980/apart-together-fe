import * as React from "react"
import { cva } from "class-variance-authority"
import { MapPin } from "lucide-react"

import { MemberAvatar } from "@/components/app/member-avatar"
import type { MemberView } from "@/lib/types"

/**
 * 채팅 메시지 (F6-3, F6-5).
 * - user: 멤버 아바타(핀 색 테두리) + 닉네임 · 시각 + 말풍선.
 *   내 메시지는 오른쪽에 브랜드 색 말풍선으로 보인다.
 *   말풍선은 패널 폭의 80%까지만 넓어지고, 띄어쓰기 없는 긴 글(링크 등)도 그 안에서 줄을 바꾼다.
 * - system: 일정 변경 자동 기록. 가운데 정렬 알약.
 */
type ChatMessageProps =
  | {
      variant: "user"
      member: MemberView
      time: string
      /** 프로필 사진을 눌렀을 때 (멤버 프로필 열기) */
      onAvatarClick?: () => void
      children: React.ReactNode
    }
  | { variant: "system"; children: React.ReactNode }

const rowVariants = cva("flex items-start gap-3", {
  variants: {
    side: {
      mine: "flex-row-reverse",
      theirs: "",
    },
  },
})

const columnVariants = cva("flex min-w-0 max-w-[80%] flex-col gap-1", {
  variants: {
    side: {
      mine: "items-end",
      theirs: "items-start",
    },
  },
})

const bubbleVariants = cva(
  "flex max-w-full flex-col gap-2 rounded-lg px-3 py-2 text-body whitespace-pre-wrap wrap-anywhere text-brand-900",
  {
    variants: {
      side: {
        mine: "bg-like-subtle",
        theirs: "border border-line bg-brand-0",
      },
    },
  }
)

export function ChatMessage(props: ChatMessageProps) {
  if (props.variant === "system") {
    return (
      <li className="flex justify-center">
        <p className="rounded-full bg-brand-250 px-3 py-1 text-center text-caption text-brand-750">
          {props.children}
        </p>
      </li>
    )
  }
  const side = props.member.isMe ? "mine" : "theirs"
  return (
    <li className={rowVariants({ side })}>
      {props.onAvatarClick ? (
        <button
          type="button"
          data-chat-avatar
          aria-label={`${props.member.nickname} 프로필 보기`}
          className="shrink-0 rounded-full outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring"
          onClick={props.onAvatarClick}
        >
          <MemberAvatar member={props.member} size="chat" ring />
        </button>
      ) : (
        <MemberAvatar member={props.member} size="chat" ring />
      )}
      <div className={columnVariants({ side })}>
        <p className="text-caption text-brand-750">
          {props.member.nickname} · {props.time}
        </p>
        <div className={bubbleVariants({ side })}>{props.children}</div>
      </div>
    </li>
  )
}

/**
 * 날짜 구분선: ── 2026년 11월 25일 ──
 * 그날 첫 메시지 위에 한 번만 보이고, 날짜가 바뀌면 다시 한 번 보인다 (카카오톡처럼).
 */
export function ChatDateDivider({ date }: { date: string }) {
  return (
    <li className="flex items-center gap-3 py-1" role="separator" aria-label={date}>
      <span aria-hidden className="h-px flex-1 bg-line" />
      <span className="shrink-0 text-caption text-brand-750">{date}</span>
      <span aria-hidden className="h-px flex-1 bg-line" />
    </li>
  )
}

/** 말풍선 안의 장소 카드 공유. 누르면 해당 카드로 이동한다 (F6-7). */
export function ChatPlaceCard({ name, meta }: { name: string; meta: string }) {
  return (
    <span className="flex items-center gap-2 rounded-md border border-brand-500 bg-brand-0 px-3 py-2">
      <MapPin className="size-5 shrink-0 text-brand-750" />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-body font-medium text-brand-900">
          {name}
        </span>
        <span className="truncate text-caption text-brand-750">{meta}</span>
      </span>
    </span>
  )
}
