"use client"

import { useCallback, useSyncExternalStore } from "react"

import { useStore } from "@/lib/store/store"

/** 방금 변경됨 하이라이트를 보여주는 시간 (F4-17). 서버 설정값(기본 30초)을 쓴다. */
function highlightMs(): number {
  return useStore.getState().config.highlightSeconds * 1000
}

/**
 * 주어진 시각이 최근 30초 안인지. 30초가 지나면 자동으로 false가 된다.
 * 현재 시각은 렌더 중이 아니라 구독(브라우저)에서만 읽는다.
 */
export function useIsRecent(timestamp: number | undefined): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!timestamp) return () => {}
      const remaining = timestamp + highlightMs() - Date.now()
      if (remaining <= 0) return () => {}
      const timer = window.setTimeout(onChange, remaining)
      return () => window.clearTimeout(timer)
    },
    [timestamp]
  )
  return useSyncExternalStore(
    subscribe,
    () => timestamp !== undefined && Date.now() - timestamp < highlightMs(),
    () => false
  )
}
