"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cva } from "class-variance-authority"
import { ChevronDown, ChevronUp } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * 일정 화면의 장소 풀 (F4-4). 타임라인 영역 아래쪽에 붙어 있는 패널이다.
 * 2단계: 줄임(칩 줄 + 카드 가로 한 줄, 가로 스크롤) / 펼침(카드 여러 줄).
 * 위쪽 화살표 버튼을 눌러 전환한다.
 * 항상 떠 있는 패널이라 대화상자(모달)로 만들지 않는다. 뒤의 타임라인과 상단 탭을 그대로 누를 수 있어야 한다.
 */
export type PoolSnap = "collapsed" | "expanded"

/** 패널 높이: 줄임은 모바일 184 / 웹 200, 펼침은 영역 높이의 70% */
const panelVariants = cva(
  "absolute inset-x-0 bottom-0 z-30 flex min-h-0 flex-col rounded-t-xl border-t border-brand-500 bg-brand-200 text-body text-brand-900",
  {
    variants: {
      snap: {
        collapsed: "h-46 lg:h-50",
        expanded: "h-7/10",
      },
      disabled: {
        true: "pointer-events-none opacity-50",
        false: "",
      },
    },
  }
)

/** 접힘 상태에서는 제목 줄을 숨겨 손잡이 + 칩 줄 + 카드 한 줄만 남긴다 */
const titleRowVariants = cva("items-center justify-between gap-3", {
  variants: {
    snap: {
      collapsed: "hidden",
      expanded: "flex",
    },
  },
})

const listAreaVariants = cva("min-h-0 flex-1 px-4", {
  variants: {
    snap: {
      collapsed: "overflow-x-auto overflow-y-hidden pb-2",
      expanded: "overflow-x-hidden overflow-y-auto pb-4",
    },
  },
})

export function PlacePoolSheet({
  scope,
  snap,
  onSnapChange,
  container,
  count,
  disabled = false,
  filters,
  action,
  children,
}: {
  /** 공동 탭의 풀인지 개인 탭의 풀인지 */
  scope: "shared" | "personal"
  snap: PoolSnap
  onSnapChange: (snap: PoolSnap) => void
  /** 패널을 띄울 영역 (타임라인 영역) */
  container: HTMLElement | null
  count: number
  /** 다른 멤버 탭에서는 비활성 */
  disabled?: boolean
  filters: React.ReactNode
  /** 필터 줄 오른쪽 끝에 고정되는 버튼 (메모 항목 추가) */
  action?: React.ReactNode
  children: React.ReactNode
}) {
  if (!container) return null

  return createPortal(
    <section
      aria-label="장소 풀"
      inert={disabled}
      className={panelVariants({ snap, disabled })}
    >
      <Button
        variant="ghost"
        size="bare"
        className="relative min-h-6 w-full shrink-0 rounded-t-xl after:absolute after:inset-x-0 after:-inset-y-2"
        aria-label={snap === "collapsed" ? "장소 풀 펼치기" : "장소 풀 줄이기"}
        aria-expanded={snap === "expanded"}
        onClick={() =>
          onSnapChange(snap === "collapsed" ? "expanded" : "collapsed")
        }
      >
        {snap === "collapsed" ? <ChevronUp /> : <ChevronDown />}
      </Button>
      <div className="flex shrink-0 flex-col gap-2 px-4 pb-2">
        <div className={titleRowVariants({ snap })}>
          <h2 className="text-subtitle font-bold text-brand-900">
            장소 풀{" "}
            <span className="font-normal text-brand-750">{count}개</span>
          </h2>
          <p className="text-caption text-brand-750">
            {scope === "shared"
              ? "패스 카드는 제외됨"
              : "패스 카드 포함 전체"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">{filters}</div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </div>
      <div className={listAreaVariants({ snap })}>{children}</div>
    </section>,
    container
  )
}
