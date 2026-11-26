import { cn } from "@/lib/utils"

/**
 * 메모 상자: 연핑크 테두리 위에 "memo" 라벨이 걸린 상자.
 *   ┌ memo ─────────┐
 *   │ 메모 내용       │  ← 글자 수만큼 늘어난다 (줄바꿈 유지)
 *   └───────────────┘
 * 참고자료 카드와 장소 상세에서 같이 쓴다.
 * 라벨 배경을 상자 배경과 같은 색(brand-50)으로 칠해 흰 카드·연한 패널 어디서나 자연스럽게 테두리를 끊는다.
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
        "relative mt-1 block rounded-md border border-brand-400 bg-brand-50 px-3 pt-2.5 pb-2",
        className
      )}
    >
      <span className="absolute -top-2.5 left-2 bg-brand-50 px-1 text-caption font-medium text-brand-600">
        memo
      </span>
      <span className="block text-body break-words whitespace-pre-wrap text-brand-900">
        {children}
      </span>
    </span>
  )
}
