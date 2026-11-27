"use client"

import * as React from "react"
import {
  ScrollArea as ScrollAreaPrimitive,
  Select as SelectPrimitive,
} from "radix-ui"
import { CheckIcon, ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { ScrollBar } from "@/components/ui/scroll-area"

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-brand-0 px-3 text-body text-brand-900 transition-colors outline-none hover:bg-brand-50 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[placeholder]:text-brand-700 lg:h-10 [&_svg]:size-5 [&_svg]:shrink-0 [&_svg]:text-brand-700",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        sideOffset={4}
        className={cn(
          "relative z-50 min-w-(--radix-select-trigger-width) overflow-hidden rounded-lg border border-line bg-popover text-popover-foreground shadow-pop data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
          className
        )}
        {...props}
      >
        {/*
         * 목록 스크롤은 사이트 공통 ScrollArea 막대로 그린다 (폰에서도 핑크).
         * Select의 Viewport와 ScrollArea의 Viewport를 같은 요소 하나로 합쳐서(asChild),
         * Select가 고른 항목으로 스크롤해 주는 동작을 그대로 쓴다.
         * Select가 넣는 overflow(한 줄 표기)는 지우고 ScrollArea의 overflowX/overflowY만 남긴다
         * (둘이 섞이면 React가 경고한다).
         */}
        <ScrollAreaPrimitive.Root
          type="always"
          className="relative overflow-hidden"
        >
          <SelectPrimitive.Viewport asChild>
            <ScrollAreaPrimitive.Viewport
              className="max-h-60 w-full p-1 pr-1.5 lg:pr-3 [&>div]:block!"
              // 디자인 값이 아니라 Select가 넣는 인라인 overflow를 지우는 용도라 인라인 스타일 규칙의 예외로 둔다
              // eslint-disable-next-line no-restricted-syntax
              style={{ overflow: undefined }}
            >
              {children}
            </ScrollAreaPrimitive.Viewport>
          </SelectPrimitive.Viewport>
          <ScrollBar />
        </ScrollAreaPrimitive.Root>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex min-h-10 cursor-default items-center gap-2 rounded-md py-1 pr-8 pl-3 text-body text-brand-900 outline-none select-none focus:bg-brand-150 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[state=checked]:font-bold",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <span className="absolute right-2 flex items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-5 text-brand-700" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  )
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
