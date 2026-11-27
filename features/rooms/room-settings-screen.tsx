"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cva } from "class-variance-authority"
import { Copy, RefreshCw } from "lucide-react"

import { AppHeader } from "@/components/app/app-header"
import { ConfirmDialog } from "@/components/app/confirm-dialog"
import { MemberAvatar } from "@/components/app/member-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  RoomFormDialog,
  type RoomFormValue,
} from "@/features/rooms/room-form-dialog"
import { useRoom, useRoomId } from "@/hooks/use-room"
import { countDays, formatPeriod } from "@/lib/domain/dates"
import { notifyChanged, notifyResult } from "@/lib/notify"
import { useStore } from "@/lib/store/store"
import { MAX_MEMBERS, MEMBER_COLORS, type MemberColor } from "@/lib/types"

const swatchVariants = cva(
  "flex size-10 items-center justify-center rounded-full bg-member text-body font-bold text-brand-900 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
  {
    variants: {
      selected: {
        true: "ring-3 ring-brand-700",
        false: "",
      },
    },
  }
)

type Confirm =
  | { kind: "period"; value: RoomFormValue; lostDays: number }
  | { kind: "kick"; userId: string; nickname: string }
  | { kind: "leave" }
  | { kind: "delete" }
  | { kind: "invite" }

/** 방 설정: 방 정보, 초대, 내 핀 색, 멤버 관리 (F1-2, F1-8, F1-10, F1-11) */
export function RoomSettingsScreen() {
  const roomId = useRoomId()
  const view = useRoom(roomId)
  const router = useRouter()
  const items = useStore((state) => state.items)
  const store = useStore.getState()

  const [editOpen, setEditOpen] = React.useState(false)
  const [confirm, setConfirm] = React.useState<Confirm | null>(null)

  if (!view) return null
  const { room, members, me, isOwner, days } = view
  const usedColors = new Set(members.map((member) => member.color))
  const inviteLink = `/invite/${room.inviteCode}`

  /** confirmedDelete: 사라지는 Day의 일정을 지워도 된다고 확인받았는지 */
  const applyRoom = (value: RoomFormValue, confirmedDelete: boolean) => {
    void store.updateRoom(roomId, value, confirmedDelete).then(notifyResult)
  }

  const submitRoom = (value: RoomFormValue) => {
    // 기간을 줄여 일정이 있는 Day가 사라지면 확인 후 삭제한다 (F1-8)
    const nextDays = countDays(value.startDate, value.endDate)
    const lost = new Set(
      items
        .filter((item) => item.roomId === roomId && item.day > nextDays)
        .map((item) => item.day)
    )
    if (lost.size > 0) {
      setConfirm({ kind: "period", value, lostDays: lost.size })
    } else {
      applyRoom(value, false)
    }
  }

  const copyInvite = async () => {
    const url = `${window.location.origin}${inviteLink}`
    try {
      await navigator.clipboard.writeText(url)
      notifyChanged()
    } catch {
      // 클립보드를 쓸 수 없는 환경에서는 알림을 띄우지 않는다
    }
  }

  const runConfirm = () => {
    if (!confirm) return
    if (confirm.kind === "period") applyRoom(confirm.value, true)
    if (confirm.kind === "invite") {
      void store.regenerateInvite(roomId).then(notifyResult)
    }
    if (confirm.kind === "kick") {
      void store.removeMember(roomId, confirm.userId, "kicked").then(notifyResult)
    }
    if (confirm.kind === "leave") {
      void store.removeMember(roomId, me.id, "left").then((result) => {
        if (notifyResult(result)) router.replace("/rooms")
      })
    }
    if (confirm.kind === "delete") {
      void store.deleteRoom(roomId).then((result) => {
        if (notifyResult(result)) router.replace("/rooms")
      })
    }
  }

  const confirmText: Record<Confirm["kind"], { title: string; description: string; label: string }> = {
    period: {
      title: "일정이 있는 Day가 삭제돼요",
      description:
        confirm?.kind === "period"
          ? `기간을 줄이면 일정이 있는 Day ${confirm.lostDays}개가 사라지고, 그 Day의 일정도 함께 삭제됩니다.`
          : "",
      label: "기간 변경",
    },
    invite: {
      title: "초대 코드를 다시 발급할까요?",
      description: "지금 쓰던 초대 링크와 코드는 더 이상 쓸 수 없게 됩니다.",
      label: "재발급",
    },
    kick: {
      title:
        confirm?.kind === "kick" ? `${confirm.nickname}님을 내보낼까요?` : "",
      description:
        "내보낸 멤버는 초대 링크로도 다시 들어올 수 없습니다. 이 멤버의 투표와 개인 일정이 삭제되고, 장소 카드와 채팅은 남습니다.",
      label: "내보내기",
    },
    leave: {
      title: "여행방에서 나갈까요?",
      description:
        "내 투표와 개인 일정이 삭제됩니다. 장소 카드와 채팅은 남고, 초대 링크로 다시 들어올 수 있습니다.",
      label: "나가기",
    },
    delete: {
      title: "여행방을 삭제할까요?",
      description: "장소 카드, 일정, 채팅이 모두 삭제되고 되돌릴 수 없습니다.",
      label: "방 삭제",
    },
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="lg:hidden">
        <AppHeader title="방 설정" backHref={`/rooms/${roomId}/schedule`} />
      </div>
      <ScrollArea className="flex-1">
        <div className="mx-auto flex w-full max-w-timeline flex-col gap-6 p-4 lg:gap-8 lg:p-8">
          <SettingsSection
            title="방 정보"
            action={
              isOwner && (
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  수정
                </Button>
              )
            }
          >
            <p className="text-subtitle font-bold text-brand-900">{room.title}</p>
            <p className="text-body text-brand-750">
              {formatPeriod(room.startDate, room.endDate)} · Day 1 ~ Day {days}
            </p>
            {!isOwner && (
              <p className="text-caption text-brand-750">
                여행 기간은 방장만 바꿀 수 있어요.
              </p>
            )}
          </SettingsSection>

          <SettingsSection title="초대">
            <p className="text-body text-brand-750">
              초대 코드{" "}
              <span className="font-bold text-brand-900">{room.inviteCode}</span>
            </p>
            <p className="text-caption break-all text-brand-750">{inviteLink}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" onClick={copyInvite}>
                <Copy />
                초대 링크 복사
              </Button>
              {isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirm({ kind: "invite" })}
                >
                  <RefreshCw />
                  코드 재발급
                </Button>
              )}
            </div>
          </SettingsSection>

          <SettingsSection title="내 핀 색">
            <p className="text-caption text-brand-750">
              지도 핀과 아바타에 쓰이는 색이에요. 다른 멤버가 쓰는 색은 고를 수 없어요.
            </p>
            <div className="flex flex-wrap gap-3">
              {MEMBER_COLORS.map((color: MemberColor) => (
                <button
                  key={color}
                  type="button"
                  data-member={color}
                  aria-label={`핀 색 ${color}`}
                  aria-pressed={me.color === color}
                  disabled={usedColors.has(color) && me.color !== color}
                  className={swatchVariants({ selected: me.color === color })}
                  onClick={() => {
                    if (me.color === color) return
                    void store.changeMemberColor(roomId, color).then(notifyResult)
                  }}
                >
                  {color}
                </button>
              ))}
            </div>
          </SettingsSection>

          <SettingsSection title={`멤버 ${members.length}/${MAX_MEMBERS}`}>
            <ul className="flex flex-col gap-2">
              {members.map((member) => (
                <li key={member.id} className="flex min-h-10 items-center gap-3">
                  <MemberAvatar member={member} size="lg" />
                  <span className="min-w-0 flex-1 truncate text-body font-medium text-brand-900">
                    {member.nickname}
                  </span>
                  {member.id === room.ownerId && <Badge>방장</Badge>}
                  {member.isMe && <Badge variant="outline">나</Badge>}
                  {isOwner && !member.isMe && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setConfirm({
                          kind: "kick",
                          userId: member.id,
                          nickname: member.nickname,
                        })
                      }
                    >
                      내보내기
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </SettingsSection>

          <div className="flex justify-end">
            {isOwner ? (
              <Button
                variant="destructive"
                onClick={() => setConfirm({ kind: "delete" })}
              >
                방 삭제
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={() => setConfirm({ kind: "leave" })}
              >
                여행방 나가기
              </Button>
            )}
          </div>
        </div>
      </ScrollArea>
      {/* 설정을 다 봤으면 일정 화면으로 간다 (방을 만든 직후에도 이 화면이 먼저 뜬다) */}
      <div className="shrink-0 border-t border-line bg-brand-50 p-4 lg:px-8">
        <div className="mx-auto flex w-full max-w-timeline justify-end">
          <Button asChild>
            <Link href={`/rooms/${roomId}/schedule`}>확인</Link>
          </Button>
        </div>
      </div>

      <RoomFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={{
          title: room.title,
          startDate: room.startDate,
          endDate: room.endDate,
        }}
        onSubmit={submitRoom}
      />
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) setConfirm(null)
        }}
        title={confirm ? confirmText[confirm.kind].title : ""}
        description={confirm ? confirmText[confirm.kind].description : undefined}
        confirmLabel={confirm ? confirmText[confirm.kind].label : undefined}
        destructive={confirm?.kind !== "invite"}
        onConfirm={runConfirm}
      />
    </div>
  )
}

function SettingsSection({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-line bg-brand-0 p-4 lg:p-5">
      <div className="flex min-h-10 items-center justify-between gap-3">
        <h2 className="text-subtitle font-bold text-brand-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}
