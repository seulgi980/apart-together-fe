"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, Luggage, Settings, UserRound } from "lucide-react"

import { MemberAvatar } from "@/components/app/member-avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProfileDialog } from "@/features/rooms/profile-dialog"
import { useStore } from "@/lib/store/store"
import type { MemberView } from "@/lib/types"

/** 내 프로필 버튼과 메뉴: 내 여행방, 프로필 수정, 방 설정, 로그아웃 */
export function ProfileMenu({
  me,
  roomId,
}: {
  me: MemberView
  /** 방 안에서 열었을 때만 방 설정 메뉴가 보인다 */
  roomId?: string
}) {
  const router = useRouter()
  const logout = useStore((state) => state.logout)
  const [profileOpen, setProfileOpen] = React.useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="내 메뉴"
          >
            <MemberAvatar member={me} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>{me.nickname}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/rooms">
              <Luggage />내 여행방
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setProfileOpen(true)}>
            <UserRound />
            프로필 수정
          </DropdownMenuItem>
          {roomId && (
            <DropdownMenuItem asChild>
              <Link href={`/rooms/${roomId}/settings`}>
                <Settings />방 설정
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              void logout().then(() => router.replace("/login"))
            }}
          >
            <LogOut />
            로그아웃
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  )
}
