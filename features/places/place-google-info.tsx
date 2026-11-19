"use client"

import * as React from "react"
import { Clock, Globe, Star } from "lucide-react"

import { fetchPlaceGoogleInfo, type PlaceGoogleInfo } from "@/lib/api/places"

type Loaded = {
  /** 어느 카드의 정보인지 (다른 카드로 바뀌면 다시 불러온다) */
  key: string
  info: PlaceGoogleInfo
  /** 오늘의 요일 줄 번호 (구글의 요일별 영업시간은 월요일부터다) */
  today: number
}

/**
 * 장소 상세 위쪽의 3칸: 평점, 영업시간, 웹사이트.
 * 구글에서 그때그때 받아 오는 정보라 카드에는 저장하지 않는다.
 * 값이 없는 칸은 "정보 없음"으로, 조회 자체가 실패하면 불러오지 못했다고 알려준다.
 */
export function PlaceGoogleInfoPanel({
  roomId,
  placeId,
}: {
  roomId: string
  placeId: string
}) {
  const key = `${roomId}/${placeId}`
  const [loaded, setLoaded] = React.useState<Loaded | null>(null)

  React.useEffect(() => {
    let cancelled = false
    void fetchPlaceGoogleInfo(roomId, placeId).then((info) => {
      if (cancelled) return
      setLoaded({ key, info, today: (new Date().getDay() + 6) % 7 })
    })
    return () => {
      cancelled = true
    }
  }, [roomId, placeId, key])

  const current = loaded?.key === key ? loaded : null
  const info = current?.info
  const loading = current === null
  const hours = info?.weekdayHours ?? []
  const todayHours = current ? hours[current.today] : undefined

  return (
    <section aria-label="구글맵 정보" className="flex flex-col gap-3">
      {info && !info.available && (
        <p role="status" className="text-caption text-brand-750">
          구글 정보를 불러오지 못했어요.
        </p>
      )}
      <div className="grid grid-cols-3 gap-3">
        {/* 1. 평점 */}
        <InfoCell icon={<Star aria-hidden className="size-4" />} label="평점">
          {info?.rating != null ? (
            <span className="text-subtitle font-bold text-brand-900">
              {info.rating.toFixed(1)}
            </span>
          ) : (
            <Empty loading={loading} />
          )}
        </InfoCell>

        {/* 2. 영업시간 */}
        <InfoCell icon={<Clock aria-hidden className="size-4" />} label="영업시간">
          {todayHours ? (
            <span className="text-caption break-keep text-brand-750">
              {todayHours}
            </span>
          ) : (
            <Empty loading={loading} />
          )}
        </InfoCell>

        {/* 3. 웹사이트 */}
        <InfoCell icon={<Globe aria-hidden className="size-4" />} label="웹사이트">
          {info?.websiteUrl ? (
            <a
              href={info.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="text-caption break-all text-brand-900 underline underline-offset-2"
            >
              {hostOf(info.websiteUrl)}
            </a>
          ) : (
            <Empty loading={loading} />
          )}
        </InfoCell>
      </div>

      {hours.length > 0 && (
        <details className="rounded-lg border border-line bg-brand-0 px-3 py-2">
          <summary className="cursor-pointer text-caption text-brand-750">
            요일별 영업시간
          </summary>
          <ul className="flex flex-col gap-1 pt-2">
            {hours.map((line, index) => (
              <li
                key={line}
                className={
                  index === current?.today
                    ? "text-caption font-bold text-brand-900"
                    : "text-caption text-brand-750"
                }
              >
                {line}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}

function InfoCell({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-20 min-w-0 flex-col gap-1 rounded-lg border border-line bg-brand-0 p-3">
      <span className="flex items-center gap-1 text-caption text-brand-750">
        {icon}
        {label}
      </span>
      {children}
    </div>
  )
}

/** 정보가 없는 칸: 칸은 그대로 두고 내용만 비운다 */
function Empty({ loading }: { loading: boolean }) {
  return (
    <span className="text-caption text-brand-750">{loading ? "…" : "정보 없음"}</span>
  )
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}
