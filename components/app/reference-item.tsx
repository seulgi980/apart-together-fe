"use client"

import { MoreVertical, Pencil, Trash2 } from "lucide-react"

import { MemoBox } from "@/components/app/memo-box"
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
 * 참고자료 한 장 (F2-4). 흰 카드.
 *   [아이콘] 제목                [⋮]   ← 아이콘·제목을 누르면 링크가 열린다
 *   ┌ 메모 블록 (연핑크) ──────────┐   ← 메모가 있을 때만 (최대 300자)
 *   └─────────────────────────┘
 *   blog.naver.com · 추가 · 닉네임
 * 아이콘을 가져오지 못하면 기본 링크 아이콘을 쓴다. 메뉴에서 수정/삭제한다.
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
    <li className="flex flex-col gap-2.5 rounded-lg border border-line bg-brand-0 p-3.5 transition hover:border-brand-600 hover:shadow-pop">
      <div className="flex items-center gap-3">
        <a
          href={reference.url}
          target="_blank"
          rel="noreferrer"
          className="flex min-w-0 flex-1 items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <SiteIcon url={reference.url} />
          <span className="min-w-0 flex-1 truncate text-body font-medium text-brand-900">
            {reference.title}
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
      </div>
      {reference.memo && <MemoBox>{reference.memo}</MemoBox>}
      <p className="truncate text-caption text-brand-750">
        {getDomain(reference.url)} · 추가 · {addedBy}
      </p>
    </li>
  )
}
