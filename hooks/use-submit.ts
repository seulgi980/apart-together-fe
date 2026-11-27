"use client"

import * as React from "react"

/**
 * 입력 창의 [저장] 공통 규칙.
 *  1. 누르면 pending이 되어 버튼이 꺼진다 ("저장 중…"). 응답이 올 때까지 다시 눌러도 보내지 않는다.
 *  2. 성공(true)하면 onSuccess (보통 창 닫기).
 *  3. 실패(false)하면 창은 그대로 두고 입력도 남긴다. 거절 이유 알림은 submit 쪽이 띄운다.
 *
 * pending은 다시 그려지기 전까지 늦게 바뀌므로, 아주 빠른 연타는 ref로 한 번 더 막는다.
 */
export function useSubmit<T>(
  submit: (value: T) => Promise<boolean>,
  onSuccess: () => void
) {
  const [pending, setPending] = React.useState(false)
  const running = React.useRef(false)

  const run = async (value: T) => {
    if (running.current) return
    running.current = true
    setPending(true)
    try {
      if (await submit(value)) onSuccess()
    } finally {
      running.current = false
      setPending(false)
    }
  }

  return { pending, run }
}
