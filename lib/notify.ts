import { toast } from "sonner"

import type { ActionResult, ScheduleResult } from "@/lib/store/store"

/**
 * 알림 규칙 (ui-spec 5장, F7-2).
 * 변경 요청은 서버에서 처리가 확인된 뒤 "변경되었습니다" 알림이 떠야 성공이다.
 */
export function notifyChanged() {
  toast.success("변경되었습니다")
}

/** 거절 메시지는 읽을 시간이 필요해서 조금 더 오래 보여준다 */
const REJECT_DURATION = 5000

/** 서버가 거절한 이유를 그대로 보여준다 */
export function notifyFailed(message: string) {
  toast.error(message, { duration: REJECT_DURATION })
}

/** 요청 결과에 따라 "변경되었습니다" 또는 거절 사유를 띄우고 성공 여부를 돌려준다 */
export function notifyResult(result: ActionResult): boolean {
  if (result.ok) {
    notifyChanged()
    return true
  }
  notifyFailed(result.message)
  return false
}

/** 일정 검증 거절 메시지. 요청한 사람에게만 보여준다 (F4-22). */
export function notifyRejected(result: Extract<ScheduleResult, { ok: false }>) {
  if (result.reason === "error") {
    notifyFailed(result.message)
    return
  }
  const where = result.conflict.start
    ? `Day ${result.conflict.day} ${result.conflict.start}`
    : `Day ${result.conflict.day}`
  toast.error("해당 시간에 이미 일정이 있습니다.", {
    description: `${where}에 이미 일정이 있습니다.`,
    duration: REJECT_DURATION,
  })
}

/** 타임라인의 한 틈에 넣으려는 시간이 앞뒤 일정 사이에 들어가지 않을 때 */
export function notifyGapRejected(range: string) {
  toast.error("이 자리에는 넣을 수 없는 시간이에요.", {
    description: range
      ? `${range} 시간으로 정하거나, 시간 미정으로 넣어 주세요.`
      : undefined,
    duration: REJECT_DURATION,
  })
}

/** 일정 변경 결과에 따라 알림을 띄우고 성공 여부를 돌려준다 */
export function notifyScheduleResult(result: ScheduleResult): boolean {
  if (result.ok) {
    notifyChanged()
    return true
  }
  notifyRejected(result)
  return false
}
