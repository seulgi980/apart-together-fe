import { cva } from "class-variance-authority"
import { ThumbsDown, ThumbsUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Vote } from "@/lib/types"

/**
 * 내 선택은 채워진 버튼으로 표시한다. 고른 버튼을 한 번 더 누르면 취소된다 (F3-1)
 * 따봉 아이콘은 안 고르면 빈 따봉, 고르면 글자 색으로 꽉 찬 따봉 (색이 아니라 모양으로 내 선택을 보여준다).
 */
const voteButton = cva("flex-1", {
  variants: {
    selected: {
      like: "border-brand-600 bg-brand-500 font-bold text-brand-900 hover:bg-brand-500 active:bg-brand-500",
      pass: "border-pass bg-pass font-bold text-brand-0 hover:bg-pass active:bg-pass",
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
