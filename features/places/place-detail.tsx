"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ExternalLink,
  Map as MapIcon,
  MapPinOff,
  MessageCircle,
  MoreVertical,
  MousePointerClick,
  Plus,
  Trash2,
} from "lucide-react"

import { AppHeader } from "@/components/app/app-header"
import { ConfirmDialog } from "@/components/app/confirm-dialog"
import { EmptyState } from "@/components/app/empty-state"
import { MemberAvatar } from "@/components/app/member-avatar"
import { ReferenceItem } from "@/components/app/reference-item"
import { StatusLabel } from "@/components/app/status-label"
import { VoteButtons } from "@/components/app/vote-buttons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useChatToggle } from "@/features/chat/use-chat-toggle"
import { EditPlaceDialog } from "@/features/places/edit-place-dialog"
import { PlaceGoogleInfoPanel } from "@/features/places/place-google-info"
import { ReferenceFormDialog } from "@/features/places/reference-form-dialog"
import { useChat } from "@/hooks/use-chat"
import { usePlace, usePlaces } from "@/hooks/use-places"
import { useRoom, useRoomId } from "@/hooks/use-room"
import { CATEGORY_LABEL, SCOPE_LABEL } from "@/lib/domain/labels"
import { formatRange } from "@/lib/domain/schedule"
import { useStore } from "@/lib/store/store"
import type { Reference, Vote } from "@/lib/types"

const VOTE_TEXT: Record<Vote, string> = { like: "좋아요", pass: "패스" }

/** 웹 상세 패널에 아무 카드도 고르지 않았을 때 */
export function PlaceDetailEmpty() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <EmptyState
        icon={MousePointerClick}
        title="카드를 선택하세요"
        description="장소 상세와 참고자료가 여기에 보여요."
      />
    </div>
  )
}

/** 장소 상세 (F2-4, F2-6, F3). 모바일은 한 화면, 웹은 오른쪽 패널. */
/** 주소의 [placeId]로 여는 장소 상세 (장소 화면) */
export function PlaceDetailRoute() {
  const { placeId } = useParams<{ placeId: string }>()
  return <PlaceDetail placeId={placeId} />
}

export function PlaceDetail({
  placeId,
  onClose,
}: {
  placeId: string
  /** 있으면 패널로 열린 상태: 목록으로 돌아가는 대신 패널을 닫는다 (일정 화면) */
  onClose?: () => void
}) {
  const roomId = useRoomId()
  const router = useRouter()
  const room = useRoom(roomId)
  const view = usePlace(roomId, placeId)
  const actions = usePlaces(roomId)
  const chat = useChat(roomId)
  const chatToggle = useChatToggle(roomId)

  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [promoteBlocked, setPromoteBlocked] = React.useState(false)
  const [referenceForm, setReferenceForm] = React.useState<{
    open: boolean
    editing?: Reference
  }>({ open: false })
  const [deletingReference, setDeletingReference] =
    React.useState<Reference | null>(null)

  const listHref = `/rooms/${roomId}/places`

  if (!room) return null
  if (!view) {
    return (
      <>
        <AppHeader
          title="장소 상세"
          backHref={onClose ? undefined : listHref}
          onBack={onClose}
          backLabel="닫기"
        />
        <div className="flex flex-1 items-center justify-center">
          <EmptyState
            icon={MapPinOff}
            title="카드를 찾을 수 없어요"
            description="삭제되었거나 볼 수 없는 카드예요."
          />
        </div>
      </>
    )
  }

  const { place, summary, sharedItem } = view
  const isPrivate = place.scope === "private"
  const myVote = place.votes[room.me.id]

  const goToSchedule = () => {
    if (!sharedItem) return
    const store = useStore.getState()
    store.setTab(roomId, "shared")
    store.setDay(roomId, sharedItem.day)
    // 넘어간 뒤 어떤 일정인지 알 수 있게 잠깐 강조한다
    store.setFocusItem(sharedItem.id)
    if (onClose) onClose()
    else router.push(`/rooms/${roomId}/schedule`)
  }

  const showOnMap = () => {
    const store = useStore.getState()
    if (sharedItem) store.setDay(roomId, sharedItem.day)
    store.setMapFocus(place.id)
    router.push(`/rooms/${roomId}/map`)
  }

  return (
    <>
      <AppHeader
        title="장소 상세"
        backHref={onClose ? undefined : listHref}
        onBack={onClose}
        backLabel={onClose ? "닫기" : "장소 목록으로"}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
              수정
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="카드 메뉴">
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {!isPrivate && (
                  <DropdownMenuItem
                    onSelect={() => {
                      chat.sharePlace(place.id)
                      chatToggle.show()
                    }}
                  >
                    <MessageCircle />
                    채팅에 공유
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setDeleteOpen(true)}
                >
                  <Trash2 />
                  카드 삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-6 p-4 lg:gap-8 lg:p-5">
          <PlaceGoogleInfoPanel roomId={roomId} placeId={place.id} />
          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge>{CATEGORY_LABEL[place.category]}</Badge>
              {!isPrivate && <StatusLabel summary={summary} as="badge" />}
              <Badge variant={isPrivate ? "solid" : "outline"}>
                {SCOPE_LABEL[place.scope]}
              </Badge>
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-display font-bold text-brand-900">
                {place.name}
              </h2>
              {place.nameEn && (
                <p lang="en" className="text-body text-brand-750">
                  {place.nameEn}
                </p>
              )}
              <p className="text-body text-brand-750">{place.address}</p>
              {place.addressEn && (
                <p lang="en" className="text-caption text-brand-750">
                  {place.addressEn}
                </p>
              )}
              {place.memo && (
                <p className="text-body text-brand-750">
                  한 줄 메모 · {place.memo}
                </p>
              )}
              <p className="text-caption text-brand-750">
                등록 · {room.getMember(place.createdBy).nickname}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild className="flex-1">
                <a
                  href={place.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink />
                  구글맵으로 열기
                </a>
              </Button>
              <Button variant="outline" className="flex-1" onClick={showOnMap}>
                <MapIcon />
                지도에서 보기
              </Button>
            </div>
          </section>

          {isPrivate ? (
            <section className="flex flex-col gap-3">
              <h3 className="text-subtitle font-bold text-brand-900">나만 카드</h3>
              <p className="text-body text-brand-750">
                나에게만 보이는 카드라 투표가 없어요. 공동으로 올리면 모든 멤버가 보고
                투표할 수 있고, 다시 나만으로 되돌릴 수는 없어요.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  void actions.promote(place.id).then((result) => {
                    if (result === "exists") setPromoteBlocked(true)
                  })
                }}
              >
                공동으로 올리기
              </Button>
            </section>
          ) : (
            <section className="flex flex-col gap-3">
              <h3 className="text-subtitle font-bold text-brand-900">내 취향</h3>
              <VoteButtons
                myVote={myVote}
                onVote={(vote) => actions.vote(place.id, vote)}
              />
              <ul className="flex flex-col gap-2">
                {room.members.map((member) => {
                  const vote = place.votes[member.id]
                  return (
                    <li key={member.id} className="flex items-center gap-3">
                      <MemberAvatar
                        member={member}
                        vote={vote}
                        state={vote ? "filled" : "pending"}
                      />
                      <span className="min-w-0 flex-1 truncate text-body text-brand-900">
                        {member.nickname}
                      </span>
                      <span className="text-caption font-medium text-brand-750">
                        {vote ? VOTE_TEXT[vote] : "아직 안 함"}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-subtitle font-bold text-brand-900">
                참고자료 {place.references.length}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReferenceForm({ open: true })}
              >
                <Plus />
                링크 추가
              </Button>
            </div>
            {place.references.length === 0 ? (
              <p className="rounded-lg border border-dashed border-brand-500 p-4 text-center text-body text-brand-750">
                블로그, 영상, SNS 링크를 모아 두면 함께 볼 수 있어요.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {place.references.map((reference) => (
                  <ReferenceItem
                    key={reference.id}
                    reference={reference}
                    addedBy={room.getMember(reference.addedBy).nickname}
                    onEdit={() =>
                      setReferenceForm({ open: true, editing: reference })
                    }
                    onDelete={() => setDeletingReference(reference)}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {sharedItem && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-line bg-brand-50 px-4 py-3 lg:px-5">
          <p className="text-body font-medium text-brand-900">
            배치됨 · Day {sharedItem.day}{" "}
            {formatRange(sharedItem.start, sharedItem.end)}
          </p>
          <Button variant="outline" size="sm" onClick={goToSchedule}>
            일정으로 이동
          </Button>
        </div>
      )}

      <EditPlaceDialog
        place={place}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={(patch) => actions.update(place.id, patch)}
      />
      <ReferenceFormDialog
        key={referenceForm.editing?.id ?? "new"}
        open={referenceForm.open}
        initial={referenceForm.editing}
        onOpenChange={(open) => setReferenceForm((state) => ({ ...state, open }))}
        onSubmit={(draft) => {
          if (referenceForm.editing) {
            actions.updateReference(place.id, referenceForm.editing.id, draft)
          } else {
            actions.addReference(place.id, draft)
          }
        }}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="카드를 삭제할까요?"
        description={
          sharedItem
            ? "일정에 배치된 카드예요. 삭제하면 일정 항목과 참고자료, 취향 표시도 함께 삭제됩니다."
            : "참고자료와 취향 표시도 함께 삭제됩니다."
        }
        confirmLabel="삭제"
        destructive
        onConfirm={() => {
          actions.remove(place.id)
          if (onClose) onClose()
          else router.replace(listHref)
        }}
      />
      <ConfirmDialog
        open={deletingReference !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingReference(null)
        }}
        title="참고자료를 삭제할까요?"
        description={deletingReference?.title}
        confirmLabel="삭제"
        destructive
        onConfirm={() => {
          if (deletingReference) {
            actions.removeReference(place.id, deletingReference.id)
          }
        }}
      />
      <ConfirmDialog
        open={promoteBlocked}
        onOpenChange={setPromoteBlocked}
        title="공동으로 올릴 수 없어요"
        description="이미 공동카드로 등록되어 있습니다."
      />
    </>
  )
}
