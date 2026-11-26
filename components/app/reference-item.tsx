"use client"

import { MoreVertical, Pencil, Trash2 } from "lucide-react"

import { SiteIcon } from "@/components/app/site-icon"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getDomain } from "@/lib/domain/labels"
import type { Reference } from "@/lib/types"

/**
 * 참고자료 한 줄 (F2-4).
 *   [아이콘] 제목            ← 아이콘과 제목은 가운데 맞춤
 *            ┌ memo ─────┐   ← 메모가 있을 때만. 글자 수만큼 늘어난다 (최대 300자)
 *            └───────────┘
 *            blog.naver.com · 추가 · 닉네임
 * 아이콘을 가져오지 못하면 기본 링크 아이콘을 쓴다.
 * 누르면 링크가 열리고, 메뉴에서 수정/삭제한다.
 */
export function ReferenceItem({
  reference,
  addedBy,
  onEdit,
  onDelete,
}: {
  reference: Reference
  /** 추가한 사람 닉네임 */
  addedBy: string
  onEdit?: () => void
  onDelete?: () => void
}) {
  return (
    <li className="flex items-start gap-3 rounded-lg border border-line bg-brand-0 p-3 transition hover:border-brand-600 hover:shadow-pop">
      <a
        href={reference.url}
        target="_blank"
        rel="noreferrer"
        className="flex min-w-0 flex-1 flex-col gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex min-w-0 items-center gap-3">
          <SiteIcon url={reference.url} />
          <span className="min-w-0 flex-1 truncate text-body font-medium text-brand-900">
            {reference.title}
          </span>
        </span>
        {/* 아래 두 줄은 제목 시작선(아이콘 28 + 간격 12)에 맞춘다 */}
        {reference.memo && (
          <span className="relative mt-1 ml-10 block rounded-md border border-brand-400 bg-brand-50 px-3 pt-2.5 pb-2">
            <span className="absolute -top-2.5 left-2 bg-brand-0 px-1 text-caption font-medium text-brand-600">
              memo
            </span>
            <span className="block text-body break-words whitespace-pre-wrap text-brand-900">
              {reference.memo}
            </span>
          </span>
        )}
        <span className="ml-10 truncate text-caption text-brand-750">
          {getDomain(reference.url)} · 추가 · {addedBy}
        </span>
      </a>
      {(onEdit || onDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="참고자료 메뉴">
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {onEdit && (
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil />
                수정
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem variant="destructive" onSelect={onDelete}>
                <Trash2 />
                삭제
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  )
}
