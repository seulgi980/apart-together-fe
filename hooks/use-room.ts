"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"

import { countDays } from "@/lib/domain/dates"
import { useStore } from "@/lib/store/store"
import type { MemberView, Room } from "@/lib/types"

/** 주소의 [roomId] */
export function useRoomId(): string {
  return useParams<{ roomId: string }>().roomId
}

export function useSession() {
  const hydrated = useStore((state) => state.hydrated)
  const userId = useStore((state) => state.sessionUserId)
  const users = useStore((state) => state.users)
  const user = useMemo(
    () => users.find((candidate) => candidate.id === userId) ?? null,
    [users, userId]
  )
  return { hydrated, user }
}

export type RoomView = {
  room: Room
  members: MemberView[]
  /** 방 멤버가 아닌 사람(탈퇴한 멤버 포함)도 표시할 수 있게 찾아준다 */
  getMember: (userId: string) => MemberView
  me: MemberView
  isOwner: boolean
  days: number
}

/** 여행방과 멤버 정보. 방이 없거나 내가 멤버가 아니면 null. */
export function useRoom(roomId: string): RoomView | null {
  const room = useStore((state) =>
    state.rooms.find((candidate) => candidate.id === roomId)
  )
  const users = useStore((state) => state.users)
  const meId = useStore((state) => state.sessionUserId)

  return useMemo(() => {
    if (!room || !meId) return null
    const members: MemberView[] = room.members.map((member) => {
      const user = users.find((candidate) => candidate.id === member.userId)
      return {
        id: member.userId,
        nickname: user?.nickname ?? "알 수 없음",
        avatarUrl: user?.avatarUrl,
        color: member.color,
        isMe: member.userId === meId,
      }
    })
    const me = members.find((member) => member.isMe)
    if (!me) return null
    const getMember = (userId: string): MemberView => {
      const found = members.find((member) => member.id === userId)
      if (found) return found
      return { id: userId, nickname: "탈퇴한 멤버", color: null, isMe: false }
    }
    return {
      room,
      members,
      getMember,
      me,
      isOwner: room.ownerId === meId,
      days: countDays(room.startDate, room.endDate),
    }
  }, [room, users, meId])
}
