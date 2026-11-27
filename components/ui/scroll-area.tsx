"use client"

import * as React from "react"
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * 사이트 공통 스크롤 영역 (shadcn ScrollArea 기반).
 * 브라우저 기본 막대를 숨기고 핑크 막대를 직접 그린다. 폰 브라우저의 기본 막대는 색을 바꿀 수 없어서
 * (회색으로 나온다) PC와 폰 모두 이 컴포넌트로 통일한다. 막대 끌기, 트랙 클릭은 Radix가 처리한다.
 *
 * - 막대는 항상 보인다 (지금 어디쯤인지, 얼마나 남았는지 보이게).
 * - 두께: lg 이상 12px(안쪽 8px), lg 미만 4px.
 * - 막대는 내용 위에 겹쳐 그려진다. 막대 쪽 가장자리에 막대 두께만큼 여백을 둔다.
 *
 * className은 바깥(자리 잡기용), viewportClassName은 실제로 스크롤되는 안쪽에 붙는다.
 * 스크롤 위치를 읽거나 바꿀 때는 viewportRef를 쓴다.
 */
function ScrollArea({
  className,
  viewportClassName,
  viewportRef,
  onScroll,
  orientation = "vertical",
  children,
  ...props
}: Omit<React.ComponentProps<typeof ScrollAreaPrimitive.Root>, "onScroll"> & {
  orientation?: "vertical" | "horizontal"
  viewportClassName?: string
  viewportRef?: React.Ref<HTMLDivElement>
  onScroll?: React.UIEventHandler<HTMLDivElement>
}) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      type="always"
      className={cn("relative min-h-0 min-w-0 overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        onScroll={onScroll}
        data-slot="scroll-area-viewport"
        className={cn(
          "size-full rounded-[inherit]",
          // Radix는 안쪽을 table로 감싸 가로로 늘어나게 한다. 세로 스크롤에서는 block으로 되돌려
          // 말줄임(truncate)과 너비 100% 배치가 깨지지 않게 한다.
          orientation === "vertical" && "[&>div]:block!",
          viewportClassName
        )}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar orientation={orientation} />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "z-10 flex touch-none select-none lg:p-0.5",
        orientation === "vertical" && "h-full w-1 lg:w-3",
        orientation === "horizontal" && "h-1 flex-col lg:h-3",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-brand-450 hover:bg-brand-550 active:bg-brand-550"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
