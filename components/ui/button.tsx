import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent text-body font-medium whitespace-nowrap transition outline-none select-none active:scale-95 focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /* 주요 버튼 */
        default:
          "bg-brand-500 text-brand-900 hover:bg-brand-550 active:bg-brand-600",
        /* 보조 버튼 */
        outline:
          "border-brand-600 bg-brand-0 text-brand-750 hover:bg-brand-150 active:bg-brand-200",
        secondary:
          "bg-brand-250 text-brand-750 hover:bg-brand-350 active:bg-brand-350",
        ghost: "text-brand-750 hover:bg-brand-200 active:bg-brand-250",
        destructive:
          "border-danger bg-brand-0 text-danger hover:bg-danger-subtle active:bg-danger-subtle",
        link: "text-brand-750 underline-offset-4 hover:underline",
      },
      size: {
        /* 주요 버튼: 모바일 44 / 웹 40 */
        default: "h-11 px-4 lg:h-10",
        /* 칩·투표 버튼 높이: 모바일 40 / 웹 36 */
        sm: "h-10 px-3 lg:h-9",
        icon: "size-10 lg:size-9",
        fab: "h-12 rounded-full px-5 shadow-pop hover:scale-105",
        /* 높이를 내용에 맡기는 버튼 (타임라인 시간, 시트 손잡이 등) */
        bare: "min-h-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
