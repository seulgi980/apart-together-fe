import * as React from "react"

import { AppLogo } from "@/components/app/app-logo"

/** 로그인/회원가입/초대 화면의 가운데 카드 */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <main className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto p-4">
      <div className="flex w-full max-w-sm flex-col gap-6 rounded-xl border border-line bg-brand-0 p-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 pb-2">
            <AppLogo size="lg" />
            <p className="text-subtitle font-bold text-brand-900">따로같이</p>
          </div>
          <h1 className="text-display font-bold text-brand-900">{title}</h1>
          {description && (
            <p className="text-body text-brand-750">{description}</p>
          )}
        </div>
        {children}
        {footer && (
          <div className="flex items-center justify-center gap-1 text-body text-brand-750">
            {footer}
          </div>
        )}
      </div>
    </main>
  )
}
