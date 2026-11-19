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
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { CATEGORIES, CATEGORY_LABEL } from "@/lib/domain/labels"
import type { Category, Place } from "@/lib/types"

type PlacePatch = { name: string; category: Category; memo?: string }

/** 장소 카드 수정: 장소명, 카테고리, 한 줄 메모 (F2-6) */
export function EditPlaceDialog({
  place,
  open,
  onOpenChange,
  onSubmit,
}: {
  place: Place
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (patch: PlacePatch) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <EditPlaceForm
            place={place}
            onSubmit={(patch) => {
              onSubmit(patch)
              onOpenChange(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function EditPlaceForm({
  place,
  onSubmit,
}: {
  place: Place
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
          공개 범위는 여기서 바꿀 수 없어요. 나만 카드는 목록에서 공동으로 올릴 수 있어요.
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
      <FormField id="edit-place-memo" label="한 줄 메모 (선택)">
        <Input
          id="edit-place-memo"
          maxLength={50}
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
        />
      </FormField>
      <DialogFooter>
        <Button type="submit" disabled={!name.trim()}>
          저장
        </Button>
      </DialogFooter>
    </form>
  )
}
