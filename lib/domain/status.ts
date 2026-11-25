import type { Place, PlaceStatus, PoolFilter, Vote } from "@/lib/types"

export type VoteSummary = {
  status: PlaceStatus
  likes: number
  passes: number
  /** 기준 인원 N = 방의 현재 전체 멤버 수 */
  total: number
}

/**
 * 취향 상태 계산 (F3-2).
 * - 좋아요: 좋아요율 50% 이상이고 패스율 50% 미만
 * - 패스: 패스율 50% 이상이고 좋아요율 50% 미만
 * - 의견갈림: 그 외 (둘 다 50%인 경우 포함)
 * - 미평가: 아무도 투표하지 않음. 미평가자는 패스로 보지 않는다.
 * 나간 멤버의 투표는 세지 않는다.
 */
export function summarizeVotes(place: Place, memberIds: string[]): VoteSummary {
  const total = memberIds.length
  let likes = 0
  let passes = 0
  for (const id of memberIds) {
    const vote: Vote | undefined = place.votes[id]
    if (vote === "like") likes += 1
    if (vote === "pass") passes += 1
  }
  if (likes + passes === 0 || total === 0) {
    return { status: "unrated", likes, passes, total }
  }
  const likeHalf = likes * 2 >= total
  const passHalf = passes * 2 >= total
  let status: PlaceStatus = "split"
  if (likeHalf && !passHalf) status = "like"
  if (passHalf && !likeHalf) status = "pass"
  return { status, likes, passes, total }
}

/** 상태 문구: "좋아요 3/4", "의견갈림" 등 */
export function statusText(summary: VoteSummary): string {
  switch (summary.status) {
    case "like":
      return `좋아요 ${summary.likes}/${summary.total}`
    case "pass":
      return `패스 ${summary.passes}/${summary.total}`
    case "split":
      return "의견갈림"
    case "unrated":
      return "미평가"
  }
}

/** 취향 필터 (F3-4). "mine-missing" = 내가 아직 투표하지 않은 카드 */
export function matchesFilter(
  place: Place,
  filter: PoolFilter,
  summary: VoteSummary,
  myId: string
): boolean {
  if (filter === "all") return true
  if (filter === "mine-missing") {
    return place.votes[myId] === undefined
  }
  return summary.status === filter
}
