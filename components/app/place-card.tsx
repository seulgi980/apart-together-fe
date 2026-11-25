import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check } from "lucide-react"
import { Slot } from "radix-ui"

import { statusSurface, statusTitleColor } from "@/lib/status-styles"
import type { PlaceStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * 장소 카드. 어디서나 이 컴포넌트 하나를 쓴다 (장소 목록, 장소 풀).
 * 모양은 status(취향 상태)와 size로만 바뀐다.
 *
 *   <PlaceCard status="like" size="list">
 *     <PlaceCard.Body>
 *       <PlaceCard.Header name="센소지" badge={...} />
 *       <PlaceCard.Meta>관광 · 아사쿠사</PlaceCard.Meta>
 *       <PlaceCard.Votes>...</PlaceCard.Votes>
 *     </PlaceCard.Body>
 *     <PlaceCard.Actions>...</PlaceCard.Actions>
 *   </PlaceCard>
 */

/* 고르거나 풀 때 크기·테두리·빛이 끊기지 않고 부드럽게 바뀌도록 transition을 길게(살짝 튕기게) 준다 */
const cardVariants = cva(
  "relative flex min-w-0 flex-col transition-[scale,box-shadow,border-color,opacity] duration-300 ease-spring motion-reduce:transition-none",
  {
  variants: {
    size: {
      /** 장소 목록 카드 */
      list: "h-full gap-3 p-4 hover:scale-102 hover:shadow-pop lg:p-5",
      /** 장소 풀 카드 */
      compact: "h-full gap-1 p-3",
    },
    selected: {
      /* 선택된 카드: 핫핑크 테두리 + 바깥 빛으로 커지며 떠오른다. 오른쪽 위에 "선택됨" 배지가 붙는다. */
      true: "z-10 scale-106 border-solid! border-select! shadow-select! hover:scale-106",
      false: "",
    },
    dimmed: {
      true: "opacity-50",
      false: "",
    },
  },
  defaultVariants: { size: "list", selected: false, dimmed: false },
  }
)

const bodyVariants = cva(
  "flex min-w-0 flex-col rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
  {
    variants: {
      size: {
        list: "gap-3",
        compact: "gap-1",
      },
    },
  }
)

const titleVariants = cva("min-w-0 truncate font-bold", {
  variants: {
    size: {
      list: "text-subtitle",
      compact: "text-body",
    },
  },
})

type CardContext = { status: PlaceStatus; size: "list" | "compact" }
const PlaceCardContext = React.createContext<CardContext>({
  status: "unrated",
  size: "list",
})

type PlaceCardProps = React.ComponentProps<"article"> &
  VariantProps<typeof cardVariants> & {
    status: PlaceStatus
  }

function PlaceCardRoot({
  status,
  size = "list",
  selected,
  dimmed,
  className,
  children,
  ...props
}: PlaceCardProps) {
  const context = React.useMemo(
    () => ({ status, size: size ?? "list" }),
    [status, size]
  )
  return (
    <PlaceCardContext.Provider value={context}>
      <article
        data-status={status}
        className={cn(
          statusSurface({ status }),
          cardVariants({ size, selected, dimmed }),
          className
        )}
        {...props}
      >
        {children}
        {selected && (
          <span className="pointer-events-none absolute -top-2.5 -right-2 z-10 inline-flex items-center gap-0.5 rounded-full bg-select py-0.5 pr-2 pl-1.5 text-caption font-bold text-white shadow-pop animate-in fade-in zoom-in-75 duration-300 motion-reduce:animate-none">
            <Check aria-hidden className="size-3.5" strokeWidth={3} />
            선택됨
          </span>
        )}
      </article>
    </PlaceCardContext.Provider>
  )
}

/** 카드 본문. asChild로 링크나 버튼을 넘기면 누를 수 있는 영역이 된다. */
function PlaceCardBody({
  asChild,
  className,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const { size } = React.useContext(PlaceCardContext)
  const Comp = asChild ? Slot.Root : "div"
  return (
    <Comp
      className={cn(bodyVariants({ size }), className)}
      {...props}
    />
  )
}

function PlaceCardHeader({
  name,
  badge,
}: {
  name: string
  badge?: React.ReactNode
}) {
  const { status, size } = React.useContext(PlaceCardContext)
  return (
    <div className="flex items-start justify-between gap-3">
      <h3 className={cn(titleVariants({ size }), statusTitleColor({ status }))}>
        {name}
      </h3>
      {badge && <div className="flex shrink-0 items-center gap-1">{badge}</div>}
    </div>
  )
}

function PlaceCardMeta({ children }: { children: React.ReactNode }) {
  return <p className="truncate text-caption text-brand-750">{children}</p>
}

function PlaceCardVotes({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-7 items-center justify-between gap-3">
      {children}
    </div>
  )
}

function PlaceCardActions({ children }: { children: React.ReactNode }) {
  return <div className="mt-auto flex flex-col gap-2">{children}</div>
}

function PlaceCardFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-auto flex flex-wrap items-center gap-1 pt-1">
      {children}
    </div>
  )
}

export const PlaceCard = Object.assign(PlaceCardRoot, {
  Body: PlaceCardBody,
  Header: PlaceCardHeader,
  Meta: PlaceCardMeta,
  Votes: PlaceCardVotes,
  Actions: PlaceCardActions,
  Footer: PlaceCardFooter,
})
