"use client"

import { useMemo } from "react"

import { useStore } from "@/lib/store/store"

/** 여행방 채팅 (F6) */
export function useChat(roomId: string) {
  const allMessages = useStore((state) => state.messages)
  const unread = useStore((state) => state.unread[roomId] ?? 0)
  const hasOlder = useStore((state) => state.hasOlder[roomId] ?? false)
  const allOutbox = useStore((state) => state.outbox)

  const messages = useMemo(
    () => allMessages.filter((message) => message.roomId === roomId),
    [allMessages, roomId]
  )

  // 내가 보냈지만 서버 확인 전이거나 실패한 메시지 (목록 맨 아래에 붙는다)
  const outbox = useMemo(
    () => allOutbox.filter((entry) => entry.roomId === roomId),
    [allOutbox, roomId]
  )

  const actions = useMemo(() => {
    const store = useStore.getState()
    return {
      send: (text: string) => void store.sendMessage(roomId, text),
      sharePlace: (placeId: string) => void store.sharePlace(roomId, placeId),
      loadOlder: () => void store.loadOlderMessages(roomId),
      markRead: () => void store.markRead(roomId),
      retry: (clientId: string) => void store.retryMessage(clientId),
      discard: (clientId: string) => void store.discardMessage(clientId),
    }
  }, [roomId])

  return { messages, outbox, unread, hasOlder, ...actions }
}

/** 안 읽은 개수 표시: 1000개부터는 "999+" (F6-4) */
export function formatUnread(count: number): string {
  return count >= 1000 ? "999+" : String(count)
}
