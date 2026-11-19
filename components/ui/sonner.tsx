"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, OctagonXIcon } from "lucide-react"

/**
 * 알림(toast). sonner 기본 스타일을 끄고(unstyled) 토큰 클래스로만 그린다.
 * - success: "변경되었습니다" 등 처리 확인
 * - error: 일정 검증 거절 메시지 (danger 계열)
 */
const Toaster = (props: ToasterProps) => {
  return (
    <Sonner
      position="top-center"
      duration={2500}
      icons={{
        success: <CircleCheckIcon className="size-5 text-like" />,
        info: <InfoIcon className="size-5 text-brand-750" />,
        error: <OctagonXIcon className="size-5 text-danger" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-start gap-2 rounded-lg border border-line bg-brand-0 p-4 text-body text-brand-900 shadow-pop",
          title: "font-medium",
          description: "text-caption text-brand-750",
          error: "border-danger bg-danger-subtle text-danger",
          icon: "mt-px shrink-0",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
