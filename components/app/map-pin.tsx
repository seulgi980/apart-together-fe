import * as React from "react"
import { cva } from "class-variance-authority"

import type { MemberColor } from "@/lib/types"

/**
 * 지도 핀 (F5).
 * - shared: 공동 일정. brand-900 원(32) + 순서 번호
 * - member: 개인 일정. 멤버 색 원(24) + 번호
 * - 선택되면 크기 40 + brand-500 3px 링
 * 색만으로 구분하지 않도록 항상 번호를 같이 표시한다.
 */
const pinVariants = cva(
  "absolute top-0 left-0 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 font-bold transition outline-none hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring",
  {
    variants: {
      kind: {
        shared: "border-brand-0 bg-brand-900 text-brand-0",
        member: "border-member-strong bg-member text-brand-900",
      },
      size: {
        shared: "size-8 text-body",
        member: "size-6 text-caption",
        selected: "z-10 size-10 text-body ring-3 ring-brand-700",
      },
    },
  }
)

export function MapPin({
  kind,
  selected = false,
  member,
  label,
  children,
  ...props
}: Omit<React.ComponentProps<"button">, "children"> & {
  kind: "shared" | "member"
  selected?: boolean
  member?: MemberColor | null
  /** 스크린리더용 설명 */
  label: string
  /** 순서 번호 */
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      data-map-pin
      data-member={member ?? undefined}
      aria-label={label}
      aria-pressed={selected}
      className={pinVariants({ kind, size: selected ? "selected" : kind })}
      {...props}
    >
      {children}
    </button>
  )
}
