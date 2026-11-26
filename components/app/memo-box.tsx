import { StickyNote } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * 메모 블록: 흰 카드 안에 놓는 연핑크(brand-200) 블록.
 *   [메모 아이콘] 메모
 *   메모 내용          ← 글자 수만큼 늘어난다 (줄바꿈 유지)
 * 장소 상세의 장소 메모와 참고자료 메모가 같이 쓴다.
 * 둘 다 흰 카드 안에 두어서 어디서나 바탕(흰색)과 블록 색이 같게 보인다.
 */
export function MemoBox({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "flex flex-col gap-1.5 rounded-lg bg-brand-200 px-3.5 py-3",
        className
      )}
    >
      <span className="flex items-center gap-1.5 text-brand-650">
        <StickyNote aria-hidden className="size-3.5" />
        <span className="text-caption font-bold">메모</span>
      </span>
      <span className="text-body break-words whitespace-pre-wrap text-brand-900">
        {children}
      </span>
    </span>
  )
}
