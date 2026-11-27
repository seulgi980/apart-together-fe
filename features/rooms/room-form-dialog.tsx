"use client"

import * as React from "react"

import { ConfirmDialog } from "@/components/app/confirm-dialog"
import { DateRangeCalendar } from "@/components/app/date-range-calendar"
import { FormField } from "@/components/app/form-field"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSubmit } from "@/hooks/use-submit"
import { countDays, formatPeriod, MAX_TRIP_DAYS } from "@/lib/domain/dates"

/** 여행 제목 최대 글자 수 */
const TITLE_MAX = 30

export type RoomFormValue = { title: string; startDate: string; endDate: string }

/** 여행방 만들기 / 방 정보 수정: 제목, 시작일, 종료일 (F1-8). 저장되면 닫히고, 실패하면 입력을 남긴다. */
export function RoomFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 있으면 수정, 없으면 새로 만들기 */
  initial?: RoomFormValue
  /** 성공하면 true (창을 닫는다) */
  onSubmit: (value: RoomFormValue) => Promise<boolean>
}) {
  const { pending, run } = useSubmit(onSubmit, () => onOpenChange(false))
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <RoomForm initial={initial} pending={pending} onSubmit={run} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function RoomForm({
  initial,
  pending,
  onSubmit,
}: {
  initial?: RoomFormValue
  pending: boolean
  onSubmit: (value: RoomFormValue) => void
}) {
  const [title, setTitle] = React.useState(initial?.title ?? "")
  const [startDate, setStartDate] = React.useState(initial?.startDate ?? "")
  const [endDate, setEndDate] = React.useState(initial?.endDate ?? "")

  const ready = title.trim() && startDate && endDate
  const tooLong =
    Boolean(startDate && endDate) && countDays(startDate, endDate) > MAX_TRIP_DAYS
  const [limitNotice, setLimitNotice] = React.useState(false)

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!ready) return
        if (tooLong) {
          setLimitNotice(true)
          return
        }
        onSubmit({ title: title.trim(), startDate, endDate })
      }}
    >
      <DialogHeader>
        <DialogTitle>{initial ? "방 정보 수정" : "여행방 만들기"}</DialogTitle>
        <DialogDescription>
          시작일과 종료일을 정하면 Day 1부터 Day N까지 일정 칸이 생겨요.
          여행 기간은 최대 {MAX_TRIP_DAYS}일이에요.
        </DialogDescription>
      </DialogHeader>
      <FormField
        id="room-title"
        label="여행 제목"
        help={`최대 ${TITLE_MAX}자 (${title.length}/${TITLE_MAX})`}
      >
        <Input
          id="room-title"
          placeholder="예: 도쿄 한 달 살기"
          maxLength={TITLE_MAX}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </FormField>
      <div className="flex flex-col gap-2">
        <Label id="room-period-label">여행 기간</Label>
        <div role="group" aria-labelledby="room-period-label">
          <DateRangeCalendar
            startDate={startDate}
            endDate={endDate}
            onChange={(range) => {
              setStartDate(range.startDate)
              setEndDate(range.endDate)
            }}
          />
        </div>
        {tooLong ? (
          <p role="alert" className="text-caption text-error-text">
            여행 기간은 최대 {MAX_TRIP_DAYS}일이에요. (지금{" "}
            {countDays(startDate, endDate)}일)
          </p>
        ) : (
          <p className="text-caption text-brand-750">
            {!startDate
              ? "달력에서 시작일을 누르세요."
              : !endDate
                ? "종료일을 누르세요. (당일치기면 같은 날을 한 번 더 누르세요)"
                : `${formatPeriod(startDate, endDate)} · Day 1 ~ Day ${countDays(startDate, endDate)}`}
          </p>
        )}
      </div>
      <DialogFooter>
        <Button type="submit" disabled={pending || !ready}>
          {pending ? "저장 중…" : initial ? "저장" : "만들기"}
        </Button>
      </DialogFooter>
      <ConfirmDialog
        open={limitNotice}
        onOpenChange={setLimitNotice}
        title="여행 기간이 너무 길어요"
        description={`여행 기간은 최대 ${MAX_TRIP_DAYS}일(100일 미만)까지 정할 수 있어요. 종료일을 앞당겨 주세요.`}
      />
    </form>
  )
}
