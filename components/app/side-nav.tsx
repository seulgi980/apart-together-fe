"use client"

import * as React from "react"
import Link from "next/link"
import { cva } from "class-variance-authority"
import { MessageCircle } from "lucide-react"

import { AppLogo } from "@/components/app/app-logo"
import type { RoomSection } from "@/components/app/bottom-tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const NAV: { section: RoomSection; label: string }[] = [
  { section: "places", label: "장소" },
  { section: "schedule", label: "일정" },
  { section: "map", label: "지도" },
]

const linkVariants = cva(
  "flex h-16 items-center border-b-2 px-3 text-body outline-none focus-visible:ring-2 focus-visible:ring-ring",
  {
    variants: {
      active: {
        true: "border-brand-700 font-bold text-brand-900",
        false: "border-transparent font-medium text-brand-750 hover:border-line hover:text-brand-900",
      },
    },
  }
)

/** 웹 상단 내비 (높이 64): 방 이름, 방 목록 / 장소 / 일정 / 지도, 채팅 버튼, 프로필 */
export function SideNav({
  roomId,
  roomTitle,
  active,
  chatOpen,
  unreadLabel,
  onToggleChat,
  profile,
}: {
  roomId: string
  roomTitle: string
  active: RoomSection | null
  chatOpen: boolean
  /** 안 읽은 개수 표시 ("3", "999+"). 없으면 배지를 숨긴다. */
  unreadLabel?: string
  onToggleChat: () => void
  /** 오른쪽 끝 프로필 메뉴 */
  profile: React.ReactNode
}) {
  return (
    <header className="hidden h-16 shrink-0 items-center justify-between gap-8 border-b border-line bg-brand-50 px-8 lg:flex">
      <div className="flex min-w-0 items-center gap-8">
        <Link
          href="/rooms"
          className="flex min-w-0 items-center gap-2 rounded-md text-title font-bold text-brand-900 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title="내 여행방으로"
        >
          <AppLogo />
          <span className="truncate">{roomTitle}</span>
        </Link>
        <nav aria-label="주요 화면" className="flex items-center gap-3">
          <Link href="/rooms" className={linkVariants({ active: false })}>
            방 목록
          </Link>
          {NAV.map(({ section, label }) => (
            <Link
              key={section}
              href={`/rooms/${roomId}/${section}`}
              aria-current={active === section ? "page" : undefined}
              className={linkVariants({ active: active === section })}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Button
          variant={chatOpen ? "default" : "outline"}
          size="sm"
          aria-pressed={chatOpen}
          onClick={onToggleChat}
        >
          <MessageCircle />
          {chatOpen ? "채팅 열림" : "채팅"}
          {unreadLabel && <Badge variant="count">{unreadLabel}</Badge>}
        </Button>
        {profile}
      </div>
    </header>
  )
}
