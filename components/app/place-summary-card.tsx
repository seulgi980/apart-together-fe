import * as React from "react"
import { ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * 지도 핀 요약 카드 (F5-2, F5-3).
 * "3. 시부야 스카이", 시간, 카테고리·공개 범위·취향, [구글맵으로 열기], [상세 보기].
 * 겉 테두리·그림자는 감싸는 쪽(모바일 하단 카드, 웹 Popover)이 담당한다.
 */
export function PlaceSummaryCard({
  order,
  name,
  time,
  meta,
  mapUrl,
  detail,
}: {
  order: number | string
  name: string
  time: string
  meta: string
  mapUrl: string
  /** [상세 보기] 링크 요소. 없으면 버튼을 숨긴다 (볼 수 없는 카드). */
  detail?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 text-subtitle font-bold text-brand-900">
            {order}. {name}
          </p>
          <span className="shrink-0 text-caption text-brand-750">{time}</span>
        </div>
        <p className="text-caption text-brand-750">{meta}</p>
      </div>
      <div className="flex items-center gap-3">
        <Button asChild size="sm" className="flex-1">
          <a href={mapUrl} target="_blank" rel="noreferrer">
            <ExternalLink />
            구글맵으로 열기
          </a>
        </Button>
        {detail && (
          <Button asChild variant="outline" size="sm">
            {detail}
          </Button>
        )}
      </div>
    </div>
  )
}
