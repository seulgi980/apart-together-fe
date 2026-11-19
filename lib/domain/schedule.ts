import type { ScheduleItem } from "@/lib/types"

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

/** "14:00~15:30" / "14:00" / "시간 미정" */
export function formatRange(start?: string, end?: string): string {
  if (!start) return "시간 미정"
  return end ? `${start}~${end}` : start
}

/**
 * 타임라인 정렬 (F4-11, F4-12). 한 Day의 항목을 화면에 보이는 순서 한 줄로 돌려준다.
 * - 시간이 있는 항목은 시간순.
 * - 시간 미정 항목은 타임라인 안에 끼어 있다. 자기가 놓인 자리 바로 앞 시간 항목의
 *   시작 시각(anchor)을 기억하고, 같은 자리의 미정 항목끼리는 order 순서다.
 *   anchor가 -1이면 맨 위, 없으면 맨 아래.
 */
export function sortTimeline(items: ScheduleItem[]): ScheduleItem[] {
  const key = (item: ScheduleItem): [number, number] =>
    item.start
      ? [toMinutes(item.start), -Infinity]
      : [item.anchor ?? Infinity, item.order]
  return [...items].sort((a, b) => {
    const [aTime, aOrder] = key(a)
    const [bTime, bOrder] = key(b)
    if (aTime !== bTime) return aTime < bTime ? -1 : 1
    if (aOrder !== bOrder) return aOrder < bOrder ? -1 : 1
    return 0
  })
}

/**
 * 화면에 보일 순서대로 받은 항목들에서 시간 미정 항목의 자리값(anchor, order)을 다시 매긴다.
 * 시간 항목은 그대로 둔다.
 */
export function layoutSequence(sequence: ScheduleItem[]): ScheduleItem[] {
  let anchor = -1
  let order = 0
  return sequence.map((item) => {
    if (item.start) {
      anchor = toMinutes(item.start)
      order = 0
      return item
    }
    const placed =
      item.anchor === anchor && item.order === order
        ? item
        : { ...item, anchor, order }
    order += 1
    return placed
  })
}

/** 타임라인의 한 틈(항목과 항목 사이)에 넣을 수 있는 시간 범위 */
export type GapWindow = {
  /** 앞 항목: 종료 시간이 있으면 그 시각부터(포함), 없으면 시작 시각 이후(제외) */
  after?: { time: string; inclusive: boolean }
  /** 뒤 항목의 시작 시각. 이 시각 전에 시작하고, 종료는 이 시각까지 */
  before?: string
}

/** sequence의 index번째 자리(0 = 맨 위)에 끼워 넣을 때의 시간 범위 */
export function gapWindow(sequence: ScheduleItem[], index: number): GapWindow {
  const previous = sequence.slice(0, index).findLast((item) => item.start)
  const next = sequence.slice(index).find((item) => item.start)
  return {
    after: previous
      ? previous.end
        ? { time: previous.end, inclusive: true }
        : { time: previous.start!, inclusive: false }
      : undefined,
    before: next?.start,
  }
}

/** 시간이 그 틈에 들어가는지 */
export function fitsGap(window: GapWindow, start: string, end?: string): boolean {
  const startAt = toMinutes(start)
  if (window.after) {
    const limit = toMinutes(window.after.time)
    if (window.after.inclusive ? startAt < limit : startAt <= limit) return false
  }
  if (window.before) {
    const limit = toMinutes(window.before)
    if (startAt >= limit) return false
    if (end && toMinutes(end) > limit) return false
  }
  return true
}

/** "15:00 이후 ~ 17:30 전까지". 제한이 없으면 빈 문자열. */
export function formatGap(window: GapWindow): string {
  const after = window.after
    ? `${window.after.time} ${window.after.inclusive ? "부터" : "이후"}`
    : null
  const before = window.before ? `${window.before} 전까지` : null
  return [after, before].filter(Boolean).join(" ~ ")
}

type TimeSpan = { start: string; end?: string }

/**
 * 시간 겹침 판단 (F4-10, F4-19).
 * - 종료 시간이 없는 항목은 시작 시각 한 점으로 본다.
 * - 한 점이 다른 항목의 범위(시작 이상, 종료 미만) 안에 들어오거나 시작 시각이 같으면 겹침.
 * - 맞닿는 경우(13:00~14:00과 14:00~15:00)는 겹침이 아니다.
 */
export function isOverlapping(a: TimeSpan, b: TimeSpan): boolean {
  const aStart = toMinutes(a.start)
  const bStart = toMinutes(b.start)
  if (aStart === bStart) return true
  const aEnd = a.end ? toMinutes(a.end) : null
  const bEnd = b.end ? toMinutes(b.end) : null
  if (aEnd !== null && bEnd !== null) return aStart < bEnd && bStart < aEnd
  if (aEnd !== null) return bStart >= aStart && bStart < aEnd
  if (bEnd !== null) return aStart >= bStart && aStart < bEnd
  return false
}

/** 같은 일정·같은 Day 안에서 겹치는 항목을 찾는다. 시간 미정 항목은 검증에서 제외. */
export function findOverlap(
  items: ScheduleItem[],
  candidate: { id?: string; day: number; start?: string; end?: string }
): ScheduleItem | undefined {
  if (!candidate.start) return undefined
  const span = { start: candidate.start, end: candidate.end }
  return items.find(
    (item) =>
      item.id !== candidate.id &&
      item.day === candidate.day &&
      item.start !== undefined &&
      isOverlapping(span, { start: item.start, end: item.end })
  )
}

/** 종료 시간은 시작 시간보다 늦어야 한다 (같은 Day를 넘길 수 없다). */
export function isValidRange(start?: string, end?: string): boolean {
  if (!start) return !end
  if (!end) return true
  return toMinutes(end) > toMinutes(start)
}
