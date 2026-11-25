"use client"

import * as React from "react"
import { MapPin, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { PlaceView } from "@/hooks/use-places"
import { placeMeta } from "@/lib/domain/labels"

/**
 * 채팅 입력창 왼쪽의 [+] 버튼. 누르면 입력창 위로 장소 카드 목록이 뜨고,
 * 카드를 고르면 채팅에 그 장소 카드가 올라간다 (F6-7).
 */
export function SharePlaceButton({
  places,
  onShare,
}: {
  places: PlaceView[]
  onShare: (placeId: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

  const keyword = query.trim().toLowerCase()
  const candidates = places.filter(
    ({ place }) => keyword === "" || place.name.toLowerCase().includes(keyword)
  )

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery("")
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-full"
          aria-label="장소 카드 올리기"
        >
          <Plus />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-80 p-3">
        <p className="text-body font-bold text-brand-900">장소 카드 올리기</p>
        <Input
          aria-label="장소 이름으로 찾기"
          placeholder="장소 이름으로 찾기"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {candidates.length === 0 ? (
          <p className="py-4 text-center text-caption text-brand-750">
            {keyword ? "찾는 장소가 없어요." : "올릴 수 있는 장소 카드가 없어요."}
          </p>
        ) : (
          <ul className="flex max-h-60 flex-col gap-1 overflow-y-auto">
            {candidates.map(({ place }) => (
              <li key={place.id}>
                <Button
                  type="button"
                  variant="ghost"
                  size="bare"
                  className="w-full justify-start px-2 py-2 text-left"
                  onClick={() => {
                    onShare(place.id)
                    setOpen(false)
                    setQuery("")
                  }}
                >
                  <MapPin className="text-brand-750" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-body font-medium text-brand-900">
                      {place.name}
                    </span>
                    <span className="truncate text-caption font-normal text-brand-750">
                      {placeMeta(place.category, place.area)}
                    </span>
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
