/** 날짜 계산. 일정 시간은 현지 시각을 그대로 쓰므로 시간대 변환을 하지 않는다 (UTC로만 계산). */

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"]
const DAY_MS = 24 * 60 * 60 * 1000

function parse(date: string): number {
  const [y, m, d] = date.split("-").map(Number)
  return Date.UTC(y, m - 1, d)
}

/** 여행 기간의 최대 일수. Day 칩이 D99까지만 들어가므로 100일 미만이어야 한다. */
export const MAX_TRIP_DAYS = 99

/** 시작일~종료일의 일수 (Day 1 ~ Day N의 N) */
export function countDays(startDate: string, endDate: string): number {
  const diff = Math.round((parse(endDate) - parse(startDate)) / DAY_MS)
  return Math.max(1, diff + 1)
}

/** "11월 18일 (수)" */
export function formatDayDate(startDate: string, day: number): string {
  const date = new Date(parse(startDate) + (day - 1) * DAY_MS)
  return `${date.getUTCMonth() + 1}월 ${date.getUTCDate()}일 (${WEEKDAYS[date.getUTCDay()]})`
}

/** "2026.11.16 ~ 12.15" */
export function formatPeriod(startDate: string, endDate: string): string {
  const [sy, sm, sd] = startDate.split("-")
  const [ey, em, ed] = endDate.split("-")
  const end = sy === ey ? `${em}.${ed}` : `${ey}.${em}.${ed}`
  return `${sy}.${sm}.${sd} ~ ${end}`
}

/** 채팅 날짜 구분선용 ("2026년 11월 25일"). 내 기기의 현지 날짜 기준. */
export function formatChatDate(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
}

/** 채팅 시각 표시용 ("오후 2:10"). 이벤트 핸들러 안에서만 호출한다. */
export function formatClock(date: Date): string {
  const h = date.getHours()
  const m = String(date.getMinutes()).padStart(2, "0")
  return `${h < 12 ? "오전" : "오후"} ${h % 12 === 0 ? 12 : h % 12}:${m}`
}
