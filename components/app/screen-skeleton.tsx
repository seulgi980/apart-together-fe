import { Skeleton } from "@/components/ui/skeleton"

/** 화면 로딩 상태 (저장된 상태를 불러오는 동안) */
export function ScreenSkeleton() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-4 p-4 lg:p-8"
      aria-busy
      aria-label="불러오는 중"
    >
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-10 w-full" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  )
}
