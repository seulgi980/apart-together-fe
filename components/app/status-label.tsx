import { Badge } from "@/components/ui/badge"
import { statusText, type VoteSummary } from "@/lib/domain/status"
import { STATUS_BADGE_VARIANT, statusTextColor } from "@/lib/status-styles"
import { cn } from "@/lib/utils"

/** 상태 문구 ("좋아요 3/4", "의견갈림"). 카드, 필터, 지도가 같은 표시를 공유한다. */
export function StatusLabel({
  summary,
  as = "text",
}: {
  summary: VoteSummary
  as?: "text" | "badge"
}) {
  if (as === "badge") {
    return (
      <Badge variant={STATUS_BADGE_VARIANT[summary.status]}>
        {statusText(summary)}
      </Badge>
    )
  }
  return (
    <span
      className={cn(
        "shrink-0 text-caption font-medium",
        statusTextColor({ status: summary.status })
      )}
    >
      {statusText(summary)}
    </span>
  )
}
