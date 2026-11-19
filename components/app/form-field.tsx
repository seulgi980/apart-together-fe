import * as React from "react"

import { Label } from "@/components/ui/label"

/** 폼 한 칸: 라벨 + 입력 요소 + 도움말 또는 오류 문구 */
export function FormField({
  id,
  label,
  help,
  error,
  children,
}: {
  id: string
  label: string
  help?: string
  error?: string | null
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p role="alert" className="text-caption text-error-text">
          {error}
        </p>
      ) : (
        help && <p className="text-caption text-brand-750">{help}</p>
      )}
    </div>
  )
}
