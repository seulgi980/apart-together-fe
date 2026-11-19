"use client"

import Link from "next/link"
import { cva } from "class-variance-authority"
import {
  CalendarDays,
  Luggage,
  Map as MapIcon,
  MapPin,
  type LucideIcon,
} from "lucide-react"

export type RoomSection = "places" | "schedule" | "map" | "rooms"

const TABS: { section: RoomSection; label: string; icon: LucideIcon }[] = [
  { section: "places", label: "장소", icon: MapPin },
  { section: "schedule", label: "일정", icon: CalendarDays },
  { section: "map", label: "지도", icon: MapIcon },
  { section: "rooms", label: "내 여행방", icon: Luggage },
]

const tabVariants = cva(
  "flex h-16 flex-1 flex-col items-center justify-center gap-1 text-caption transition outline-none hover:bg-brand-150 active:scale-95 focus-visible:ring-2 focus-visible:ring-ring",
  {
    variants: {
      active: {
        true: "font-bold text-brand-900",
        false: "font-normal text-brand-750",
      },
    },
  }
)

/** 모바일 하단 탭 (높이 64 + 하단 안전영역): 장소 / 일정 / 지도 / 내 여행방 */
export function BottomTabs({
  roomId,
  active,
}: {
  roomId: string
  active: RoomSection | null
}) {
  const hrefOf = (section: RoomSection) =>
    section === "rooms" ? "/rooms" : `/rooms/${roomId}/${section}`

  return (
    <nav
      aria-label="주요 화면"
      className="flex shrink-0 border-t border-line bg-brand-50 pb-safe lg:hidden"
    >
      {TABS.map(({ section, label, icon: Icon }) => (
        <Link
          key={section}
          href={hrefOf(section)}
          aria-current={active === section ? "page" : undefined}
          className={tabVariants({ active: active === section })}
        >
          <Icon className="size-5" />
          {label}
        </Link>
      ))}
    </nav>
  )
}
