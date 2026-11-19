import * as React from "react"
import Link from "next/link"
import { ChevronLeft, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * 모바일 상단 헤더 (높이 56). 웹에서는 SideNav(상단 내비)가 대신한다.
 * alwaysVisible: 웹에서도 보이는 화면(로그인, 내 여행방 등)에서 쓴다.
 */
export function AppHeader({
  title,
  subtitle,
  backHref,
  onBack,
  backLabel = "뒤로",
  logo,
  actions,
  wide = false,
}: {
  title: string
  /** 오른쪽 보조 문구 (방 이름과 인원 등). actions가 없을 때 보인다. */
  subtitle?: string
  backHref?: string
  /** 링크 대신 동작으로 닫을 때 (패널 닫기 등) */
  onBack?: () => void
  /** 제목 앞에 놓는 로고 */
  logo?: React.ReactNode
  backLabel?: string
  actions?: React.ReactNode
  /** 웹에서 여행방 화면의 상단 내비(높이 64, 좌우 32)와 같은 크기로 맞춘다 */
  wide?: boolean
}) {
  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-brand-50 px-4",
        wide && "lg:h-16 lg:px-8"
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {backHref && (
          <Button asChild variant="ghost" size="icon" className="-ml-2">
            <Link href={backHref} aria-label={backLabel}>
              <ChevronLeft />
            </Link>
          </Button>
        )}
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2"
            aria-label={backLabel}
            onClick={onBack}
          >
            <X />
          </Button>
        )}
        {logo}
        <h1 className="truncate text-title font-bold text-brand-900">{title}</h1>
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-3">{actions}</div>
      ) : (
        subtitle && (
          <p className="shrink-0 text-caption text-brand-750">{subtitle}</p>
        )
      )}
    </header>
  )
}
