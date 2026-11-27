"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Luggage, Plus, Settings } from "lucide-react"

import { AppHeader } from "@/components/app/app-header"
import { AppLogo } from "@/components/app/app-logo"
import { ConfirmDialog } from "@/components/app/confirm-dialog"
import { EmptyState } from "@/components/app/empty-state"
import { MemberAvatar } from "@/components/app/member-avatar"
import { ScreenSkeleton } from "@/components/app/screen-skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ProfileMenu } from "@/features/rooms/profile-menu"
import { RoomFormDialog } from "@/features/rooms/room-form-dialog"
import { formatUnread } from "@/hooks/use-chat"
import { useSession } from "@/hooks/use-room"
import { countDays, formatPeriod } from "@/lib/domain/dates"
import { notifyChanged, notifyFailed } from "@/lib/notify"
import { useStore } from "@/lib/store/store"
import { MAX_MEMBERS, type MemberView, type Room } from "@/lib/types"

/** 내 여행방 목록 (F1-9), 여행방 만들기 (F1-8), 초대 코드로 참여 (F1-4) */
export function RoomsScreen() {
  const router = useRouter()
  const { hydrated, user } = useSession()
  const rooms = useStore((state) => state.rooms)
  const users = useStore((state) => state.users)
  const unread = useStore((state) => state.unread)
  const createRoom = useStore((state) => state.createRoom)
  const joinByCode = useStore((state) => state.joinByCode)

  const [createOpen, setCreateOpen] = React.useState(false)
  const [code, setCode] = React.useState("")
  const [notice, setNotice] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (hydrated && !user) router.replace("/login")
  }, [hydrated, user, router])

  // 목록 화면에 올 때마다 방 목록과 안 읽은 채팅 수를 새로 받는다
  const userId = user?.id
  React.useEffect(() => {
    if (hydrated && userId) void useStore.getState().loadRooms()
  }, [hydrated, userId])

  if (!hydrated || !user) return <ScreenSkeleton />

  const myRooms = rooms.filter((room) =>
    room.members.some((member) => member.userId === user.id)
  )
  const me: MemberView = {
    id: user.id,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    color: null,
    isMe: true,
  }

  const toMembers = (room: Room): MemberView[] =>
    room.members.map((member) => {
      const found = users.find((candidate) => candidate.id === member.userId)
      return {
        id: member.userId,
        nickname: found?.nickname ?? "알 수 없음",
        avatarUrl: found?.avatarUrl,
        color: member.color,
        isMe: member.userId === user.id,
      }
    })

  const join = async (event: React.FormEvent) => {
    event.preventDefault()
    const result = await joinByCode(code)
    if (result.status === "joined") {
      notifyChanged()
      router.push(`/rooms/${result.roomId}/schedule`)
    } else if (result.status === "already") {
      router.push(`/rooms/${result.roomId}/schedule`)
    } else if (result.status === "full") {
      setNotice("참여 인원이 가득 찼습니다.")
    } else if (result.status === "kicked") {
      setNotice("이 여행방에서 내보내져서 다시 참여할 수 없습니다.")
    } else if (result.status === "error") {
      setNotice(result.message)
    } else {
      setNotice("초대 코드를 찾을 수 없습니다. 코드를 다시 확인해 주세요.")
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AppHeader
        title="내 여행방"
        logo={<AppLogo />}
        wide
        actions={<ProfileMenu me={me} />}
      />
      <ScrollArea className="flex-1">
        <div className="mx-auto flex w-full max-w-timeline flex-col gap-6 p-4 lg:gap-8 lg:p-8">
          <section className="flex flex-col gap-3 lg:gap-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-subtitle font-bold text-brand-900">
                참여 중인 여행방 {myRooms.length}
              </h2>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus />
                여행방 만들기
              </Button>
            </div>
            {myRooms.length === 0 ? (
              <div className="rounded-lg border border-line bg-brand-0">
                <EmptyState
                  icon={Luggage}
                  title="아직 참여한 여행방이 없어요"
                  description="여행방을 만들거나 초대 코드로 참여해 보세요."
                />
              </div>
            ) : (
              <ul className="flex flex-col gap-3 lg:gap-4">
                {myRooms.map((room) => (
                  <li
                    key={room.id}
                    className="flex items-center gap-3 rounded-lg border border-line bg-brand-0 p-4 transition hover:scale-102 hover:border-brand-600 hover:shadow-pop lg:p-5"
                  >
                    <Link
                      href={`/rooms/${room.id}/schedule`}
                      className="flex min-w-0 flex-1 flex-col gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="flex items-center gap-3">
                        <span className="truncate text-subtitle font-bold text-brand-900">
                          {room.title}
                        </span>
                        {room.ownerId === user.id && <Badge>방장</Badge>}
                        {(unread[room.id] ?? 0) > 0 && (
                          <Badge variant="count">
                            {formatUnread(unread[room.id])}
                          </Badge>
                        )}
                      </span>
                      <span className="text-caption text-brand-750">
                        {formatPeriod(room.startDate, room.endDate)} ·{" "}
                        {countDays(room.startDate, room.endDate)}일 ·{" "}
                        {room.members.length}/{MAX_MEMBERS}명
                      </span>
                      <span className="flex items-center gap-1">
                        {toMembers(room).map((member) => (
                          <MemberAvatar key={member.id} member={member} />
                        ))}
                      </span>
                    </Link>
                    <Button asChild variant="ghost" size="icon">
                      <Link
                        href={`/rooms/${room.id}/settings`}
                        aria-label={`${room.title} 방 설정`}
                      >
                        <Settings />
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-subtitle font-bold text-brand-900">
              초대 코드로 참여
            </h2>
            <form onSubmit={join} className="flex items-center gap-3">
              <Input
                aria-label="초대 코드"
                placeholder="초대 코드를 입력하세요"
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
              <Button type="submit" variant="outline" disabled={!code.trim()}>
                참여
              </Button>
            </form>
          </section>
        </div>
      </ScrollArea>

      <RoomFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={async (value) => {
          const roomId = await createRoom(value)
          if (!roomId) {
            notifyFailed("여행방을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.")
            return false
          }
          notifyChanged()
          router.push(`/rooms/${roomId}/settings`)
          return true
        }}
      />
      <ConfirmDialog
        open={notice !== null}
        onOpenChange={() => setNotice(null)}
        title="참여할 수 없어요"
        description={notice ?? undefined}
      />
    </div>
  )
}
