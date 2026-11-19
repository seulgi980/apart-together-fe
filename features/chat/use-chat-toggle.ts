"use client"

import { usePathname } from "next/navigation"

import { formatUnread, useChat } from "@/hooks/use-chat"
import { useIsDesktop } from "@/hooks/use-is-desktop"
import { useStore } from "@/lib/store/store"

/**
 * 채팅 여닫기 (F6-2).
 * - 웹 일정 화면: 일정 옆에 같은 깊이로 놓이는 패널 (dock)
 * - 그 외(모바일 전체, 웹의 다른 화면): 슬라이드 패널 (sheet)
 */
export function useChatToggle(roomId: string) {
  const isDesktop = useIsDesktop()
  const pathname = usePathname()
  const docked = useStore((state) => state.chatDocked)
  const sheetOpen = useStore((state) => state.chatSheetOpen)
  const setDocked = useStore((state) => state.setChatDocked)
  const setSheetOpen = useStore((state) => state.setChatSheetOpen)
  const { unread } = useChat(roomId)
  // 채팅과 장소 상세는 같은 자리를 쓴다. 둘 다 열려 있으면 나중에 연 쪽이 보인다.
  const covered = useStore(
    (state) => state.schedulePlaceId !== null && state.scheduleFront === "place"
  )

  const dockMode = isDesktop && pathname.endsWith("/schedule")
  /** 지금 화면에 보이는지 */
  const open = dockMode ? docked && !covered : sheetOpen

  return {
    dockMode,
    open,
    /** 안 읽은 개수 표시. 없으면 undefined. */
    unreadLabel: unread > 0 && !open ? formatUnread(unread) : undefined,
    // 장소 상세에 가려져 있을 때 누르면 닫지 않고 앞으로 가져온다
    toggle: () => (dockMode ? setDocked(!open) : setSheetOpen(!sheetOpen)),
    show: () => (dockMode ? setDocked(true) : setSheetOpen(true)),
    closeSheet: () => setSheetOpen(false),
  }
}
