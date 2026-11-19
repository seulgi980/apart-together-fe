"use client"

import * as React from "react"
import { cva } from "class-variance-authority"

import { ChipSlider } from "@/components/app/chip-slider"
import { MemberAvatar } from "@/components/app/member-avatar"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { MemberView } from "@/lib/types"

/**
 * Day 칩 줄 (F4-3). 좌우 버튼으로 넘긴다.
 *
 *   <DayChips active={day} onChange={setDay}>
 *     {days.map((day) => <DayChip key={day} day={day} viewers={...} />)}
 *   </DayChips>
 */
export function DayChips({
  active,
  onChange,
  children,
}: {
  active: number
  onChange: (day: number) => void
  children: React.ReactNode
}) {
  return (
    <ToggleGroup
      type="single"
      variant="chip"
      aria-label="Day 선택"
      // 칩 위로 올라오는 "보는 중" 아바타가 잘리지 않도록 줄을 높게 잡는다
      className="h-16 w-full px-4 lg:px-8"
      value={String(active)}
      onValueChange={(next) => {
        if (next) onChange(Number(next))
      }}
    >
      <ChipSlider label="Day" revealKey={active}>
        {children}
      </ChipSlider>
    </ToggleGroup>
  )
}

/** 폭은 두 자리 Day(D99) 기준으로 고정해 D1과 D11의 크기가 같다 */
const chipVariants = cva("relative w-14 px-0", {
  variants: {
    /** 드래그한 항목을 놓을 수 있는 칩 */
    dropState: {
      idle: "",
      ready: "border-dashed border-brand-700",
      over: "border-dashed border-brand-700 bg-brand-250 ring-2 ring-brand-700",
    },
  },
  defaultVariants: { dropState: "idle" },
})

export function DayChip({
  day,
  viewers = [],
  dropState,
  ref,
}: {
  day: number
  /** 선택 여부는 DayChips의 active로 정해진다 (호출부 호환용) */
  active?: boolean
  /** 이 Day를 보고 있는 다른 멤버 (F4-16) */
  viewers?: MemberView[]
  dropState?: "idle" | "ready" | "over"
  ref?: React.Ref<HTMLButtonElement>
}) {
  return (
    <ToggleGroupItem
      ref={ref}
      value={String(day)}
      aria-label={
        viewers.length > 0 ? `Day ${day}, ${viewers.length}명이 보는 중` : `Day ${day}`
      }
      className={chipVariants({ dropState })}
    >
      D{day}
      {viewers.length > 0 && (
        <span
          className="absolute -top-3 -right-1 flex items-center"
          title={viewers.map((member) => member.nickname).join(", ")}
        >
          {/* 자리가 좁아 2명까지만 얼굴을 보이고, 3명부터는 1명 + "+나머지 수" */}
          {viewers.slice(0, viewers.length > 2 ? 1 : 2).map((member) => (
            <MemberAvatar key={member.id} member={member} size="sm" />
          ))}
          {viewers.length > 2 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full border border-brand-600 bg-brand-0 px-1 text-caption font-bold text-brand-900">
              +{viewers.length - 1}
            </span>
          )}
        </span>
      )}
    </ToggleGroupItem>
  )
}
