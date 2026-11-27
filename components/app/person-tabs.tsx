"use client"

import { ChipSlider } from "@/components/app/chip-slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { MemberView, ScheduleOwner } from "@/lib/types"

/**
 * 사람 탭 (F4-2). [공동] 탭은 맨 앞에 고정, 그 옆에 멤버 수만큼 탭이 생긴다.
 * 선택하지 않은 멤버 칩에는 멤버 색 점을 둔다.
 * 멤버가 많아 한 줄에 안 들어가면 좌우 버튼으로 넘긴다.
 */
export function PersonTabs({
  members,
  active,
  onChange,
}: {
  members: MemberView[]
  active: ScheduleOwner
  onChange: (owner: ScheduleOwner) => void
}) {
  return (
    <ToggleGroup
      type="single"
      variant="chip"
      size="sm"
      aria-label="일정 선택"
      className="h-10 w-full px-4 lg:h-12 lg:px-8"
      value={active}
      onValueChange={(next) => {
        if (next) onChange(next)
      }}
    >
      <ToggleGroupItem value="shared">공동</ToggleGroupItem>
      <span className="h-4 w-px shrink-0 bg-brand-350 lg:h-5" aria-hidden />
      <ChipSlider label="멤버" revealKey={active}>
          {members.map((member) => (
            <ToggleGroupItem
              key={member.id}
              value={member.id}
              data-member={member.color ?? undefined}
              className="group"
            >
              <span
                className="size-2 rounded-full bg-member group-data-[state=on]:bg-brand-900"
                aria-hidden
              />
              {member.nickname}
            </ToggleGroupItem>
          ))}
      </ChipSlider>
    </ToggleGroup>
  )
}
