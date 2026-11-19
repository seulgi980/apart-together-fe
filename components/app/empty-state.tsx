import * as React from "react"
import type { LucideIcon } from "lucide-react"

/** 빈 상태 (장소 없음, 일정 없음 등) */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-brand-250 text-brand-750">
        <Icon className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-subtitle font-bold text-brand-900">{title}</p>
        {description && (
          <p className="text-body text-brand-750">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
