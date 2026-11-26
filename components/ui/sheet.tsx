"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Dialog as SheetPrimitive } from "radix-ui"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

/*
 * 시트(슬라이드 패널)에는 배경막(뒤 화면을 어둡게 덮는 막)을 두지 않는다.
 * - 채팅: 뒤 화면을 같이 조작하는 패널이라 가리면 안 된다
 * - 모바일 장소 상세: 화면을 꽉 채워서 덮을 뒤 화면도, 누를 바깥도 없다
 * 배경막은 "삭제할까요?" 같은 대화상자(dialog, alert-dialog)에만 둔다.
 * 대화상자·메뉴(z-50)는 시트(z-40) 위에 뜬다.
 */
const sheetVariants = cva(
  "fixed z-40 flex flex-col bg-popover text-body text-popover-foreground shadow-pop transition duration-200 ease-in-out data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
  {
    variants: {
      side: {
        right:
          "inset-y-0 right-0 h-full w-5/6 max-w-chat border-l data-[state=closed]:slide-out-to-right-10 data-[state=open]:slide-in-from-right-10",
        left: "inset-y-0 left-0 h-full w-5/6 max-w-chat border-r data-[state=closed]:slide-out-to-left-10 data-[state=open]:slide-in-from-left-10",
        bottom:
          "inset-x-0 bottom-0 rounded-t-xl border-t data-[state=closed]:slide-out-to-bottom-10 data-[state=open]:slide-in-from-bottom-10",
      },
    },
    defaultVariants: { side: "right" },
  }
)

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> &
  VariantProps<typeof sheetVariants> & {
    showCloseButton?: boolean
  }) {
  return (
    <SheetPortal>
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={side}
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close data-slot="sheet-close" asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
            >
              <XIcon />
              <span className="sr-only">닫기</span>
            </Button>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-title font-bold text-brand-900", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-caption text-brand-750", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
