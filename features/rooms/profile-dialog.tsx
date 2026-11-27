"use client"

import * as React from "react"

import { FormField } from "@/components/app/form-field"
import { MemberAvatar } from "@/components/app/member-avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { AUTH_RULES, validateNickname } from "@/features/auth/validation"
import { useSession } from "@/hooks/use-room"
import { notifyChanged, notifyFailed } from "@/lib/notify"
import { useStore } from "@/lib/store/store"

/** 프로필 수정: 닉네임과 프로필 사진 (F1-6). 수정 즉시 모든 화면에 반영된다. */
export function ProfileDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && <ProfileForm onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function ProfileForm({ onDone }: { onDone: () => void }) {
  const { user } = useSession()
  const updateProfile = useStore((state) => state.updateProfile)

  const [nickname, setNickname] = React.useState(user?.nickname ?? "")
  /** 미리보기 주소 (저장된 사진 또는 방금 고른 파일) */
  const [avatarUrl, setAvatarUrl] = React.useState(user?.avatarUrl)
  /** 새로 고른 파일 / null = 사진 지우기 / undefined = 그대로 */
  const [avatar, setAvatar] = React.useState<File | null | undefined>(undefined)
  /** 서버가 거절한 닉네임 (다른 사람이 쓰는 닉네임 등) */
  const [rejected, setRejected] = React.useState<{ value: string; message: string } | null>(null)
  const [pending, setPending] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)

  if (!user) return null
  const error =
    validateNickname(nickname) ?? (rejected?.value === nickname ? rejected.message : null)

  const pickPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      notifyFailed("사진은 2MB 이하만 올릴 수 있습니다.")
      return
    }
    setAvatar(file)
    const reader = new FileReader()
    reader.onload = () => setAvatarUrl(String(reader.result))
    reader.readAsDataURL(file)
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (error || pending) return
    setPending(true)
    const result = await updateProfile({ nickname, avatar })
    setPending(false)
    if (!result.ok) {
      if (result.code === "NICKNAME_TAKEN") setRejected({ value: nickname, message: result.message })
      else notifyFailed(result.message)
      return
    }
    notifyChanged()
    onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>프로필 수정</DialogTitle>
        <DialogDescription>
          닉네임과 사진은 모든 여행방에서 함께 쓰여요. 핀 색은 방 설정에서 바꿔요.
        </DialogDescription>
      </DialogHeader>
      <div className="flex items-center gap-3">
        <MemberAvatar
          size="lg"
          member={{ id: user.id, nickname, avatarUrl, color: null, isMe: true }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
        >
          사진 선택
        </Button>
        {avatarUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setAvatarUrl(undefined)
              setAvatar(null)
            }}
          >
            사진 지우기
          </Button>
        )}
        <Input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          tabIndex={-1}
          aria-label="프로필 사진 파일"
          onChange={pickPhoto}
        />
      </div>
      <FormField
        id="profile-nickname"
        label="닉네임"
        help={AUTH_RULES.nickname.help}
        error={error}
      >
        <Input
          id="profile-nickname"
          maxLength={AUTH_RULES.nickname.max}
          aria-invalid={error !== null}
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
        />
      </FormField>
      <DialogFooter>
        <Button type="submit" disabled={error !== null || pending}>
          {pending ? "저장 중…" : "저장"}
        </Button>
      </DialogFooter>
    </form>
  )
}
