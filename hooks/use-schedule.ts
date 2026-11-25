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
  /**
   * 이 일정에 이 카드로 넣은 항목들 (Day 순). 같은 카드를 몇 번이든 넣을 수 있다 (F4-20).
   * 카드를 고르면 이 항목들이 놓인 Day 탭과 타임라인 줄을 강조한다.
   */
  placedItems: ScheduleItem[]
}

function toEntry(item: ScheduleItem, places: Place[]): TimelineEntry {
  if (item.kind === "memo") return { item, name: item.title ?? "메모" }
  const place = places.find((candidate) => candidate.id === item.placeId)
  // 카드를 아직 못 받았거나 지워졌으면 항목에 실려 온 장소명·카테고리로 보여준다.
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
 * - 공동 탭: 패스 카드 제외
 * - 개인 탭: 패스 카드 포함 전체
 */
export function usePool(roomId: string, owner: ScheduleOwner): PoolEntry[] {
  const items = useStore((state) => state.items)
  const places = useStore((state) => state.places)
  const rooms = useStore((state) => state.rooms)

  return useMemo(() => {
    const room = rooms.find((candidate) => candidate.id === roomId)
    if (!room) return []
    const memberIds = room.members.map((member) => member.userId)
    const roomPlaces = places.filter((place) => place.roomId === roomId)
    // 카드 ID -> 이 일정에 그 카드로 넣은 항목들. 한 번만 훑어서 묶어 둔다.
    const placedByCard = new Map<string, ScheduleItem[]>()
    for (const item of items) {
      if (item.roomId !== roomId || item.owner !== owner || !item.placeId) continue
      const list = placedByCard.get(item.placeId)
      if (list) list.push(item)
      else placedByCard.set(item.placeId, [item])
    }
    return roomPlaces
      .map((place) => ({ place, summary: summarizeVotes(place, memberIds) }))
      .filter(({ summary }) => owner !== "shared" || summary.status !== "pass")
      .map(({ place, summary }) => ({
        place,
        summary,
        placedItems: [...(placedByCard.get(place.id) ?? [])].sort((a, b) => a.day - b.day),
      }))
      .sort((a, b) => compareNames(a.place.name, b.place.name))
  }, [items, places, rooms, roomId, owner])
}

/** 장소 풀에서 고른 카드가 이 일정(공동/개인)에 놓인 Day들. 고른 카드가 없으면 빈 집합. */
export function usePickedDays(roomId: string, owner: ScheduleOwner): Set<number> {
  const items = useStore((state) => state.items)
  const pickedId = useStore((state) => state.poolSelectedId)
  return useMemo(() => {
    const days = new Set<number>()
    if (!pickedId) return days
    for (const item of items) {
      if (item.roomId === roomId && item.owner === owner && item.placeId === pickedId) {
        days.add(item.day)
      }
    }
    return days
  }, [items, pickedId, roomId, owner])
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
