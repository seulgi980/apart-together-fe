"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { FormField } from "@/components/app/form-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthCard } from "@/features/auth/auth-card"
import { useSession } from "@/hooks/use-room"
import { useStore } from "@/lib/store/store"

/** 로그인 후 갈 곳: 열어 본 초대 링크가 있으면 참여 절차로 이어진다 (F1-4) */
export function useAfterAuth() {
  const router = useRouter()
  return React.useCallback(() => {
    const invite = useStore.getState().pendingInvite
    router.replace(invite ? `/invite/${invite}` : "/rooms")
  }, [router])
}

export function LoginScreen() {
  const { hydrated, user } = useSession()
  const login = useStore((state) => state.login)
  const hasInvite = useStore((state) => state.pendingInvite !== null)
  const afterAuth = useAfterAuth()

  const [loginId, setLoginId] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  // 로그아웃하기 전까지 로그인이 유지된다 (F1-3)
  React.useEffect(() => {
    if (hydrated && user) afterAuth()
  }, [hydrated, user, afterAuth])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (pending) return
    setPending(true)
    const result = await login(loginId.trim(), password)
    setPending(false)
    // 성공하면 위의 effect가 다음 화면으로 보낸다
    if (!result.ok) setError(result.message)
  }

  return (
    <AuthCard
      title="로그인"
      description={
        hasInvite
          ? "로그인하면 초대받은 여행방에 바로 참여해요."
          : "함께 장소를 모으고, 드래그로 일정을 짜요."
      }
      footer={
        <>
          아직 계정이 없나요?
          <Button asChild variant="link" size="bare">
            <Link href="/signup">회원가입</Link>
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <FormField id="login-id" label="아이디">
          <Input
            id="login-id"
            autoComplete="username"
            value={loginId}
            onChange={(event) => setLoginId(event.target.value)}
          />
        </FormField>
        <FormField id="login-password" label="비밀번호" error={error}>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            aria-invalid={error !== null}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </FormField>
        <Button type="submit" disabled={!loginId || !password || pending}>
          로그인
        </Button>
      </form>
    </AuthCard>
  )
}
