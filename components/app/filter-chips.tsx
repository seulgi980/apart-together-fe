"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export type ChipOption<T extends string> = {
  value: T
  label: string
  /** 라벨 뒤에 붙는 개수 ("전체 18") */
  count?: number
}

/**
 * 가로로 스크롤되는 칩 필터 한 줄 (취향 필터, 카테고리).
 * allowEmpty면 선택된 칩을 다시 눌러 해제할 수 있다.
 * 스크롤은 사이트 공통 ScrollArea(가로)를 쓴다.
 * 아래 여백(pb-1.5, lg:pb-3)은 막대(4px, lg 12px)가 칩을 가리지 않고 칩 아래에 놓이게 하는 자리다.
 */
export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
  allowEmpty = false,
  size = "default",
}: {
  label: string
  options: ChipOption<T>[]
  value: T | null
  onChange: (value: T | null) => void
  allowEmpty?: boolean
  /** sm: 모바일에서 칩을 작게 (일정 탭의 장소 풀). 웹은 같다. */
  size?: "default" | "sm"
}) {
  return (
    <ScrollArea orientation="horizontal" viewportClassName="pb-1.5 lg:pb-3">
      <ToggleGroup
        type="single"
        variant="chip"
        size={size}
        aria-label={label}
        value={value ?? ""}
        onValueChange={(next) => {
          if (next) onChange(next as T)
          else if (allowEmpty) onChange(null)
        }}
      >
        {options.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value}>
            {option.label}
            {option.count !== undefined && <span>{option.count}</span>}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </ScrollArea>
  )
}
