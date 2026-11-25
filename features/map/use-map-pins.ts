"use client"

import { useMemo } from "react"

import type { RoomView } from "@/hooks/use-room"
import { sortTimeline } from "@/lib/domain/schedule"
import { summarizeVotes, statusText } from "@/lib/domain/status"
import { CATEGORY_LABEL } from "@/lib/domain/labels"
import { useStore } from "@/lib/store/store"
import type { MemberView, Place, ScheduleItem } from "@/lib/types"

/** 지도에 찍는 핀 하나 */
export type MapPinData = {
  key: string
  kind: "shared" | "member"
  /** 일정 순서 번호 (F5-1) */
  order: number
  item: ScheduleItem
  place: MapPlace
  member?: MemberView
  /** 요약 카드의 보조 문구: "관광 · 공동 일정 · 좋아요 3/4" */
  meta: string
}

/** 좌표가 있어서 지도에 찍을 수 있는 장소 */
export type MapPlace = Place & { lat: number; lng: number }

export function hasCoordinates(place: Place): place is MapPlace {
  return place.lat !== null && place.lng !== null
}

export type MapListRow =
  | { type: "pin"; pin: MapPinData }
  /** 메모 항목은 장소가 없어서 지도에 표시되지 않는다 (F4-15) */
  | { type: "memo"; item: ScheduleItem }

export type MapSchedule = {
  owner: "shared" | MemberView
  rows: MapListRow[]
  pins: MapPinData[]
}

/**
 * 선택한 Day의 지도 핀 (F5).
 * 공동 일정은 항상, 개인 일정은 켜 둔 멤버만 포함한다.
 */
export function useMapPins(
  room: RoomView,
  day: number,
  memberIds: string[]
): { shared: MapSchedule; personal: MapSchedule[] } {
  const items = useStore((state) => state.items)
  const places = useStore((state) => state.places)
  const roomId = room.room.id

  return useMemo(() => {
    const allMemberIds = room.members.map((member) => member.id)

    const build = (owner: "shared" | MemberView): MapSchedule => {
      const ownerId = owner === "shared" ? "shared" : owner.id
      const dayItems = items.filter(
        (item) =>
          item.roomId === roomId && item.owner === ownerId && item.day === day
      )
      const rows: MapListRow[] = []
      const pins: MapPinData[] = []
      for (const item of sortTimeline(dayItems)) {
        const place = places.find((candidate) => candidate.id === item.placeId)
        if (item.kind === "memo" || !place || !hasCoordinates(place)) {
          // 메모 항목, 좌표가 없는 장소, 지워진 카드는 핀 없이 목록에만 보여준다 (F5-1)
          const title = item.title ?? place?.name ?? item.placeName
          rows.push({ type: "memo", item: title ? { ...item, title } : item })
          continue
        }
        const summary = summarizeVotes(place, allMemberIds)
        const meta = [
          CATEGORY_LABEL[place.category],
          owner === "shared" ? "공동 일정" : `${owner.nickname} 개인 일정`,
          statusText(summary),
        ].join(" · ")
        const pin: MapPinData = {
          key: item.id,
          kind: owner === "shared" ? "shared" : "member",
          order: pins.length + 1,
          item,
          place,
          member: owner === "shared" ? undefined : owner,
          meta,
        }
        pins.push(pin)
        rows.push({ type: "pin", pin })
      }
      return { owner, rows, pins }
    }

    return {
      shared: build("shared"),
      personal: room.members
        .filter((member) => memberIds.includes(member.id))
        .map((member) => build(member)),
    }
  }, [items, places, room, roomId, day, memberIds])
}
