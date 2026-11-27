import { Client } from "@stomp/stompjs"

import { ensureAccessToken } from "@/lib/api/client"
import { WS_URL } from "@/lib/api/config"
import type { TripEventDto } from "@/lib/api/dto"

/**
 * 실시간 연결 (WebSocket + STOMP).
 * 들어가 있는 방 하나를 구독한다: /topic/trips/{tripId}
 * 내가 보낸 요청이 거절되면 서버가 /user/queue/errors 로 { code, message } 를 보낸다. 이것도 구독한다.
 * 브라우저 WebSocket은 Authorization 헤더를 못 붙이므로 CONNECT 프레임 헤더에 access token을 싣는다.
 */

type Handlers = {
  /** 방의 이벤트 */
  onEvent: (roomId: string, event: TripEventDto) => void
  /** 끊겼다가 다시 연결됐다. 그 사이 이벤트를 놓쳤을 수 있으니 방을 다시 불러온다. */
  onReconnect: (roomId: string) => void
  /** 내가 보낸 채팅·presence를 서버가 거절했다 */
  onRejected: (roomId: string, error: { code: string; message: string }) => void
  /** 이 방을 구독할 수 없다 (멤버가 아님) */
  onForbidden: (roomId: string) => void
  /** 지금 보고 있는 Day (연결 직후 "보는 중"을 알린다) */
  currentDay: (roomId: string) => number
}

let client: Client | null = null
let roomId: string | null = null
let handlers: Handlers | null = null
let connectedOnce = false

function publish(destination: string, body: unknown): boolean {
  if (!client?.connected) return false
  client.publish({
    destination,
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  })
  return true
}

export const realtime = {
  /** 방에 들어갈 때 부른다. 다른 방에 연결돼 있었으면 끊고 새로 연결한다. */
  connect(nextRoomId: string, nextHandlers: Handlers) {
    if (roomId === nextRoomId && client?.active) return
    realtime.disconnect()
    roomId = nextRoomId
    handlers = nextHandlers
    connectedOnce = false

    const stomp = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    })
    client = stomp

    // 연결할 때마다 유효한 access token을 싣는다 (만료가 가까우면 먼저 재발급한다)
    stomp.beforeConnect = async () => {
      const token = await ensureAccessToken()
      if (!token) {
        void stomp.deactivate()
        return
      }
      stomp.connectHeaders = { Authorization: `Bearer ${token}` }
    }

    stomp.onConnect = () => {
      if (client !== stomp || !roomId || !handlers) return
      const current = roomId
      stomp.subscribe(`/topic/trips/${current}`, (frame) => {
        try {
          handlers?.onEvent(current, JSON.parse(frame.body) as TripEventDto)
        } catch {
          // 알 수 없는 메시지는 무시한다
        }
      })
      stomp.subscribe("/user/queue/errors", (frame) => {
        try {
          const error = JSON.parse(frame.body) as { code?: string; message?: string }
          // 원본은 개발자도구 콘솔에만 남기고, 사용자에게는 onRejected가 알기 쉬운 문구로 알린다
          console.warn("[realtime] 서버가 요청을 거절했습니다", error)
          handlers?.onRejected(current, { code: error.code ?? "", message: error.message ?? "" })
        } catch {
          // 알 수 없는 메시지는 무시한다
        }
      })
      realtime.sendPresence(current, handlers.currentDay(current))
      if (connectedOnce) handlers.onReconnect(current)
      connectedOnce = true
    }

    stomp.onStompError = (frame) => {
      // 멤버가 아니면 서버가 구독을 거절하고 연결을 끊는다. 다시 붙지 않는다.
      if (`${frame.headers.message ?? ""} ${frame.body ?? ""}`.includes("NOT_TRIP_MEMBER")) {
        const current = roomId
        realtime.disconnect()
        if (current) nextHandlers.onForbidden(current)
      }
    }

    stomp.activate()
  },

  disconnect() {
    roomId = null
    handlers = null
    const current = client
    client = null
    if (current) void current.deactivate()
  },

  /** 채팅 전송. 연결돼 있지 않으면 false (REST로 보낸다). */
  sendChat(targetRoomId: string, body: { content: string } | { sharedPlaceId: number }): boolean {
    if (roomId !== targetRoomId) return false
    return publish(`/app/trips/${targetRoomId}/chat`, body)
  },

  /** "지금 이 Day를 보는 중" (F4-16) */
  sendPresence(targetRoomId: string, day: number) {
    if (roomId !== targetRoomId) return
    publish(`/app/trips/${targetRoomId}/presence`, { day })
  },
}
