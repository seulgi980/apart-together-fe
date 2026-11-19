"use client"

import * as React from "react"

import { FormField } from "@/components/app/form-field"
import { TimeSelect } from "@/components/app/time-select"
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
import {
  formatGap,
  isValidRange,
  type GapWindow,
} from "@/lib/domain/schedule"

/** 종료 시간을 처음 고를 때의 기준: 시작 1시간 뒤 (같은 Day 안에서) */
function oneHourAfter(start: string): string | undefined {
  if (!start) return undefined
  const [hour, minute] = start.split(":").map(Number)
  if (hour >= 23) return "23:55"
  return `${String(hour + 1).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

export type ItemDialogState =
  | { mode: "closed" }
  /** 메모 항목 추가 (F4-15) */
  | { mode: "new-memo" }
  /** 시간·메모 편집 (F4-10) */
  | {
      mode: "edit"
      itemId: string
      kind: "place" | "memo"
      name: string
      start?: string
      end?: string
      note?: string
    }
  /** 장소 풀 카드를 타임라인의 한 틈에 놓았을 때: 시간을 정하거나 시간 미정으로 넣는다 */
  | {
      mode: "place"
      placeId: string
      name: string
      /** 놓은 자리 (0 = 맨 위) */
      index: number
      /** 그 자리에 넣을 수 있는 시간 범위 */
      window: GapWindow
    }

export type ItemDialogValue = {
  title?: string
  start?: string
  end?: string
  note?: string
}

/**
 * 시간 선택기 겸 항목 편집 창.
 * 시간은 시작~종료 범위로 입력하고 종료는 선택이다. 시작을 비우면 "시간 미정".
 * onSubmit이 false를 돌려주면(서버가 검증에서 거절) 창을 닫지 않는다.
 */
export function ItemDialog({
  state,
  day,
  onClose,
  onSubmit,
}: {
  state: ItemDialogState
  day: number
  onClose: () => void
  onSubmit: (value: ItemDialogValue) => Promise<boolean>
}) {
  return (
    <Dialog
      open={state.mode !== "closed"}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent>
        {state.mode !== "closed" && (
          <ItemForm
            state={state}
            day={day}
            onSubmit={async (value) => {
              if (await onSubmit(value)) onClose()
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function describe(
  state: Exclude<ItemDialogState, { mode: "closed" }>
): string {
  if (state.mode === "new-memo") {
    return "이동일, 숙소 체크인처럼 장소 없는 일정을 추가해요. 시간을 아직 못 정했으면 시간 미정으로 넣어 두세요."
  }
  if (state.mode === "place") {
    const range = formatGap(state.window)
    return range
      ? `이 자리에는 ${range} 시간을 넣을 수 있어요. 아직 못 정했으면 시간 미정으로 넣어 두세요.`
      : "시간을 정하거나, 아직 못 정했으면 시간 미정으로 넣어 두세요."
  }
  return "시간은 현지 시각 기준이에요. 종료 시간은 비워 둘 수 있어요."
}

function ItemForm({
  state,
  day,
  onSubmit,
}: {
  state: Exclude<ItemDialogState, { mode: "closed" }>
  day: number
  onSubmit: (value: ItemDialogValue) => void
}) {
  const editing = state.mode === "edit" ? state : null
  const placing = state.mode === "place"
  /** 새로 넣는 경우 (장소 카드를 놓았거나 메모 항목 추가): [시간 미정으로 넣기]와 [추가] 두 버튼 */
  const adding = placing || state.mode === "new-memo"
  const isMemo = state.mode === "new-memo" || editing?.kind === "memo"

  const [title, setTitle] = React.useState(isMemo ? (editing?.name ?? "") : "")
  const [start, setStart] = React.useState(editing?.start ?? "")
  const [end, setEnd] = React.useState(editing?.end ?? "")
  const [note, setNote] = React.useState(editing?.note ?? "")

  const timeError = !start && end
    ? "시작 시간을 먼저 입력하세요."
    : !isValidRange(start || undefined, end || undefined)
      ? "종료 시간은 시작 시간보다 늦어야 합니다."
      : null
  const ready =
    !timeError &&
    (!isMemo || title.trim().length > 0) &&
    // 새로 넣을 때 [추가]는 시간을 정한 경우다. 시간 미정은 왼쪽 버튼으로 넣는다.
    (!adding || start !== "")

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!ready) return
        onSubmit({
          title: isMemo ? title.trim() : undefined,
          start: start || undefined,
          end: end || undefined,
          note: note.trim() || undefined,
        })
      }}
    >
      <DialogHeader>
        <DialogTitle>
          {state.mode === "new-memo"
            ? "메모 항목 추가"
            : placing
              ? `${state.name} 추가`
              : editing?.name}
        </DialogTitle>
        <DialogDescription>
          Day {day} · {describe(state)}
        </DialogDescription>
      </DialogHeader>

      {isMemo && (
        <FormField id="item-title" label="메모 제목">
          <Input
            id="item-title"
            placeholder="예: 숙소 체크인"
            maxLength={30}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </FormField>
      )}

      <TimeSelect
        label="시작"
        value={start}
        onChange={setStart}
        defaultTime={placing ? state.window.after?.time : undefined}
      />
      <TimeSelect
        label="종료 (선택)"
        value={end}
        onChange={setEnd}
        defaultTime={oneHourAfter(start)}
        invalid={timeError !== null}
      />
      {timeError ? (
        <p role="alert" className="text-caption text-error-text">
          {timeError}
        </p>
      ) : (
        !adding && (
          <p className="text-caption text-brand-750">
            시작 시간을 비우면 &quot;시간 미정(--:--)&quot;으로 지금 자리에 남아요.
          </p>
        )
      )}

      {state.mode === "edit" && (
        <FormField id="item-note" label="메모 (선택)">
          <Input
            id="item-note"
            maxLength={50}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </FormField>
      )}

      <DialogFooter className="justify-between">
        {adding ? (
          <Button
            type="button"
            variant="outline"
            disabled={isMemo && title.trim().length === 0}
            onClick={() =>
              onSubmit({ title: isMemo ? title.trim() : undefined })
            }
          >
            시간 미정으로 넣기
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            disabled={!start && !end}
            onClick={() => {
              setStart("")
              setEnd("")
            }}
          >
            시간 미정으로
          </Button>
        )}
        <Button type="submit" disabled={!ready}>
          {state.mode === "edit" ? "저장" : "추가"}
        </Button>
      </DialogFooter>
    </form>
  )
}
