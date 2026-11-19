"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"

/** 선택된 칩을 끌어올 때 옆 칩이 살짝 보이도록 남기는 여백(px) */
const PEEK = 24

/**
 * 칩 줄을 스크롤 대신 좌우 버튼으로 넘긴다 (사람 탭, Day 칩).
 * 칩이 한 줄에 다 들어가면 버튼은 나타나지 않는다.
 * 넘길 때는 살짝 튕기며 미끄러진다 (globals.css의 ease-spring).
 *
 *   <ChipSlider label="Day" revealKey={day}>{chips}</ChipSlider>
 */
export function ChipSlider({
  label,
  revealKey,
  children,
}: {
  /** 버튼 이름에 쓰는 말 ("Day" → "이전 Day 보기") */
  label: string
  /** 이 값이 바뀌면 선택된 칩(data-state="on")이 보이는 위치로 옮긴다 */
  revealKey?: string | number
  children: React.ReactNode
}) {
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const trackRef = React.useRef<HTMLDivElement>(null)
  const [size, setSize] = React.useState({ viewport: 0, track: 0 })
  const [offset, setOffset] = React.useState(0)

  React.useEffect(() => {
    const viewport = viewportRef.current
    const track = trackRef.current
    if (!viewport || !track) return
    const observer = new ResizeObserver(() => {
      const next = { viewport: viewport.clientWidth, track: track.offsetWidth }
      setSize((current) =>
        current.viewport === next.viewport && current.track === next.track
          ? current
          : next
      )
    })
    observer.observe(viewport)
    observer.observe(track)
    return () => observer.disconnect()
  }, [])

  const max = Math.max(0, size.track - size.viewport)
  const current = Math.min(offset, max)

  // 이동 거리는 값이 계속 바뀌므로 CSS 변수로 넘긴다 (translate-x-(--slide))
  React.useLayoutEffect(() => {
    trackRef.current?.style.setProperty("--slide", `${-current}px`)
  }, [current])

  /** 칩이 보이는 범위 밖에 있으면 범위 안으로 옮긴다 */
  const reveal = React.useCallback(
    (chip: HTMLElement) => {
      if (size.viewport === 0) return
      const start = chip.offsetLeft
      const end = start + chip.offsetWidth
      setOffset((previous) => {
        const shown = Math.min(previous, max)
        if (start < shown) return Math.max(0, start - PEEK)
        if (end > shown + size.viewport) {
          return Math.min(max, end - size.viewport + PEEK)
        }
        return previous
      })
    },
    [max, size.viewport]
  )

  React.useEffect(() => {
    const chip = trackRef.current?.querySelector<HTMLElement>('[data-state="on"]')
    if (chip) reveal(chip)
  }, [revealKey, reveal])

  const step = Math.round(size.viewport * 0.6)
  const overflowing = max > 0

  return (
    <div className="flex h-full min-w-0 flex-1 items-center gap-1">
      {overflowing && (
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={`이전 ${label} 보기`}
          disabled={current <= 0}
          onClick={() => setOffset(Math.max(0, current - step))}
        >
          <ChevronLeft />
        </Button>
      )}
      <div
        ref={viewportRef}
        className="flex h-full min-w-0 flex-1 items-center overflow-hidden"
        // 키보드 포커스로 브라우저가 직접 스크롤한 것은 되돌리고, 우리 방식으로 옮긴다
        onScroll={(event) => {
          event.currentTarget.scrollLeft = 0
        }}
        onFocus={(event) => {
          const chip = (event.target as HTMLElement).closest<HTMLElement>("button")
          if (chip) reveal(chip)
        }}
      >
        <div
          ref={trackRef}
          className="relative flex w-max translate-x-(--slide) items-center gap-3 px-1 transition-transform duration-700 ease-spring motion-reduce:transition-none"
        >
          {children}
        </div>
      </div>
      {overflowing && (
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          aria-label={`다음 ${label} 보기`}
          disabled={current >= max}
          onClick={() => setOffset(Math.min(max, current + step))}
        >
          <ChevronRight />
        </Button>
      )}
    </div>
  )
}
