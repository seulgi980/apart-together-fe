"use client"

import * as React from "react"

import { FormField } from "@/components/app/form-field"
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
import { Textarea } from "@/components/ui/textarea"
import { getDomain, isHttpUrl } from "@/lib/domain/labels"
import type { ReferenceDraft } from "@/lib/store/store"
import type { Reference } from "@/lib/types"

/** 메모 최대 글자 수. 서버 DB 칸(VARCHAR 300)과 같다. */
const MEMO_MAX = 300

/** 참고자료 추가/수정 폼 (F2-4). 어떤 링크든 추가할 수 있다. */
export function ReferenceFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 있으면 수정 */
  initial?: Reference
  onSubmit: (draft: ReferenceDraft) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <ReferenceForm
            initial={initial}
            onSubmit={(draft) => {
              onSubmit(draft)
              onOpenChange(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ReferenceForm({
  initial,
  onSubmit,
}: {
  initial?: Reference
  onSubmit: (draft: ReferenceDraft) => void
}) {
  const [url, setUrl] = React.useState(initial?.url ?? "")
  const [title, setTitle] = React.useState(initial?.title ?? "")
  const [memo, setMemo] = React.useState(initial?.memo ?? "")
  const [touched, setTouched] = React.useState(false)

  const urlError =
    touched && !isHttpUrl(url) ? "http(s)로 시작하는 링크를 입력하세요." : null

  /** 링크를 입력하면 제목을 자동으로 채운다 (제목은 직접 고칠 수 있다) */
  const autofill = () => {
    setTouched(true)
    if (!isHttpUrl(url)) return
    if (!title.trim()) setTitle(`${getDomain(url)} 링크`)
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        setTouched(true)
        if (!isHttpUrl(url) || !title.trim()) return
        onSubmit({
          url: url.trim(),
          title: title.trim(),
          memo: memo.trim() || undefined,
        })
      }}
    >
      <DialogHeader>
        <DialogTitle>{initial ? "참고자료 수정" : "참고자료 추가"}</DialogTitle>
        <DialogDescription>
          블로그, 영상, SNS 등 이 장소와 관련된 링크를 모아 두세요.
        </DialogDescription>
      </DialogHeader>
      <FormField id="reference-url" label="링크" error={urlError}>
        <Input
          id="reference-url"
          inputMode="url"
          placeholder="https://"
          aria-invalid={urlError !== null}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          onBlur={autofill}
        />
      </FormField>
      <FormField
        id="reference-title"
        label="제목"
        help="링크를 넣으면 자동으로 채워지고, 직접 고칠 수 있어요."
      >
        <Input
          id="reference-title"
          maxLength={60}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </FormField>
      <FormField
        id="reference-memo"
        label={`메모 (선택, ${MEMO_MAX}자 제한)`}
        help={`${memo.length} / ${MEMO_MAX}`}
      >
        <Textarea
          id="reference-memo"
          rows={3}
          maxLength={MEMO_MAX}
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
        />
      </FormField>
      <DialogFooter>
        <Button type="submit" disabled={!url.trim() || !title.trim()}>
          {initial ? "저장" : "추가"}
        </Button>
      </DialogFooter>
    </form>
  )
}
