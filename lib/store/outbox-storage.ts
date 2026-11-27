import type { OutgoingMessage } from "@/lib/types"

/**
 * 전송 중/실패 채팅 메시지를 브라우저 저장소(localStorage)에 보관한다.
 * 새로고침하거나 앱을 다시 열어도 실패한 메시지가 [재전송]·[삭제]와 함께 남아 있게 한다.
 *
 * - 계정마다 따로 저장한다. 같은 브라우저에서 다른 계정으로 로그인해도 남의 메시지가 보이지 않는다.
 * - 로그아웃하면 지운다. (로그인이 만료돼 풀린 경우는 남겨 두고, 같은 계정으로 다시 로그인하면 보여준다)
 * - KEEP_MS가 지난 것은 버린다.
 * - 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)에서는 조용히 메모리에만 둔다.
 */

const KEY_PREFIX = "apart-together-outbox:"

/** 실패 메시지를 남겨 두는 기간 */
const KEEP_MS = 7 * 24 * 60 * 60 * 1000

const keyOf = (userId: string) => `${KEY_PREFIX}${userId}`

/** 저장해 둔 메시지를 꺼낸다. 새로고침 전에 "전송 중"이던 것은 응답을 받을 수 없으니 실패로 보여준다. */
export function loadOutbox(userId: string): OutgoingMessage[] {
  try {
    const raw = window.localStorage.getItem(keyOf(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as OutgoingMessage[]
    if (!Array.isArray(parsed)) return []
    const now = Date.now()
    return parsed
      .filter(
        (entry) =>
          typeof entry?.clientId === "string" &&
          typeof entry.roomId === "string" &&
          typeof entry.createdAt === "number" &&
          now - entry.createdAt < KEEP_MS
      )
      .map((entry) => ({ ...entry, status: "failed" as const }))
  } catch {
    return []
  }
}

export function saveOutbox(userId: string, entries: OutgoingMessage[]) {
  try {
    if (entries.length === 0) window.localStorage.removeItem(keyOf(userId))
    else window.localStorage.setItem(keyOf(userId), JSON.stringify(entries))
  } catch {
    // 저장소가 가득 찼거나 막혀 있으면 메모리에만 둔다
  }
}

export function clearOutbox(userId: string) {
  try {
    window.localStorage.removeItem(keyOf(userId))
  } catch {
    // 무시
  }
}
