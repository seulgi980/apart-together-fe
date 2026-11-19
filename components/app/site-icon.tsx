"use client"

import * as React from "react"
import { Link as LinkIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { faviconCandidates } from "@/lib/domain/labels"

/** 파비콘 서비스가 아이콘을 못 찾았을 때 돌려주는 기본 그림의 크기(px) */
const PLACEHOLDER_SIZE = 16

/**
 * 링크 사이트의 아이콘 (F2-4).
 * 사이트 주소(예: blog.naver.com) → 상위 주소(naver.com) 순으로 찾아보고,
 * 끝내 가져오지 못하면 기본 링크 아이콘을 보여준다.
 */
export function SiteIcon({ url }: { url: string }) {
  const [resolved, setResolved] = React.useState<{ url: string; src: string } | null>(
    null
  )

  React.useEffect(() => {
    let cancelled = false
    const candidates = faviconCandidates(url)
    const tryAt = (index: number) => {
      if (index >= candidates.length) return
      const probe = new Image()
      probe.onload = () => {
        if (cancelled) return
        // 못 찾았을 때 오는 기본 그림은 건너뛴다
        if (probe.naturalWidth <= PLACEHOLDER_SIZE) tryAt(index + 1)
        else setResolved({ url, src: candidates[index] })
      }
      probe.onerror = () => {
        if (!cancelled) tryAt(index + 1)
      }
      probe.src = candidates[index]
    }
    tryAt(0)
    return () => {
      cancelled = true
    }
  }, [url])

  // 링크가 바뀌면 이전 링크의 아이콘은 쓰지 않는다
  const src = resolved?.url === url ? resolved.src : undefined

  return (
    <Avatar size="md" className="rounded-sm">
      {src && <AvatarImage src={src} alt="" className="rounded-sm" />}
      <AvatarFallback className="rounded-sm">
        <LinkIcon className="size-5" />
      </AvatarFallback>
    </Avatar>
  )
}
