"use client"

import * as React from "react"
import { useDraggable } from "@dnd-kit/core"
import { cva } from "class-variance-authority"
import { Inbox, Plus } from "lucide-react"

import { EmptyState } from "@/components/app/empty-state"
import { PlaceCard } from "@/components/app/place-card"
import type { PoolSnap } from "@/components/app/place-pool-sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DRAG_SOURCE_ATTRIBUTE,
  poolDragId,
  type DragData,
} from "@/features/schedule/dnd"
import type { PoolEntry } from "@/hooks/use-schedule"
import { CATEGORY_LABEL } from "@/lib/domain/labels"
import { statusText } from "@/lib/domain/status"

/** 카드 열: 줄임은 가로 한 줄, 펼침은 모바일 2열 / 웹 4열 */
const listVariants = cva("", {
  variants: {
    snap: {
      collapsed: "flex h-full flex-nowrap gap-2",
      expanded: "grid grid-cols-2 gap-2 lg:grid-cols-4",
    },
  },
})

const cellVariants = cva("", {
  variants: {
    snap: {
      collapsed: "w-48 shrink-0 lg:w-56",
      expanded: "min-w-0",
    },
  },
})

/** 풀 카드는 언제나 끌 수 있다 */
const DRAGGABLE_CLASS =
  "cursor-grab touch-manipulation transition select-none hover:z-10 hover:scale-102 hover:shadow-pop"

/** 장소 풀의 카드 목록 */
export function PoolList({
  entries,
  snap,
  selectedId,
  onAdd,
  onOpen,
}: {
  entries: PoolEntry[]
  snap: PoolSnap
  /** 골라 둔 카드 (선택 표시) */
  selectedId: string | null
  /** + 버튼: 드래그의 보조 수단 (F4-5) */
  onAdd: (entry: PoolEntry) => void
  /** 카드를 누르면 고르면서 장소 상세를 연다. 고른 카드를 다시 누르면 풀린다. */
  onOpen: (entry: PoolEntry) => void
}) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="조건에 맞는 카드가 없어요"
        description="필터를 바꾸거나 장소 목록에서 카드를 추가해 보세요."
      />
    )
  }
  return (
    <ul className={listVariants({ snap })}>
      {entries.map((entry) => (
        <li key={entry.place.id} className={cellVariants({ snap })}>
          <PoolCard
            entry={entry}
            selected={entry.place.id === selectedId}
            onAdd={() => onAdd(entry)}
            onOpen={() => onOpen(entry)}
          />
        </li>
      ))}
    </ul>
  )
}

function PoolCard({
  entry,
  selected,
  onAdd,
  onOpen,
}: {
  entry: PoolEntry
  selected: boolean
  onAdd: () => void
  onOpen: () => void
}) {
  // 같은 카드를 몇 번이든 넣을 수 있어서 언제나 끌 수 있다 (F4-20)
  const data: DragData = { type: "pool", entry }
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: poolDragId(entry.place.id),
    data,
  })

  return (
    <PoolCardView
      ref={setNodeRef}
      entry={entry}
      dimmed={isDragging}
      selected={selected}
      className={DRAGGABLE_CLASS}
      {...{ [DRAG_SOURCE_ATTRIBUTE]: "" }}
      onClick={onOpen}
      action={
        <Button
          variant="ghost"
          size="icon"
          className="-my-2 -mr-2 ml-auto"
          aria-label={`${entry.place.name} 일정에 추가`}
          onClick={(event) => {
            event.stopPropagation()
            onAdd()
          }}
        >
          <Plus />
        </Button>
      }
      {...listeners}
      {...attributes}
    />
  )
}

/** 카드 모양만 (드래그 중 따라다니는 카드에도 쓴다) */
export function PoolCardView({
  entry,
  dimmed,
  action,
  ...props
}: Omit<React.ComponentProps<typeof PlaceCard>, "status" | "size"> & {
  entry: PoolEntry
  action?: React.ReactNode
}) {
  const { place, summary, placedItems } = entry
  const meta = [
    CATEGORY_LABEL[place.category],
    statusText(summary),
    place.references.length > 0 ? `링크 ${place.references.length}` : null,
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <PlaceCard
      status={summary.status}
      size="compact"
      dimmed={dimmed}
      {...props}
    >
      <PlaceCard.Header name={place.name} />
      <PlaceCard.Meta>{meta}</PlaceCard.Meta>
      <PlaceCard.Footer>
        {placedItems.length > 0 ? (
          <Badge>{placedItems.length}번 배치됨</Badge>
        ) : (
          <Badge variant="like">드래그해서 배치</Badge>
        )}
        {action}
      </PlaceCard.Footer>
    </PlaceCard>
  )
}
