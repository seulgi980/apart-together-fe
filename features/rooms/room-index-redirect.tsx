"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { ScreenSkeleton } from "@/components/app/screen-skeleton"
import { useRoomId } from "@/hooks/use-room"

export function RoomIndexRedirect() {
  const roomId = useRoomId()
  const router = useRouter()
  useEffect(() => {
    router.replace(`/rooms/${roomId}/schedule`)
  }, [roomId, router])
  return <ScreenSkeleton />
}
