import { cva, type VariantProps } from "class-variance-authority"

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

const voteDotVariants = cva(
  "absolute -right-1 -bottom-1 size-3 rounded-full border-2",
  {
    variants: {
      vote: {
        /* 좋아요 = 진핑크, 패스 = 진한 갈색 (좋아요·패스 버튼의 따봉 색과 같다) */
        like: "border-brand-0 bg-select",
        pass: "border-brand-0 bg-brand-750",
      },
    },
  }
)

const VOTE_LABEL: Record<Vote, string> = { like: "좋아요", pass: "패스" }

type MemberAvatarProps = {
  member: MemberView
  size?: "sm" | "md" | "chat" | "lg"
  /** 투표 내용을 모서리 점으로 표시 */
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
      {vote && <span className={voteDotVariants({ vote })} aria-hidden />}
    </Avatar>
  )
}
