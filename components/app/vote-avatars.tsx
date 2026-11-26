import { MemberAvatar } from "@/components/app/member-avatar"
import type { MemberView, Vote } from "@/lib/types"

/**
 * 투표 아바타 줄 (F3-3).
 * 투표한 멤버를 먼저, 아직 안 한 멤버는 점선 빈 원으로. 많으면 "+N".
 */
export function VoteAvatars({
  members,
  votes,
  max = 4,
}: {
  members: MemberView[]
  votes: Record<string, Vote>
  max?: number
}) {
  const ordered = [
    ...members.filter((member) => votes[member.id]),
    ...members.filter((member) => !votes[member.id]),
  ]
  const shown = ordered.slice(0, max)
  const hidden = ordered.length - shown.length

  // 투표 아이콘이 오른쪽 아래로 8px 튀어나오므로 옆 아바타와 겹치지 않게 간격을 넉넉히 둔다
  return (
    <div className="flex min-w-0 shrink-0 items-center gap-3">
      {shown.map((member) => (
        <MemberAvatar
          key={member.id}
          member={member}
          vote={votes[member.id]}
          state={votes[member.id] ? "filled" : "pending"}
        />
      ))}
      {hidden > 0 && (
        <span className="text-caption font-medium text-brand-750">+{hidden}</span>
      )}
    </div>
  )
}
