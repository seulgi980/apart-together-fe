"use client"

import * as React from "react"
import { cva } from "class-variance-authority"
import { CalendarPlus, Lock } from "lucide-react"

import { EmptyState } from "@/components/app/empty-state"
import type { PoolSnap } from "@/components/app/place-pool-sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TimelineRow, type RowHandlers } from "@/features/schedule/timeline-row"
import type { RoomView } from "@/hooks/use-room"
import type { TimelineEntry } from "@/hooks/use-schedule"

/** 타임라인이 차지하는 영역: 장소 풀 시트 위쪽 (시트 높이만큼 아래를 비운다) */
const areaVariants = cva("absolute inset-x-0 top-0 p-2", {
  variants: {
    snap: {
      collapsed: "bottom-56",
      expanded: "bottom-7/10",
    },
  },
})

/**
 * 항목 사이의 틈. 평소에는 줄 간격(12px)만 차지하고,
 * 끌고 온 카드가 그 위에 오면 벌어지면서 놓일 자리가 연하게 보인다.
 */
const slotVariants = cva(
  "flex overflow-hidden transition-all duration-200 ease-out motion-reduce:transition-none",
  {
    variants: {
      open: {
        true: "h-20 py-3 opacity-100",
        false: "h-3 py-0 opacity-0",
      },
    },
  }
)

/** 끌고 있는 것을 놓으면 들어갈 자리 */
export type InsertPreview = {
  /** 몇 번째 틈인지 (0 = 맨 위, 항목 수 = 맨 아래) */
  index: number
  /** 끌고 있는 장소·메모 이름 */
  name: string
}

export function Timeline({
  room,
  day,
  entries,
  readOnly,
  ownerName,
  snap,
  insert,
  dragging,
  zoneRef,
  ...handlers
}: {
  room: RoomView
  day: number
  /** 시간 항목과 시간 미정 항목이 섞인, 화면에 보이는 순서 그대로의 한 줄 */
  entries: TimelineEntry[]
  /** 다른 멤버의 탭은 읽기 전용 (F4-2) */
  readOnly: boolean
  ownerName: string
  snap: PoolSnap
  insert: InsertPreview | null
  /** 무언가를 끌고 있는 중 (빈 타임라인에도 놓을 자리를 보여 준다) */
  dragging: boolean
  /** 스크롤되는 타임라인 영역. 놓을 틈을 계산할 때 쓴다. */
  zoneRef: React.Ref<HTMLDivElement>
} & RowHandlers) {
  const empty = entries.length === 0
  const rowProps = { room, day, readOnly, ...handlers }

  return (
    <div className={areaVariants({ snap })}>
      <ScrollArea
        viewportRef={zoneRef}
        className="h-full"
        viewportClassName="px-2 py-2 lg:px-6"
      >
        <div className="flex flex-col gap-3">
          {readOnly && (
            <p className="flex items-center gap-2 rounded-md bg-brand-250 px-3 py-2 text-caption text-brand-750">
              <Lock className="size-5 shrink-0" />
              {ownerName}님의 개인 일정이에요. 읽기 전용이라 수정할 수 없어요.
            </p>
          )}

          {empty && !dragging ? (
            <EmptyState
              icon={CalendarPlus}
              title={`Day ${day} 일정이 비어 있어요`}
              description={
                readOnly
                  ? "아직 배치된 일정이 없어요."
                  : "아래 장소 풀에서 카드를 끌어다 놓거나 + 버튼으로 배치해 보세요."
              }
            />
          ) : (
            <ol className="flex flex-col">
              {entries.map((entry, index) => (
                <React.Fragment key={entry.item.id}>
                  <DropSlot insert={insert} index={index} />
                  <TimelineRow entry={entry} {...rowProps} />
                </React.Fragment>
              ))}
              <DropSlot insert={insert} index={entries.length} />
            </ol>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function DropSlot({
  insert,
  index,
}: {
  insert: InsertPreview | null
  index: number
}) {
  const open = insert?.index === index
  return (
    <li aria-hidden className={slotVariants({ open })}>
      <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border-2 border-dashed border-brand-500 bg-brand-200 px-4">
        <span className="text-time font-medium text-brand-600">--:--</span>
        <span className="min-w-0 truncate text-body font-medium text-brand-700">
          {open ? insert.name : ""}
        </span>
        <span className="ml-auto shrink-0 text-caption text-brand-700">
          여기에 놓기
        </span>
      </div>
    </li>
  )
}
