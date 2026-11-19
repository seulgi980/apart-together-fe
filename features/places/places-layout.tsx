"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { cva } from "class-variance-authority"

import { PlaceList } from "@/features/places/place-list"
import { useRoom, useRoomId } from "@/hooks/use-room"

/**
 * 장소 화면의 틀.
 * - 모바일: 목록 또는 상세 중 하나만 보인다.
 * - 웹: 왼쪽 목록(나머지 폭) + 오른쪽 상세 패널(폭 440).
 * 목록은 레이아웃에 있어서 카드를 골라도 스크롤과 필터가 유지된다.
 */
const listPane = cva("relative min-h-0 min-w-0 flex-1 flex-col", {
  variants: {
    detailOpen: {
      true: "hidden lg:flex",
      false: "flex",
    },
  },
})

const detailPane = cva(
  "min-h-0 flex-col bg-brand-50 lg:w-detail lg:flex-none lg:border-l lg:border-line",
  {
    variants: {
      detailOpen: {
        true: "flex min-w-0 flex-1",
        false: "hidden lg:flex",
      },
    },
  }
)

export function PlacesLayout({ children }: { children: React.ReactNode }) {
  const roomId = useRoomId()
  const { placeId } = useParams<{ placeId?: string }>()
  const view = useRoom(roomId)
  if (!view) return null
  const detailOpen = Boolean(placeId)

  return (
    <div className="flex min-h-0 flex-1">
      <section className={listPane({ detailOpen })} aria-label="장소 목록">
        <PlaceList view={view} selectedId={placeId} />
      </section>
      <aside className={detailPane({ detailOpen })} aria-label="장소 상세">
        {children}
      </aside>
    </div>
  )
}
