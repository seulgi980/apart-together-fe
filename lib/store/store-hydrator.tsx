"use client"

import { useEffect } from "react"

import { useStore } from "@/lib/store/store"

/**
 * 앱을 열 때 한 번 실행한다.
 * - 브라우저에 남겨 둔 화면 설정(보던 Day, 탭)을 불러온다.
 * - refresh 쿠키로 로그인 상태를 되살리고 내 여행방 목록을 받는다 (F1-3).
 * (서버 렌더 결과와 첫 화면이 달라지지 않도록 렌더 중에는 하지 않는다)
 */
export function StoreHydrator() {
  useEffect(() => {
    void Promise.resolve(useStore.persist.rehydrate()).then(() =>
      useStore.getState().bootstrap()
    )
  }, [])

  return null
}
