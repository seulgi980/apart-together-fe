import * as React from "react"
import { cva } from "class-variance-authority"

import { Button } from "@/components/ui/button"
import type { MemberColor } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * 타임라인 항목. 3열 구조: 시간 | 세로 레일 | 카드.
 *
 *   <TimelineItem variant="normal">
 *     <TimelineItem.Time start="09:30" end="11:00" onClick={...} />
 *     <TimelineItem.Rail />
 *     <TimelineItem.Card>...</TimelineItem.Card>
 *   </TimelineItem>
 *
 * variant
 * - normal: 시간이 있는 장소 항목
 * - memo: 장소 없는 메모 항목 (점선 카드, 속 빈 점)
 * - unscheduled: 시간 미정 항목
 * - highlighted: 다른 멤버가 방금 바꾼 항목 (멤버 색 테두리)
 */
export type TimelineVariant = "normal" | "memo" | "unscheduled" | "highlighted"

const TimelineContext = React.createContext<TimelineVariant>("normal")

function TimelineItemRoot({
  variant = "normal",
  member,
  className,
  children,
  ref,
  ...props
}: React.ComponentProps<"li"> & {
  variant?: TimelineVariant
  /** highlighted일 때 변경한 멤버의 색 */
  member?: MemberColor | null
}) {
  return (
    <TimelineContext.Provider value={variant}>
      <li
        ref={ref}
        data-variant={variant}
        data-member={member ?? undefined}
        className={cn("flex gap-2 lg:gap-3", className)}
        {...props}
      >
        {children}
      </li>
    </TimelineContext.Provider>
  )
}

const startVariants = cva("text-time font-bold", {
  variants: {
    variant: {
      normal: "text-brand-900",
      memo: "text-brand-750",
      unscheduled: "font-medium text-brand-700",
      highlighted: "text-brand-900",
    },
  },
})

/** 시간 열. 누르면 시간 선택기가 열린다 (F4-10). */
function TimelineTime({
  start,
  end,
  onClick,
  disabled,
}: {
  start?: string
  end?: string
  onClick?: () => void
  disabled?: boolean
}) {
  const variant = React.useContext(TimelineContext)
  const label = start ? `시간 ${start}${end ? `부터 ${end}까지` : ""}` : "시간 미정"
  const content = (
    <>
      <span className={startVariants({ variant })}>{start ?? "--:--"}</span>
      {end && <span className="text-caption text-brand-750">~{end}</span>}
    </>
  )
  if (!onClick || disabled) {
    return (
      <div
        className="flex min-h-8 w-12 shrink-0 flex-col items-start lg:min-h-10 lg:w-18"
        aria-label={label}
      >
        {content}
      </div>
    )
  }
  return (
    <Button
      variant="ghost"
      size="bare"
      className="min-h-8 w-12 flex-col items-start justify-start gap-0 self-start lg:min-h-10 lg:w-18"
      aria-label={`${label} · 시간 바꾸기`}
      onClick={onClick}
    >
      {content}
    </Button>
  )
}

const dotVariants = cva(
  "absolute top-1 left-1/2 size-3 -translate-x-1/2 rounded-full lg:top-2",
  {
    variants: {
      variant: {
        normal: "bg-brand-700",
        memo: "border border-brand-700 bg-brand-0",
        unscheduled: "bg-brand-350",
        highlighted: "bg-member-strong",
      },
    },
  }
)

/** 세로 레일: 선 brand-300, 점 brand-700 */
function TimelineRail() {
  const variant = React.useContext(TimelineContext)
  return (
    <div className="relative w-4 shrink-0" aria-hidden>
      <span className="absolute top-0 -bottom-2 left-1/2 w-px -translate-x-1/2 bg-brand-350 lg:-bottom-3" />
      <span className={dotVariants({ variant })} />
    </div>
  )
}

const cardVariants = cva(
  "flex min-h-12 min-w-0 flex-1 items-center gap-1.5 rounded-lg px-2.5 py-1.5 lg:min-h-14 lg:gap-3 lg:px-3 lg:py-2",
  {
    variants: {
      variant: {
        normal: "border border-line bg-brand-0 shadow-card",
        memo: "border border-dashed border-brand-600 bg-brand-150",
        unscheduled: "border border-line bg-brand-0 shadow-card",
        highlighted: "border-2 border-member-strong bg-brand-0 shadow-card",
      },
    },
  }
)

function TimelineCard({ className, ...props }: React.ComponentProps<"div">) {
  const variant = React.useContext(TimelineContext)
  return <div className={cn(cardVariants({ variant }), className)} {...props} />
}

/** 카드 안의 장소명 + 보조 정보 */
function TimelineText({
  name,
  sub,
  badge,
}: {
  name: string
  sub?: React.ReactNode
  /** 이름 아래에 붙는 배지 ("지은 · 방금 추가됨") */
  badge?: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-start">
      <p className="max-w-full truncate text-body font-bold text-brand-900 lg:text-subtitle">
        {name}
      </p>
      {sub && (
        <p className="max-w-full truncate text-caption text-brand-750">{sub}</p>
      )}
      {badge && <div className="pt-1">{badge}</div>}
    </div>
  )
}

export const TimelineItem = Object.assign(TimelineItemRoot, {
  Time: TimelineTime,
  Rail: TimelineRail,
  Card: TimelineCard,
  Text: TimelineText,
})
