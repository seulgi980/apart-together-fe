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
 */
export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
  allowEmpty = false,
}: {
  label: string
  options: ChipOption<T>[]
  value: T | null
  onChange: (value: T | null) => void
  allowEmpty?: boolean
}) {
  return (
    <ScrollArea className="min-w-0">
      <ToggleGroup
        type="single"
        variant="chip"
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
