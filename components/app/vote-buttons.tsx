import { cva } from "class-variance-authority"
import { ThumbsDown, ThumbsUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Vote } from "@/lib/types"

/**
 * 내 선택은 채워진 버튼으로 표시한다. 고른 버튼을 한 번 더 누르면 취소된다 (F3-1)
 * 따봉 아이콘은 안 고르면 빈 따봉, 고르면 꽉 찬 따봉.
 * 색: 좋아요 = 카드 선택 테두리와 같은 진핑크(select), 패스 = 진한 갈색(brand-750).
 * 아바타 모서리 점(member-avatar)과 투표 결과 막대도 같은 색 짝을 쓴다.
 */
const voteButton = cva("flex-1", {
  variants: {
    selected: {
      like: "border-select bg-brand-200 font-bold text-brand-900 hover:bg-brand-200 active:bg-brand-200 [&_svg]:text-select",
      pass: "border-brand-750 bg-pass-fill font-bold text-brand-900 hover:bg-pass-fill active:bg-pass-fill [&_svg]:text-brand-750",
      none: "",
    },
  },
  defaultVariants: { selected: "none" },
})

export function VoteButtons({
  myVote,
  onVote,
  disabled,
}: {
  myVote?: Vote
  onVote: (vote: Vote) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        aria-pressed={myVote === "like"}
        className={voteButton({ selected: myVote === "like" ? "like" : "none" })}
        onClick={() => onVote("like")}
      >
        <ThumbsUp className={myVote === "like" ? "fill-current" : undefined} />
        좋아요
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        aria-pressed={myVote === "pass"}
        className={voteButton({ selected: myVote === "pass" ? "pass" : "none" })}
        onClick={() => onVote("pass")}
      >
        <ThumbsDown className={myVote === "pass" ? "fill-current" : undefined} />
        패스
      </Button>
    </div>
  )
}
