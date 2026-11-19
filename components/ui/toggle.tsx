"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Toggle as TogglePrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex h-10 shrink-0 items-center justify-center gap-2 px-3 text-body font-medium whitespace-nowrap transition outline-none select-none active:scale-95 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 lg:h-9 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /* 칩: 미선택 brand-300 테두리, 선택 brand-500(핑크) 채움 + 진한 테두리 */
        chip: "rounded-full border border-brand-500 bg-brand-0 text-brand-900 hover:bg-brand-150 data-[state=on]:border-brand-700 data-[state=on]:bg-brand-500 data-[state=on]:font-bold data-[state=on]:text-brand-900",
        /* 세그먼트 토글의 한 칸 */
        segment:
          "bg-brand-0 text-brand-900 hover:bg-brand-150 data-[state=on]:bg-brand-500 data-[state=on]:font-bold data-[state=on]:text-brand-900",
      },
    },
    defaultVariants: {
      variant: "chip",
    },
  }
)

function Toggle({
  className,
  variant = "chip",
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
