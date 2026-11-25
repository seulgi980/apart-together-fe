import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 rounded-sm border border-transparent px-2 text-caption font-medium whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        /* 기본 태그: 링크 N, 유형 태그, 배치됨 */
        default: "border-brand-500 bg-brand-50 text-brand-750",
        /* 진한 배지 (선택됨 표시 등) */
        solid: "bg-private text-brand-0",
        outline: "border-brand-500 bg-brand-0 text-brand-750",
        like: "border-like-line bg-like-subtle text-brand-800",
        split: "bg-split-subtle text-split",
        pass: "bg-pass-subtle text-pass",
        destructive: "bg-danger-subtle text-danger",
        /* 멤버 색 배지 (data-member와 함께 사용) */
        member: "bg-member text-brand-900",
        /* 안 읽은 개수 */
        count: "h-5 min-w-5 rounded-full bg-error-text px-1 text-brand-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
