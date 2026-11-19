"use client"

import * as React from "react"
import Link from "next/link"
import { Link2, Lock } from "lucide-react"

import { PlaceCard } from "@/components/app/place-card"
import { StatusLabel } from "@/components/app/status-label"
import { VoteAvatars } from "@/components/app/vote-avatars"
import { VoteButtons } from "@/components/app/vote-buttons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { PlaceView } from "@/hooks/use-places"
import { CATEGORY_LABEL } from "@/lib/domain/labels"
import type { MemberView, Vote } from "@/lib/types"

/** 장소 목록의 카드 한 장 */
export function PlaceListCard({
  view,
  href,
  members,
  meId,
  selected,
  onVote,
  onPromote,
}: {
  view: PlaceView
  href: string
  members: MemberView[]
  meId: string
  selected: boolean
  onVote: (vote: Vote) => void
  onPromote: () => void
}) {
  const { place, summary } = view
  const isPrivate = place.scope === "private"
  const category = CATEGORY_LABEL[place.category]

  // 선택된 카드(채팅에서 눌러 넘어온 카드 등)가 화면 밖에 있으면 화면 안으로 끌어온다
  const cardRef = React.useRef<HTMLElement>(null)
  React.useEffect(() => {
    if (selected) {
      cardRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }
  }, [selected])

  return (
    <PlaceCard
      ref={cardRef}
      status={summary.status}
      size="list"
      selected={selected}
    >
      <PlaceCard.Body asChild>
        {/* 누르면 상세가 열린다. 링크를 끌면 주소가 딸려 나오므로 끌기는 막는다. */}
        <Link
          href={href}
          draggable={false}
          aria-current={selected ? "true" : undefined}
        >
          <PlaceCard.Header
            name={place.name}
            badge={
              <>
                {isPrivate && (
                  <Badge variant="solid">
                    <Lock />
                    나만
                  </Badge>
                )}
                <Badge>
                  <Link2 />
                  링크 {place.references.length}
                </Badge>
              </>
            }
          />
          <PlaceCard.Meta>
            {place.area ? `${category} · ${place.area}` : category}
            {summary.status === "pass" && " · 일정 장소 풀에서 제외됨"}
          </PlaceCard.Meta>
          <PlaceCard.Votes>
            {isPrivate ? (
              <span className="text-caption text-brand-750">
                나만 보이는 카드 · 투표 없음
              </span>
            ) : (
              <>
                <VoteAvatars members={members} votes={place.votes} />
                <StatusLabel summary={summary} />
              </>
            )}
          </PlaceCard.Votes>
        </Link>
      </PlaceCard.Body>
      <PlaceCard.Actions>
        {isPrivate ? (
          <Button variant="outline" size="sm" onClick={onPromote}>
            공동으로 올리기
          </Button>
        ) : (
          <VoteButtons myVote={place.votes[meId]} onVote={onVote} />
        )}
      </PlaceCard.Actions>
    </PlaceCard>
  )
}
