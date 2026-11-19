"use client"

import { useMemo } from "react"

import { compareNames } from "@/lib/domain/labels"
import { summarizeVotes, type VoteSummary } from "@/lib/domain/status"
import { notifyChanged, notifyFailed, notifyResult } from "@/lib/notify"
import {
  useStore,
  type PlaceDraft,
  type ReferenceDraft,
} from "@/lib/store/store"
import type { Category, Place, ScheduleItem, Vote } from "@/lib/types"

export type PlaceView = {
  place: Place
  summary: VoteSummary
  /** 공동 일정에 배치된 항목 (있으면 "배치됨 · Day 3 09:30") */
  sharedItem?: ScheduleItem
}

/**
 * 장소 카드 조회와 변경.
 * 내가 볼 수 있는 카드만 돌려준다: 공동 카드 전체 + 내 나만 카드 (F2-9).
 */
export function usePlaces(roomId: string) {
  const allPlaces = useStore((state) => state.places)
  const allItems = useStore((state) => state.items)
  const rooms = useStore((state) => state.rooms)
  const meId = useStore((state) => state.sessionUserId)

  const places = useMemo<PlaceView[]>(() => {
    const room = rooms.find((candidate) => candidate.id === roomId)
    if (!room) return []
    const memberIds = room.members.map((member) => member.userId)
    return allPlaces
      .filter(
        (place) =>
          place.roomId === roomId &&
          (place.scope === "shared" || place.createdBy === meId)
      )
      .map((place) => ({
        place,
        summary: summarizeVotes(place, memberIds),
        sharedItem: allItems.find(
          (item) => item.owner === "shared" && item.placeId === place.id
        ),
      }))
      // 카드는 언제나 이름 가나다순. 새 카드도 제 자리에 들어간다.
      .sort((a, b) => compareNames(a.place.name, b.place.name))
  }, [allPlaces, allItems, rooms, roomId, meId])

  const actions = useMemo(() => {
    const store = useStore.getState()
    return {
      /**
       * 등록. 등록한 카드의 id를 돌려준다.
       * 같은 장소가 이미 있으면 "duplicate", 그 밖의 실패는 알림을 띄우고 null.
       */
      async add(draft: PlaceDraft): Promise<string | "duplicate" | null> {
        const result = await store.addPlace(roomId, draft)
        if (result.ok) {
          notifyChanged()
          return result.id
        }
        if (result.duplicate) return "duplicate"
        notifyFailed(result.message)
        return null
      },
      async update(placeId: string, patch: { name: string; category: Category; memo?: string }) {
        return notifyResult(await store.updatePlace(placeId, patch))
      },
      async remove(placeId: string) {
        return notifyResult(await store.deletePlace(placeId))
      },
      async vote(placeId: string, vote: Vote) {
        return notifyResult(await store.vote(placeId, vote))
      },
      /** 공동으로 올리기. 같은 장소의 공동 카드가 이미 있으면 "exists". */
      async promote(placeId: string): Promise<"ok" | "exists" | "failed"> {
        const result = await store.promoteToShared(placeId)
        if (result.ok) {
          notifyChanged()
          return "ok"
        }
        if (result.code === "PLACE_ALREADY_SHARED") return "exists"
        notifyFailed(result.message)
        return "failed"
      },
      async addReference(placeId: string, draft: ReferenceDraft) {
        return notifyResult(await store.addReference(placeId, draft))
      },
      async updateReference(placeId: string, referenceId: string, draft: ReferenceDraft) {
        return notifyResult(await store.updateReference(placeId, referenceId, draft))
      },
      async removeReference(placeId: string, referenceId: string) {
        return notifyResult(await store.deleteReference(placeId, referenceId))
      },
    }
  }, [roomId])

  return { places, ...actions }
}

/** 장소 하나. 볼 수 없는 카드(남의 나만 카드)면 null. */
export function usePlace(roomId: string, placeId: string | undefined) {
  const { places } = usePlaces(roomId)
  return useMemo(
    () => places.find((view) => view.place.id === placeId) ?? null,
    [places, placeId]
  )
}
