"use client"

import { useMemo } from "react"

import { compareNames } from "@/lib/domain/labels"
import { sortTimeline } from "@/lib/domain/schedule"
import { summarizeVotes, type VoteSummary } from "@/lib/domain/status"
import { notifyScheduleResult } from "@/lib/notify"
import { useStore } from "@/lib/store/store"
import type { Category, Place, ScheduleItem, ScheduleOwner } from "@/lib/types"

/** 타임라인에 그릴 항목 (장소 정보가 풀린 상태) */
export type TimelineEntry = {
  item: ScheduleItem
  /** 장소명 또는 메모 제목 */
  name: string
  category?: Category
  place?: Place
}

/** 장소 풀에 그릴 카드 */
export type PoolEntry = {
  place: Place
  summary: VoteSummary
  /** 이 일정에 이미 배치된 항목 */
  placedItem?: ScheduleItem
  /** 개인 탭에서 같은 장소의 공동 카드가 있는 나만 카드 (F4-23) */
  alsoShared: boolean
}

function toEntry(item: ScheduleItem, places: Place[]): TimelineEntry {
  if (item.kind === "memo") return { item, name: item.title ?? "메모" }
  const place = places.find((candidate) => candidate.id === item.placeId)
  // 남의 나만 카드로 넣은 항목은 카드를 볼 수 없다. 항목에 실려 온 장소명·카테고리로 보여준다 (F2-9).
  return {
    item,
    name: place?.name ?? item.placeName ?? "삭제된 장소",
    category: place?.category ?? item.placeCategory,
    place,
  }
}

/** 화면에서 고른 Day와 사람 탭 (일정·지도 화면이 함께 쓴다) */
export function useScheduleView(roomId: string) {
  const day = useStore((state) => state.dayByRoom[roomId] ?? 1)
  const tab = useStore((state) => state.tabByRoom[roomId] ?? "shared")
  const setDay = useStore((state) => state.setDay)
  const setTab = useStore((state) => state.setTab)
  const viewers = useStore((state) => state.presence[roomId])
  const meId = useStore((state) => state.sessionUserId)
  /** 다른 멤버가 보고 있는 Day (F4-16). 나는 뺀다. */
  const presence = useMemo(() => {
    const others: Record<string, number> = {}
    for (const [userId, viewing] of Object.entries(viewers ?? {})) {
      if (userId !== meId) others[userId] = viewing
    }
    return others
  }, [viewers, meId])
  return useMemo(
    () => ({
      day,
      tab,
      setDay: (next: number) => setDay(roomId, next),
      setTab: (next: ScheduleOwner) => setTab(roomId, next),
      presence,
    }),
    [day, tab, roomId, setDay, setTab, presence]
  )
}

/** 한 일정(공동 또는 개인)의 한 Day 항목 */
export function useTimeline(roomId: string, owner: ScheduleOwner, day: number) {
  const items = useStore((state) => state.items)
  const places = useStore((state) => state.places)

  return useMemo(() => {
    const dayItems = items.filter(
      (item) => item.roomId === roomId && item.owner === owner && item.day === day
    )
    // 시간 항목과 시간 미정 항목이 섞인, 화면에 보이는 순서 그대로의 한 줄
    return sortTimeline(dayItems).map((item) => toEntry(item, places))
  }, [items, places, roomId, owner, day])
}

/**
 * 탭별 장소 풀 (F4-6).
 * - 공동 탭: 공동 카드 중 패스 카드 제외
 * - 내 개인 탭: 공동 카드 전체 + 내 나만 카드
 */
export function usePool(roomId: string, owner: ScheduleOwner): PoolEntry[] {
  const items = useStore((state) => state.items)
  const places = useStore((state) => state.places)
  const rooms = useStore((state) => state.rooms)
  const meId = useStore((state) => state.sessionUserId)

  return useMemo(() => {
    const room = rooms.find((candidate) => candidate.id === roomId)
    if (!room) return []
    const memberIds = room.members.map((member) => member.userId)
    const roomPlaces = places.filter((place) => place.roomId === roomId)
    const schedule = items.filter(
      (item) => item.roomId === roomId && item.owner === owner
    )
    const sharedKeys = new Set(
      roomPlaces
        .filter((place) => place.scope === "shared")
        .map((place) => place.placeKey)
    )

    return roomPlaces
      .map((place) => ({ place, summary: summarizeVotes(place, memberIds) }))
      .filter(({ place, summary }) => {
        if (owner === "shared") {
          return place.scope === "shared" && summary.status !== "pass"
        }
        return place.scope === "shared" || place.createdBy === meId
      })
      .map(({ place, summary }) => ({
        place,
        summary,
        // 배치 여부는 카드가 아니라 장소 기준이다 (F4-20)
        placedItem: schedule.find((item) => {
          if (!item.placeId) return false
          const placed = roomPlaces.find((candidate) => candidate.id === item.placeId)
          return placed?.placeKey === place.placeKey
        }),
        alsoShared: place.scope === "private" && sharedKeys.has(place.placeKey),
      }))
      .sort((a, b) => compareNames(a.place.name, b.place.name))
  }, [items, places, rooms, roomId, owner, meId])
}

/** 일정 변경. 결과에 따라 "변경되었습니다" 또는 거절 메시지를 띄운다. */
export function useScheduleActions(roomId: string, owner: ScheduleOwner) {
  return useMemo(() => {
    const store = useStore.getState()
    return {
      /** at.index를 주면 타임라인의 그 자리에 끼워 넣는다. 없으면 맨 아래 시간 미정으로. */
      async place(
        placeId: string,
        day: number,
        at?: { index: number; start?: string; end?: string }
      ) {
        return notifyScheduleResult(
          await store.placeItem({ roomId, owner, day, placeId, ...at })
        )
      },
      async addMemo(input: { day: number; title: string; start?: string; end?: string }) {
        return notifyScheduleResult(await store.addMemoItem({ roomId, owner, ...input }))
      },
      async update(
        itemId: string,
        patch: { title?: string; start?: string; end?: string; note?: string }
      ) {
        return notifyScheduleResult(await store.updateItem(itemId, patch))
      },
      async moveToDay(itemId: string, day: number) {
        return notifyScheduleResult(await store.moveItemToDay(itemId, day))
      },
      async remove(itemId: string) {
        return notifyScheduleResult(await store.removeItem(itemId))
      },
      /** 시간 미정 항목을 끌어 옮긴 뒤의 순서대로 한 Day를 다시 놓는다 */
      async arrange(day: number, orderedIds: string[], movedId: string) {
        return notifyScheduleResult(
          await store.arrangeDay({ roomId, owner, day, orderedIds, movedId })
        )
      },
    }
  }, [roomId, owner])
}
