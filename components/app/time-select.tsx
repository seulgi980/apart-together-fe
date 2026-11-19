"use client"

import * as React from "react"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/**
 * 시간 선택기: 오전/오후, 시, 분을 각각 드롭다운으로 고른다.
 * 값은 "HH:MM"(24시간) 문자열이고, 비어 있으면 시간을 정하지 않은 상태다.
 */
type Period = "am" | "pm"

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
/** 분은 1분 단위로 고른다 */
const MINUTE_STEP = 1

function parse(value: string): { period: Period; hour: number; minute: number } | null {
  if (!value) return null
  const [h, m] = value.split(":").map(Number)
  return { period: h < 12 ? "am" : "pm", hour: h % 12 === 0 ? 12 : h % 12, minute: m }
}

function format(period: Period, hour: number, minute: number): string {
  const h24 = (hour % 12) + (period === "pm" ? 12 : 0)
  return `${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

export function TimeSelect({
  label,
  value,
  onChange,
  defaultTime = "09:00",
  invalid = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  /** 비어 있을 때 한 칸을 고르면 나머지를 채울 기준 시각 */
  defaultTime?: string
  invalid?: boolean
}) {
  const parts = parse(value)

  // 분 목록: 0~59분, 1분 단위.
  const minutes = React.useMemo(() => {
    const list = Array.from({ length: 60 / MINUTE_STEP }, (_, index) => index * MINUTE_STEP)
    if (parts && !list.includes(parts.minute)) list.push(parts.minute)
    return list.sort((a, b) => a - b)
  }, [parts])

  /** 한 칸만 골라도 나머지는 기준 시각으로 채운다 */
  const update = (patch: Partial<{ period: Period; hour: number; minute: number }>) => {
    const next = { ...(parts ?? parse(defaultTime)!), ...patch }
    onChange(format(next.period, next.hour, next.minute))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex min-h-6 items-center justify-between gap-3">
        <Label>{label}</Label>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="bare"
            className="min-h-6 px-1 text-caption"
            onClick={() => onChange("")}
          >
            <X />
            지우기
          </Button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Select
          value={parts?.period ?? ""}
          onValueChange={(next) => update({ period: next as Period })}
        >
          <SelectTrigger aria-label={`${label} 오전/오후`} aria-invalid={invalid}>
            <SelectValue placeholder="오전/오후" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="am">오전</SelectItem>
            <SelectItem value="pm">오후</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={parts ? String(parts.hour) : ""}
          onValueChange={(next) => update({ hour: Number(next) })}
        >
          <SelectTrigger aria-label={`${label} 시`} aria-invalid={invalid}>
            <SelectValue placeholder="시" />
          </SelectTrigger>
          <SelectContent>
            {HOURS.map((hour) => (
              <SelectItem key={hour} value={String(hour)}>
                {hour}시
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={parts ? String(parts.minute) : ""}
          onValueChange={(next) => update({ minute: Number(next) })}
        >
          <SelectTrigger aria-label={`${label} 분`} aria-invalid={invalid}>
            <SelectValue placeholder="분" />
          </SelectTrigger>
          <SelectContent>
            {minutes.map((minute) => (
              <SelectItem key={minute} value={String(minute)}>
                {String(minute).padStart(2, "0")}분
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
