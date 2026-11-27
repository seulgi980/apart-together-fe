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
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useSubmit } from "@/hooks/use-submit"
import { CATEGORIES, CATEGORY_LABEL } from "@/lib/domain/labels"
import type { Category, Place } from "@/lib/types"
import { MEMO_MAX } from "@/lib/domain/limits"

type PlacePatch = { name: string; category: Category; memo?: string }

/** 장소 카드 수정: 장소명, 카테고리, 한 줄 메모 (F2-6). 저장되면 닫히고, 실패하면 입력을 남긴다. */
export function EditPlaceDialog({
  place,
  open,
  onOpenChange,
  onSubmit,
}: {
  place: Place
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 성공하면 true (창을 닫는다) */
  onSubmit: (patch: PlacePatch) => Promise<boolean>
}) {
  const { pending, run } = useSubmit(onSubmit, () => onOpenChange(false))
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <EditPlaceForm place={place} pending={pending} onSubmit={run} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function EditPlaceForm({
  place,
  pending,
  onSubmit,
}: {
  place: Place
  pending: boolean
  onSubmit: (patch: PlacePatch) => void
}) {
  const [name, setName] = React.useState(place.name)
  const [category, setCategory] = React.useState<Category>(place.category)
  const [memo, setMemo] = React.useState(place.memo ?? "")

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!name.trim()) return
        onSubmit({ name: name.trim(), category, memo: memo.trim() || undefined })
      }}
    >
      <DialogHeader>
        <DialogTitle>장소 카드 수정</DialogTitle>
        <DialogDescription>
          장소명, 카테고리, 한 줄 메모를 바꿀 수 있어요.
        </DialogDescription>
      </DialogHeader>
      <FormField id="edit-place-name" label="장소명">
        <Input
          id="edit-place-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </FormField>
      <div className="flex flex-col gap-2">
        <Label id="edit-place-category-label">카테고리</Label>
        <ToggleGroup
          type="single"
          variant="chip"
          aria-labelledby="edit-place-category-label"
          className="w-full flex-wrap"
          value={category}
          onValueChange={(next) => {
            if (next) setCategory(next as Category)
          }}
        >
          {CATEGORIES.map((value) => (
            <ToggleGroupItem key={value} value={value}>
              {CATEGORY_LABEL[value]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <FormField
        id="edit-place-memo"
        label={`메모 (선택, ${MEMO_MAX}자 제한)`}
        help={`${memo.length} / ${MEMO_MAX}`}
      >
        <Textarea
          id="edit-place-memo"
          rows={3}
          maxLength={MEMO_MAX}
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
        />
      </FormField>
      <DialogFooter>
        <Button type="submit" disabled={pending || !name.trim()}>
          {pending ? "저장 중…" : "저장"}
        </Button>
      </DialogFooter>
    </form>
  )
}
