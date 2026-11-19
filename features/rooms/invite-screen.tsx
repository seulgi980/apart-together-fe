"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

import { ScreenSkeleton } from "@/components/app/screen-skeleton"
import { Button } from "@/components/ui/button"
import { AuthCard } from "@/features/auth/auth-card"
import { useSession } from "@/hooks/use-room"
import { notifyChanged } from "@/lib/notify"
import { useStore } from "@/lib/store/store"

/**
 * 초대 링크 참여 (F1-4, F1-5).
 * - 비로그인: 로그인 후 자동으로 참여 절차로 이어진다.
 * - 이미 참여 중: 해당 여행방으로 이동한다.
 * - 정원 초과: "참여 인원이 가득 찼습니다"
 * - 내보내진 사람: 다시 참여할 수 없다는 안내
 */
type Failure = "full" | "not-found" | "kicked" | "error"

const FAILURE_TEXT: Record<Failure, { title: string; description: string }> = {
  full: {
    title: "참여 인원이 가득 찼습니다",
    description: "이 여행방은 정원(10명)이 모두 찼어요. 방장에게 문의해 주세요.",
  },
  "not-found": {
    title: "초대 링크를 찾을 수 없어요",
    description: "초대 코드가 바뀌었거나 잘못된 링크예요.",
  },
  kicked: {
    title: "참여할 수 없는 여행방이에요",
    description:
      "이 여행방에서 내보내져서 초대 링크로 다시 들어올 수 없어요.",
  },
  error: {
    title: "참여하지 못했어요",
    description: "서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  },
}

export function InviteScreen() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const { hydrated, user } = useSession()
  const [failure, setFailure] = React.useState<Failure | null>(null)
  const handled = React.useRef(false)

  React.useEffect(() => {
    if (!hydrated || handled.current) return
    handled.current = true
    const store = useStore.getState()
    if (!user) {
      store.setPendingInvite(code)
      router.replace("/login")
      return
    }
    store.setPendingInvite(null)
    void store.joinByCode(code).then((result) => {
      if (result.status === "joined" || result.status === "already") {
        if (result.status === "joined") notifyChanged()
        router.replace(`/rooms/${result.roomId}/schedule`)
        return
      }
      // 서버의 참여 결과를 화면에 반영한다
      setFailure(result.status)
    })
  }, [hydrated, user, code, router])

  if (!failure) return <ScreenSkeleton />

  return (
    <AuthCard
      title={FAILURE_TEXT[failure].title}
      description={FAILURE_TEXT[failure].description}
    >
      <Button asChild>
        <Link href="/rooms">내 여행방으로</Link>
      </Button>
    </AuthCard>
  )
}
