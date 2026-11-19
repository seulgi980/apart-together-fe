"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { PlaceDetail } from "@/features/places/place-detail"
import { useIsDesktop } from "@/hooks/use-is-desktop"
import { useStore } from "@/lib/store/store"

/**
 * 일정 화면에서 여는 장소 상세.
 * 장소 풀의 카드나 타임라인 항목을 누르면 페이지 이동 없이 열린다.
 * - 웹: 오른쪽 채팅 자리에 상세 패널. 채팅과 둘 다 열려 있으면 나중에 연 쪽이 보인다.
 * - 모바일: 화면을 덮는 슬라이드 패널
 */
export function SchedulePlacePanel() {
  const pathname = usePathname()
  const isDesktop = useIsDesktop()
  const placeId = useStore((state) => state.schedulePlaceId)
  const setPlace = useStore((state) => state.setSchedulePlace)
  // 나중에 연 채팅이 이 자리를 차지하고 있으면 그 뒤에 숨는다 (채팅을 닫으면 다시 보인다)
  const behindChat = useStore(
    (state) => state.chatDocked && state.scheduleFront === "chat"
  )
  const onSchedule = pathname.endsWith("/schedule")
  const close = React.useCallback(() => setPlace(null), [setPlace])

  // 일정 화면을 벗어나면 열어 둔 상세를 닫는다
  React.useEffect(() => {
    if (!onSchedule) close()
  }, [onSchedule, close])

  if (!placeId || !onSchedule) return null

  if (isDesktop) {
    if (behindChat) return null
    return (
      <aside
        aria-label="장소 상세"
        className="flex min-h-0 w-detail shrink-0 flex-col border-l border-line bg-brand-50"
      >
        <PlaceDetail key={placeId} placeId={placeId} onClose={close} />
      </aside>
    )
  }

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) close()
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        aria-describedby={undefined}
        className="w-full max-w-full bg-brand-50"
      >
        <SheetTitle className="sr-only">장소 상세</SheetTitle>
        <PlaceDetail key={placeId} placeId={placeId} onClose={close} />
      </SheetContent>
    </Sheet>
  )
}
