"use client"

import * as React from "react"
import Link from "next/link"

import { ConfirmDialog } from "@/components/app/confirm-dialog"
import { FormField } from "@/components/app/form-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AuthCard } from "@/features/auth/auth-card"
import { useAfterAuth } from "@/features/auth/login-screen"
import {
  AUTH_RULES,
  validateLoginId,
  validateNickname,
  validatePassword,
} from "@/features/auth/validation"
import { authApi } from "@/lib/api/client"
import { useStore } from "@/lib/store/store"

/** 입력을 멈추면 서버에 중복 여부를 묻는다. 사용 중이면 그 값을 돌려준다. */
function useTaken(field: "loginId" | "nickname", value: string, valid: boolean) {
  const [taken, setTaken] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (!valid) return
    let cancelled = false
    const timer = window.setTimeout(() => {
      void authApi.isAvailable(field, value).then((available) => {
        if (!cancelled) setTaken(available ? null : value)
      })
    }, 400)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [field, value, valid])
  return taken === value
}

export function SignupScreen() {
  const signup = useStore((state) => state.signup)
  const afterAuth = useAfterAuth()

  const [loginId, setLoginId] = React.useState("")
  const [nickname, setNickname] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [passwordConfirm, setPasswordConfirm] = React.useState("")
  /** [가입하기]를 눌러 확인창이 떠 있는지 */
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [touched, setTouched] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  /** 가입 요청을 서버가 거절한 이유 (그 사이 다른 사람이 같은 값으로 가입한 경우 등) */
  const [rejected, setRejected] = React.useState<{
    field: "loginId" | "nickname" | "password"
    value: string
    message: string
  } | null>(null)

  const loginIdRule = validateLoginId(loginId)
  const nicknameRule = validateNickname(nickname)
  const loginIdTaken = useTaken("loginId", loginId, loginIdRule === null)
  const nicknameTaken = useTaken("nickname", nickname, nicknameRule === null)
  const rejectedOf = (field: "loginId" | "nickname" | "password", value: string) =>
    rejected?.field === field && rejected.value === value ? rejected.message : null

  const errors = {
    loginId:
      loginIdRule ??
      (loginIdTaken ? "이미 사용 중인 아이디입니다." : rejectedOf("loginId", loginId)),
    nickname:
      nicknameRule ??
      (nicknameTaken ? "이미 사용 중인 닉네임입니다." : rejectedOf("nickname", nickname)),
    password: validatePassword(password) ?? rejectedOf("password", password),
    passwordConfirm:
      passwordConfirm === password ? null : "비밀번호가 일치하지 않습니다.",
  }
  const invalid = Boolean(
    errors.loginId || errors.nickname || errors.password || errors.passwordConfirm
  )

  /** [가입하기]: 입력이 모두 맞으면 확인창을 띄운다 */
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (invalid || pending) return
    setConfirmOpen(true)
  }

  /** 확인창에서 [가입하기]를 누르면 실제로 가입한다 */
  const register = async () => {
    if (invalid || pending) return
    setPending(true)
    const result = await signup({ loginId, nickname, password })
    setPending(false)
    if (result.ok) {
      afterAuth()
      return
    }
    if (result.code === "NICKNAME_TAKEN") {
      setRejected({ field: "nickname", value: nickname, message: result.message })
    } else if (result.code === "LOGIN_ID_TAKEN") {
      setRejected({ field: "loginId", value: loginId, message: result.message })
    } else {
      setRejected({ field: "password", value: password, message: result.message })
    }
  }

  /** 입력을 시작한 칸만 오류를 보여준다. 고치면 바로 사라진다. */
  const errorOf = (key: keyof typeof errors, value: string) =>
    touched || value ? errors[key] : null

  return (
    <AuthCard
      title="회원가입"
      description="아이디, 닉네임, 비밀번호만 있으면 돼요."
      footer={
        <>
          이미 계정이 있나요?
          <Button asChild variant="link" size="bare">
            <Link href="/login">로그인</Link>
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <FormField
          id="signup-id"
          label="아이디"
          help={loginId ? undefined : AUTH_RULES.loginId.help}
          error={errorOf("loginId", loginId)}
        >
          <Input
            id="signup-id"
            autoComplete="username"
            maxLength={AUTH_RULES.loginId.max}
            aria-invalid={errorOf("loginId", loginId) !== null}
            value={loginId}
            onChange={(event) => setLoginId(event.target.value)}
          />
        </FormField>
        <FormField
          id="signup-nickname"
          label="닉네임"
          help={nickname ? undefined : AUTH_RULES.nickname.help}
          error={errorOf("nickname", nickname)}
        >
          <Input
            id="signup-nickname"
            autoComplete="nickname"
            maxLength={AUTH_RULES.nickname.max}
            aria-invalid={errorOf("nickname", nickname) !== null}
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
          />
        </FormField>
        <FormField
          id="signup-password"
          label="비밀번호"
          help={password ? undefined : AUTH_RULES.password.help}
          error={errorOf("password", password)}
        >
          <Input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            maxLength={AUTH_RULES.password.max}
            aria-invalid={errorOf("password", password) !== null}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </FormField>
        <FormField
          id="signup-password-confirm"
          label="비밀번호 확인"
          help={passwordConfirm ? undefined : "비밀번호를 한 번 더 입력하세요."}
          error={errorOf("passwordConfirm", passwordConfirm)}
        >
          <Input
            id="signup-password-confirm"
            type="password"
            autoComplete="new-password"
            maxLength={AUTH_RULES.password.max}
            aria-invalid={errorOf("passwordConfirm", passwordConfirm) !== null}
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
          />
        </FormField>
        <Button type="submit" disabled={pending}>
          가입하기
        </Button>
      </form>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="이대로 가입할까요?"
        description={`아이디 ${loginId}, 닉네임 ${nickname}(으)로 가입합니다.`}
        confirmLabel="가입하기"
        onConfirm={() => void register()}
      />
    </AuthCard>
  )
}
