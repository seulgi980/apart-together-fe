"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

type ToggleVariant = NonNullable<VariantProps<typeof toggleVariants>["variant"]>

const toggleGroupVariants = cva("flex w-fit shrink-0 flex-row items-center", {
  variants: {
    variant: {
      chip: "gap-3",
      segment:
        "overflow-hidden rounded-md border border-brand-500 bg-brand-0",
    },
  },
  defaultVariants: { variant: "chip" },
})

const ToggleGroupContext = React.createContext<ToggleVariant>("chip")

function ToggleGroup({
  className,
  variant = "chip",
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> & {
  variant?: ToggleVariant
}) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant}
      className={cn(toggleGroupVariants({ variant }), className)}
      {...props}
    >
      <ToggleGroupContext.Provider value={variant}>
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
  const variant = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={variant}
      className={cn(toggleVariants({ variant }), className)}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
}

export { ToggleGroup, ToggleGroupItem }
