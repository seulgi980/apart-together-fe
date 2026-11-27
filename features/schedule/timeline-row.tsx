"use client"

import * as React from "react"
import { useDraggable } from "@dnd-kit/core"
import { cva } from "class-variance-authority"
import {
  ArrowRightLeft,
  Clock,
  GripVertical,
  MoreVertical,
  Trash2,
  Undo2,
} from "lucide-react"

import { TimelineItem, type TimelineVariant } from "@/components/app/timeline-item"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  DRAG_SOURCE_ATTRIBUTE,
  itemDragId,
  TIMELINE_ROW_ATTRIBUTE,
  type DragData,
} from "@/features/schedule/dnd"
import { useIsRecent } from "@/hooks/use-is-recent"
import type { RoomView } from "@/hooks/use-room"
import type { TimelineEntry } from "@/hooks/use-schedule"
import { useStore } from "@/lib/store/store"
import { CATEGORY_LABEL } from "@/lib/domain/labels"

const CHANGE_TEXT = {
  added: "방금 추가됨",
  moved: "방금 이동됨",
  time: "방금 시간 변경됨",
  edited: "방금 수정됨",
} as const

/** 끌고 있는 항목은 제자리에서 흐리게 보인다 */
const rowVariants = cva("", {
  variants: {
    dragging: {
      true: "opacity-50",
      false: "",
    },
  },
})

/** 넘어온 항목을 강조해 두는 시간 */
const FOCUS_MS = 3500

/** 카드: 마우스를 올리면 살짝 커지며 떠오른다. 강조 중에는 테두리가 깜빡인다. */
const cardVariants = cva(
  "transition hover:z-10 hover:scale-102 hover:border-brand-600 hover:shadow-pop",
  {
    variants: {
      focused: {
        true: "animate-pulse border-brand-700 ring-3 ring-brand-700",
        false: "",
      },
      /** 장소 풀에서 고른 카드로 넣은 항목: 연한 핫핑크 테두리가 커졌다 작아졌다 한다 */
      picked: {
        true: "border-select-soft outline-2 outline-offset-1 outline-select-soft animate-pulse-ring motion-reduce:animate-none",
        false: "",
      },
    },
  }
)

export type RowHandlers = {
  onOpenPlace: (placeId: string) => void
  onEditTime: (entry: TimelineEntry) => void
  onMoveDay: (entry: TimelineEntry, day: number) => void
  onRemove: (entry: TimelineEntry) => void
}

type RowProps = {
  entry: TimelineEntry
  room: RoomView
  day: number
  readOnly: boolean
} & RowHandlers

/**
 * 타임라인의 한 줄.
 * 시간이 정해진 항목은 시간순으로 자리가 정해지므로 끌 수 없다.
 * 시간 미정 항목만 왼쪽 손잡이로 끌어서 다른 틈이나 다른 Day로 옮긴다 (F4-12, F4-13).
 */
export function TimelineRow(props: RowProps) {
  const { entry, readOnly } = props
  const movable = !readOnly && !entry.item.start
  const data: DragData = { type: "item", entry }
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, isDragging } =
    useDraggable({ id: itemDragId(entry.item.id), data, disabled: !movable })

  return (
    <RowBody
      {...props}
      rowRef={setNodeRef}
      dragging={isDragging}
      handle={
        movable && (
          <DragHandle
            ref={setActivatorNodeRef}
            label={`${entry.name} 끌어서 옮기기`}
            {...listeners}
            {...attributes}
          />
        )
      }
    />
  )
}

function DragHandle({
  label,
  ref,
  ...props
}: React.ComponentProps<"button"> & { label: string }) {
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className="-ml-1.5 size-8 cursor-grab touch-none text-brand-750 hover:bg-brand-250 lg:-ml-2 lg:size-9"
      aria-label={label}
      {...props}
    >
      <GripVertical />
    </Button>
  )
}

function RowBody({
  entry,
  room,
  day,
  readOnly,
  rowRef,
  dragging,
  handle,
  onOpenPlace,
  onEditTime,
  onMoveDay,
  onRemove,
}: RowProps & {
  rowRef: (node: HTMLLIElement | null) => void
  dragging: boolean
  handle: React.ReactNode
}) {
  const { item, place } = entry
  // 방금 바뀐 항목을 30초간 하이라이트한다 (F4-17). 내가 바꾼 것도 내 닉네임으로 보여 준다.
  const recent = useIsRecent(item.changedAt)
  const changer =
    recent && item.changedBy ? room.getMember(item.changedBy) : null

  let variant: TimelineVariant = "normal"
  if (item.kind === "memo") variant = "memo"
  if (!item.start) variant = item.kind === "memo" ? "memo" : "unscheduled"
  if (changer) variant = "highlighted"

  const sub = [
    item.kind === "memo" ? "메모" : entry.category && CATEGORY_LABEL[entry.category],
    item.note,
  ]
    .filter(Boolean)
    .join(" · ")

  // 카드가 남아 있으면 상세로 이동할 수 있다
  const canOpen = place !== undefined
  const text = (
    <TimelineItem.Text
      name={entry.name}
      sub={sub}
      badge={
        changer && (
          <Badge variant="member">
            {changer.nickname} · {CHANGE_TEXT[item.changeType ?? "moved"]}
          </Badge>
        )
      }
    />
  )

  // 장소 풀에서 고른 카드로 넣은 항목
  const picked = useStore(
    (state) => state.poolSelectedId !== null && state.poolSelectedId === item.placeId
  )
  // [일정으로 이동]으로 넘어온 항목: 화면 안으로 끌어오고 잠깐 강조한다
  const focused = useStore((state) => state.focusItemId === item.id)
  const nodeRef = React.useRef<HTMLLIElement | null>(null)
  React.useEffect(() => {
    if (!focused) return
    nodeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" })
    const timer = window.setTimeout(
      () => useStore.getState().setFocusItem(null),
      FOCUS_MS
    )
    return () => window.clearTimeout(timer)
  }, [focused])

  return (
    <TimelineItem
      ref={(node) => {
        nodeRef.current = node
        rowRef(node)
      }}
      variant={variant}
      member={changer?.color}
      className={rowVariants({ dragging })}
      {...{ [TIMELINE_ROW_ATTRIBUTE]: "", [DRAG_SOURCE_ATTRIBUTE]: "" }}
    >
      <TimelineItem.Time
        start={item.start}
        end={item.end}
        disabled={readOnly}
        onClick={() => onEditTime(entry)}
      />
      <TimelineItem.Rail />
      <TimelineItem.Card className={cardVariants({ focused, picked: picked && !focused })}>
        {handle}
        {canOpen ? (
          <button
            type="button"
            className="flex min-w-0 flex-1 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`${entry.name} 상세 보기`}
            onClick={() => onOpenPlace(place.id)}
          >
            {text}
          </button>
        ) : (
          text
        )}
        {!readOnly && (
          <>
            {/* 모바일은 장소명이 잘리지 않게 이 버튼을 빼고, 시간을 누르거나 ⋯ 메뉴에서 연다 */}
            <Button
              variant="outline"
              size="sm"
              className="hidden lg:inline-flex"
              aria-label={`${entry.name} 시간·메모 편집`}
              onClick={() => onEditTime(entry)}
            >
              <Clock />
              <span className="hidden lg:inline">시간·메모</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="-mr-1.5 size-8 text-brand-750 lg:-mr-2 lg:size-9"
                  aria-label={`${entry.name} 메뉴`}
                >
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  className="lg:hidden"
                  onSelect={() => onEditTime(entry)}
                >
                  <Clock />
                  시간·메모 편집
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <ArrowRightLeft />
                    Day 이동
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {Array.from({ length: room.days }, (_, index) => index + 1)
                      .filter((target) => target !== day)
                      .map((target) => (
                        <DropdownMenuItem
                          key={target}
                          onSelect={() => onMoveDay(entry, target)}
                        >
                          Day {target}
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => onRemove(entry)}
                >
                  {item.kind === "memo" ? <Trash2 /> : <Undo2 />}
                  {item.kind === "memo" ? "메모 삭제" : "일정에서 제외"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </TimelineItem.Card>
    </TimelineItem>
  )
}
