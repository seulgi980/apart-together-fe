"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

type ToggleVariant = NonNullable<VariantProps<typeof toggleVariants>["variant"]>
type ToggleSize = NonNullable<VariantProps<typeof toggleVariants>["size"]>

const toggleGroupVariants = cva("flex w-fit shrink-0 flex-row items-center", {
  variants: {
    variant: {
      chip: "gap-3",
      segment:
        "overflow-hidden rounded-md border border-brand-500 bg-brand-0",
    },
    size: {
      default: "",
      /* 작은 칩은 칩 사이도 좁힌다 (웹은 그대로) */
      sm: "",
    },
  },
  compoundVariants: [{ variant: "chip", size: "sm", className: "gap-2 lg:gap-3" }],
  defaultVariants: { variant: "chip", size: "default" },
})

const ToggleGroupContext = React.createContext<{
  variant: ToggleVariant
  size: ToggleSize
}>({ variant: "chip", size: "default" })

function ToggleGroup({
  className,
  variant = "chip",
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> & {
  variant?: ToggleVariant
  /** sm: 모바일에서 칩을 32px로 작게 (웹은 default와 같다) */
  size?: ToggleSize
}) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant}
      className={cn(toggleGroupVariants({ variant, size }), className)}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
}

function ToggleGroupItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  const { variant, size } = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={variant}
      className={cn(toggleVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
}

export { ToggleGroup, ToggleGroupItem }
