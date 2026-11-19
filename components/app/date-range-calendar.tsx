"use client"

import * as React from "react"
import { cva } from "class-variance-authority"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * 여행 기간을 고르는 달력.
 * 날짜를 한 번 누르면 시작일, 한 번 더 누르면 종료일이 된다.
 * 기간이 정해진 뒤에 다시 누르면 그 날짜부터 새로 고른다.
 * 날짜는 "YYYY-MM-DD" 글자로 주고받는다 (시간대 변환을 하지 않는다).
 */

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"]

const dayVariants = cva(
  "flex h-10 w-full items-center justify-center text-body outline-none focus-visible:ring-2 focus-visible:ring-ring",
  {
    variants: {
      state: {
        /** 시작일 또는 종료일 */
        edge: "rounded-full bg-brand-900 font-bold text-brand-0",
        /** 시작일과 종료일 사이 */
        between: "bg-brand-250 text-brand-900",
        none: "rounded-full text-brand-900 hover:bg-brand-150",
      },
      today: {
        true: "underline underline-offset-4",
        false: "",
      },
    },
  }
)

function pad(value: number): string {
  return String(value).padStart(2, "0")
}

function toKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

/** 처음 보여줄 달: 시작일이 있으면 그 달, 없으면 이번 달 */
function initialMonth(startDate: string): { year: number; month: number } {
  if (startDate) {
    const [year, month] = startDate.split("-").map(Number)
    return { year, month: month - 1 }
  }
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() }
}

export function DateRangeCalendar({
  startDate,
  endDate,
  onChange,
}: {
  /** "YYYY-MM-DD". 아직 안 골랐으면 빈 글자 */
  startDate: string
  endDate: string
  onChange: (range: { startDate: string; endDate: string }) => void
}) {
  const [view, setView] = React.useState(() => initialMonth(startDate))
  const [today] = React.useState(() => {
    const now = new Date()
    return toKey(now.getFullYear(), now.getMonth(), now.getDate())
  })

  const move = (delta: number) =>
    setView(({ year, month }) => {
      const next = new Date(Date.UTC(year, month + delta, 1))
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() }
    })

  const pick = (key: string) => {
    // 시작일만 있는 상태에서 그 뒤(같은 날 포함)를 누르면 종료일, 그 밖에는 새 시작일
    if (startDate && !endDate && key >= startDate) {
      onChange({ startDate, endDate: key })
    } else {
      onChange({ startDate: key, endDate: "" })
    }
  }

  const firstWeekday = new Date(Date.UTC(view.year, view.month, 1)).getUTCDay()
  const dayCount = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate()
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: dayCount }, (_, index) => index + 1),
  ]

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-brand-0 p-3">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="이전 달"
          onClick={() => move(-1)}
        >
          <ChevronLeft />
        </Button>
        <p aria-live="polite" className="text-subtitle font-bold text-brand-900">
          {view.year}년 {view.month + 1}월
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="다음 달"
          onClick={() => move(1)}
        >
          <ChevronRight />
        </Button>
      </div>

      <div className="grid grid-cols-7">
        {WEEKDAYS.map((weekday) => (
          <span
            key={weekday}
            className="flex h-8 items-center justify-center text-caption text-brand-750"
          >
            {weekday}
          </span>
        ))}
        {cells.map((day, index) => {
          if (day === null) return <span key={`blank-${index}`} />
          const key = toKey(view.year, view.month, day)
          const isEdge = key === startDate || key === endDate
          const isBetween =
            Boolean(startDate && endDate) && key > startDate && key < endDate
          return (
            <button
              key={key}
              type="button"
              aria-label={`${view.year}년 ${view.month + 1}월 ${day}일`}
              aria-pressed={isEdge}
              className={dayVariants({
                state: isEdge ? "edge" : isBetween ? "between" : "none",
                today: key === today,
              })}
              onClick={() => pick(key)}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
