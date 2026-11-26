import { cva, type VariantProps } from "class-variance-authority"
import { ThumbsDown, ThumbsUp } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { MemberView, Vote } from "@/lib/types"

const rootVariants = cva("", {
  variants: {
    /** 채팅: 프로필 사진 테두리를 핀 색으로 (F6-3) */
    ring: {
      true: "border-2 border-member-strong",
      false: "",
    },
  },
  defaultVariants: { ring: false },
})

const fallbackVariants = cva("", {
  variants: {
    state: {
      /** 멤버 색 원 + 이니셜 */
      filled: "bg-member text-brand-900",
      /** 아직 투표하지 않은 멤버: 점선 빈 원 */
      pending: "border border-dashed border-brand-600 bg-brand-0 text-brand-750",
    },
  },
  defaultVariants: { state: "filled" },
})

/** 투표 표시: 아바타 오른쪽 아래의 흰 원 안에 좋아요(초록 따봉)·패스(빨간 아래 따봉) 아이콘 */
const voteBadgeVariants = cva(
  "absolute -right-1 -bottom-1 flex size-3.5 items-center justify-center rounded-full bg-brand-0 shadow-card [&_svg]:size-2.5 [&_svg]:stroke-[2.5]",
  {
    variants: {
      vote: {
        like: "text-vote-like",
        pass: "text-vote-pass",
      },
    },
  }
)

const VOTE_LABEL: Record<Vote, string> = { like: "좋아요", pass: "패스" }

type MemberAvatarProps = {
  member: MemberView
  size?: "sm" | "md" | "lg"
  /** 투표 내용을 모서리 아이콘으로 표시 */
  vote?: Vote
} & VariantProps<typeof rootVariants> &
  VariantProps<typeof fallbackVariants>

/**
 * 멤버 아바타. 색만으로 구분하지 않도록 항상 이니셜을 같이 보여준다.
 * 멤버 색은 data-member 속성으로만 전달한다.
 */
export function MemberAvatar({
  member,
  size = "md",
  vote,
  ring,
  state,
}: MemberAvatarProps) {
  const initial = member.nickname.slice(0, 1)
  return (
    <Avatar
      size={size}
      data-member={member.color ?? undefined}
      className={rootVariants({ ring })}
      title={vote ? `${member.nickname} · ${VOTE_LABEL[vote]}` : member.nickname}
    >
      {member.avatarUrl && state !== "pending" && (
        <AvatarImage src={member.avatarUrl} alt={member.nickname} />
      )}
      <AvatarFallback className={fallbackVariants({ state })}>
        {initial}
      </AvatarFallback>
      {vote && (
        <span className={voteBadgeVariants({ vote })} aria-hidden>
          {vote === "like" ? <ThumbsUp /> : <ThumbsDown />}
        </span>
      )}
    </Avatar>
  )
}
