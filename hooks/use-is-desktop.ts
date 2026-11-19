"use client"

import { useSyncExternalStore } from "react"

/** 모바일/웹 전환 기준 폭은 lg(1024px) 하나만 쓴다. */
const QUERY = "(min-width: 1024px)"

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY)
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}

/** 웹(lg 이상) 화면인지. 서버 렌더와 첫 렌더에서는 false(모바일 우선). */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  )
}
