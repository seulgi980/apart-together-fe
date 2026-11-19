"use client"

import * as React from "react"
import { Link2, MapPin as MapPinIcon } from "lucide-react"
import { toast } from "sonner"

import { ChatMessage, ChatPlaceCard } from "@/components/app/chat-message"
import { ConfirmDialog } from "@/components/app/confirm-dialog"
import { DayChip, DayChips } from "@/components/app/day-chips"
import { EmptyState } from "@/components/app/empty-state"
import { FilterChips } from "@/components/app/filter-chips"
import { MapPin } from "@/components/app/map-pin"
import { MemberAvatar } from "@/components/app/member-avatar"
import { PersonTabs } from "@/components/app/person-tabs"
import { PlaceCard } from "@/components/app/place-card"
import { PlaceSummaryCard } from "@/components/app/place-summary-card"
import { ReferenceItem } from "@/components/app/reference-item"
import { StatusLabel } from "@/components/app/status-label"
import { TimelineItem } from "@/components/app/timeline-item"
import { VoteAvatars } from "@/components/app/vote-avatars"
import { VoteButtons } from "@/components/app/vote-buttons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import type { VoteSummary } from "@/lib/domain/status"
import { notifyChanged } from "@/lib/notify"
import type {
  MemberView,
  PlaceStatus,
  PoolFilter,
  ScheduleOwner,
  Vote,
} from "@/lib/types"

/* 클래스 이름은 Tailwind가 인식하도록 문자열을 조합하지 않고 그대로 적는다 */
const BRAND = [
  ["brand-0", "bg-brand-0"],
  ["brand-50", "bg-brand-50"],
  ["brand-100", "bg-brand-100"],
  ["brand-150", "bg-brand-150"],
  ["brand-200", "bg-brand-200"],
  ["brand-250", "bg-brand-250"],
  ["brand-300", "bg-brand-300"],
  ["brand-350", "bg-brand-350"],
  ["brand-400", "bg-brand-400"],
  ["brand-450", "bg-brand-450"],
  ["brand-500", "bg-brand-500"],
  ["brand-550", "bg-brand-550"],
  ["brand-600", "bg-brand-600"],
  ["brand-650", "bg-brand-650"],
  ["brand-700", "bg-brand-700"],
  ["brand-750", "bg-brand-750"],
  ["brand-800", "bg-brand-800"],
  ["brand-850", "bg-brand-850"],
  ["brand-900", "bg-brand-900"],
  ["brand-950", "bg-brand-950"],
  ["brand-1000", "bg-brand-1000"],
] as const

const ACCENT = [
  ["like", "bg-like"],
  ["like-subtle", "bg-like-subtle"],
  ["split", "bg-split"],
  ["split-subtle", "bg-split-subtle"],
  ["danger", "bg-danger"],
  ["danger-subtle", "bg-danger-subtle"],
] as const

const TEXT = [
  ["display", "text-display font-bold", "장소 상세의 장소명"],
  ["title", "text-title font-bold", "화면 제목, 패널 제목"],
  ["subtitle", "text-subtitle font-bold", "카드의 장소명, 섹션 제목"],
  ["body", "text-body", "본문, 입력, 버튼, 칩, 메시지"],
  ["caption", "text-caption", "보조 정보, 배지"],
  ["time", "text-time font-bold", "09:30 타임라인 시작 시간"],
] as const

const MEMBERS: MemberView[] = [
  { id: "a", nickname: "나", color: 6, isMe: true },
  { id: "b", nickname: "민수", color: 2, isMe: false },
  { id: "c", nickname: "지은", color: 5, isMe: false },
  { id: "d", nickname: "하나", color: 7, isMe: false },
]

const ALL_COLORS: MemberView[] = Array.from({ length: 10 }, (_, index) => ({
  id: `m${index + 1}`,
  nickname: String(index + 1),
  color: (index + 1) as MemberView["color"],
  isMe: false,
}))

const VOTES: Record<string, Vote> = { a: "like", b: "like", c: "pass" }

const SUMMARY: Record<PlaceStatus, VoteSummary> = {
  like: { status: "like", likes: 3, passes: 0, total: 4 },
  split: { status: "split", likes: 1, passes: 1, total: 4 },
  pass: { status: "pass", likes: 0, passes: 3, total: 4 },
  unrated: { status: "unrated", likes: 0, passes: 0, total: 4 },
  private: { status: "private", likes: 0, passes: 0, total: 4 },
}

const STATUSES = Object.keys(SUMMARY) as PlaceStatus[]

/** 스타일 가이드: 토큰과 공용 컴포넌트의 모든 variant */
export function Styleguide() {
  const [vote, setVote] = React.useState<Vote | undefined>("like")
  const [tab, setTab] = React.useState<ScheduleOwner>("shared")
  const [day, setDay] = React.useState(3)
  const [filter, setFilter] = React.useState<PoolFilter>("all")
  const [checked, setChecked] = React.useState(true)
  const [dialog, setDialog] = React.useState(false)

  return (
    <main className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-timeline flex-col gap-8 p-4 lg:p-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-display font-bold text-brand-900">스타일 가이드</h1>
          <p className="text-body text-brand-750">
            ui-spec.md의 토큰과 공용 컴포넌트를 한 화면에서 확인합니다. 개발 중에만 열립니다.
          </p>
        </header>

        <Section title="브랜드 팔레트 21색">
          <Swatches items={BRAND} />
        </Section>
        <Section title="추가 강조색 3종">
          <Swatches items={ACCENT} />
        </Section>
        <Section title="멤버 색 10종 (멤버 식별 전용)">
          <div className="flex flex-wrap gap-3">
            {ALL_COLORS.map((member) => (
              <MemberAvatar key={member.id} member={member} size="lg" />
            ))}
          </div>
        </Section>

        <Section title="글자 6종">
          <ul className="flex flex-col gap-3">
            {TEXT.map(([name, className, sample]) => (
              <li key={name} className="flex items-baseline gap-4">
                <span className="w-16 shrink-0 text-caption text-brand-750">{name}</span>
                <span className={className}>{sample}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Button">
          <Row>
            <Button>주요 버튼</Button>
            <Button variant="outline">보조 버튼</Button>
            <Button variant="secondary">secondary</Button>
            <Button variant="ghost">ghost</Button>
            <Button variant="destructive">삭제</Button>
            <Button disabled>비활성</Button>
          </Row>
          <Row>
            <Button size="sm">sm</Button>
            <Button size="icon" variant="outline" aria-label="아이콘 버튼">
              <MapPinIcon />
            </Button>
            <Button size="fab">
              <MapPinIcon />
              장소 추가
            </Button>
          </Row>
        </Section>

        <Section title="Input · Switch · Badge">
          <Input placeholder="구글맵 공유 링크를 붙여넣으세요" />
          <Row>
            <Switch checked={checked} onCheckedChange={setChecked} aria-label="스위치" />
            <Badge>
              <Link2 />
              링크 3
            </Badge>
            <Badge variant="solid">나만</Badge>
            <Badge variant="outline">공동</Badge>
            <Badge variant="like">좋아요 3/4</Badge>
            <Badge variant="split">의견갈림</Badge>
            <Badge variant="destructive">오류</Badge>
            <Badge variant="member" data-member={5}>
              지은 · 방금 추가됨
            </Badge>
            <Badge variant="count">999+</Badge>
          </Row>
        </Section>

        <Section title="칩 · 토글">
          <FilterChips
            label="취향 필터"
            value={filter}
            onChange={(next) => setFilter(next ?? "all")}
            options={[
              { value: "all", label: "전체", count: 18 },
              { value: "like", label: "좋아요" },
              { value: "pass", label: "패스" },
              { value: "split", label: "의견갈림" },
              { value: "unrated", label: "미평가" },
              { value: "mine-missing", label: "내가 안 한 것" },
            ]}
          />
          <PersonTabs members={MEMBERS} active={tab} onChange={setTab} />
          <DayChips active={day} onChange={setDay}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((target) => (
              <DayChip
                key={target}
                day={target}
                active={target === day}
                viewers={target === 3 ? [MEMBERS[2]] : []}
                dropState={target === 5 ? "ready" : target === 6 ? "over" : "idle"}
              />
            ))}
          </DayChips>
        </Section>

        <Section title="MemberAvatar · VoteAvatars · VoteButtons · StatusLabel">
          <Row>
            <MemberAvatar member={MEMBERS[0]} size="sm" />
            <MemberAvatar member={MEMBERS[1]} size="md" />
            <MemberAvatar member={MEMBERS[2]} size="lg" />
            <MemberAvatar member={MEMBERS[1]} vote="like" />
            <MemberAvatar member={MEMBERS[2]} vote="pass" />
            <MemberAvatar member={MEMBERS[3]} state="pending" />
            <MemberAvatar member={MEMBERS[2]} ring />
          </Row>
          <VoteAvatars members={MEMBERS} votes={VOTES} />
          <VoteAvatars members={[...MEMBERS, ...ALL_COLORS]} votes={VOTES} max={5} />
          <VoteButtons myVote={vote} onVote={setVote} />
          <Row>
            {STATUSES.map((status) => (
              <StatusLabel key={status} summary={SUMMARY[status]} />
            ))}
          </Row>
        </Section>

        <Section title="PlaceCard — status × size">
          <ul className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {STATUSES.map((status) => (
              <li key={status} className="min-w-0">
                <PlaceCard status={status} size="list">
                  <PlaceCard.Body>
                    <PlaceCard.Header
                      name={`장소 카드 (${status})`}
                      badge={
                        status === "private" ? (
                          <Badge variant="solid">나만</Badge>
                        ) : (
                          <Badge>링크 3</Badge>
                        )
                      }
                    />
                    <PlaceCard.Meta>관광 · 아사쿠사</PlaceCard.Meta>
                    {status !== "private" && (
                      <PlaceCard.Votes>
                        <VoteAvatars members={MEMBERS} votes={VOTES} />
                        <StatusLabel summary={SUMMARY[status]} />
                      </PlaceCard.Votes>
                    )}
                  </PlaceCard.Body>
                  <PlaceCard.Actions>
                    {status === "private" ? (
                      <Button variant="outline" size="sm">
                        공동으로 올리기
                      </Button>
                    ) : (
                      <VoteButtons myVote={vote} onVote={setVote} />
                    )}
                  </PlaceCard.Actions>
                </PlaceCard>
              </li>
            ))}
          </ul>
          <ul className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {STATUSES.map((status) => (
              <li key={status} className="min-w-0">
                <PlaceCard status={status} size="compact">
                  <PlaceCard.Header name={`풀 카드 (${status})`} />
                  <PlaceCard.Meta>식당 · 링크 2</PlaceCard.Meta>
                  <PlaceCard.Footer>
                    <Badge>배치됨 · Day 3</Badge>
                  </PlaceCard.Footer>
                </PlaceCard>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="TimelineItem — normal / highlighted / memo / unscheduled">
          <ol className="flex flex-col gap-3">
            <TimelineItem variant="normal">
              <TimelineItem.Time start="09:30" end="11:00" onClick={() => {}} />
              <TimelineItem.Rail />
              <TimelineItem.Card>
                <TimelineItem.Text name="센소지" sub="관광" />
              </TimelineItem.Card>
            </TimelineItem>
            <TimelineItem variant="highlighted" member={5}>
              <TimelineItem.Time start="14:00" end="15:30" />
              <TimelineItem.Rail />
              <TimelineItem.Card>
                <TimelineItem.Text
                  name="시부야 스카이"
                  sub="관광"
                  badge={<Badge variant="member">지은 · 방금 추가됨</Badge>}
                />
              </TimelineItem.Card>
            </TimelineItem>
            <TimelineItem variant="memo">
              <TimelineItem.Time start="18:00" />
              <TimelineItem.Rail />
              <TimelineItem.Card>
                <TimelineItem.Text name="숙소 체크인" sub="메모" />
              </TimelineItem.Card>
            </TimelineItem>
            <TimelineItem variant="unscheduled">
              <TimelineItem.Time />
              <TimelineItem.Rail />
              <TimelineItem.Card>
                <TimelineItem.Text name="블루보틀 키요스미" sub="카페" />
              </TimelineItem.Card>
            </TimelineItem>
          </ol>
        </Section>

        <Section title="MapPin · PlaceSummaryCard">
          <div className="flex h-16 items-center gap-12 pl-8">
            <span className="relative">
              <MapPin kind="shared" label="공동 1">1</MapPin>
            </span>
            <span className="relative">
              <MapPin kind="shared" selected label="공동 3 (선택)">3</MapPin>
            </span>
            <span className="relative">
              <MapPin kind="member" member={2} label="개인 1">1</MapPin>
            </span>
            <span className="relative">
              <MapPin kind="member" member={2} selected label="개인 2 (선택)">2</MapPin>
            </span>
          </div>
          <div className="max-w-sm rounded-xl border border-line bg-brand-0 p-4 shadow-pop">
            <PlaceSummaryCard
              order={3}
              name="시부야 스카이"
              time="14:00~15:30"
              meta="관광 · 공동 일정 · 좋아요 3/4"
              mapUrl="https://www.google.com/maps"
              detail={<a href="#summary">상세 보기</a>}
            />
          </div>
        </Section>

        <Section title="ReferenceItem — 사이트 아이콘 + 제목">
          <ul className="flex flex-col gap-2">
            <ReferenceItem
              addedBy="민수"
              onEdit={() => {}}
              onDelete={() => {}}
              reference={{ id: "1", title: "아사쿠사 반나절 코스 후기", url: "https://blog.naver.com/x", memo: "줄 서는 시간대 정리", addedBy: "b" }}
            />
            <ReferenceItem addedBy="지은" reference={{ id: "2", title: "센소지 야경 브이로그", url: "https://www.youtube.com/x", addedBy: "c" }} />
            <ReferenceItem addedBy="나" reference={{ id: "3", title: "인스타 포토스팟 모음", url: "https://www.instagram.com/x", addedBy: "a" }} />
            <ReferenceItem addedBy="하나" reference={{ id: "4", title: "공식 예매 페이지", url: "https://example.com/x", addedBy: "d" }} />
          </ul>
        </Section>

        <Section title="ChatMessage — user / system">
          <ul className="flex flex-col gap-4">
            <ChatMessage variant="user" member={MEMBERS[1]} time="오후 2:10">
              시부야 스카이 14시부터 1시간 반 어때?
            </ChatMessage>
            <ChatMessage variant="system">
              지은님이 Day 3 14:00~15:30에 시부야 스카이를 추가했습니다.
            </ChatMessage>
            <ChatMessage variant="user" member={MEMBERS[2]} time="오후 2:14">
              여기도 같이 볼래?
              <ChatPlaceCard name="도쿄타워" meta="관광 · 미나토" />
            </ChatMessage>
          </ul>
        </Section>

        <Section title="알림 · 확인창 · 빈 상태 · 로딩">
          <Row>
            <Button variant="outline" onClick={notifyChanged}>
              변경되었습니다 알림
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.error("해당 시간에 이미 일정이 있습니다.", {
                  description: "Day 3 13:00에 이미 일정이 있습니다.",
                })
              }
            >
              거절 메시지
            </Button>
            <Button variant="outline" onClick={() => setDialog(true)}>
              확인창
            </Button>
          </Row>
          <div className="rounded-lg border border-line bg-brand-0">
            <EmptyState
              icon={MapPinIcon}
              title="아직 등록된 장소가 없어요"
              description="구글맵 공유 링크를 붙여넣어 첫 장소를 추가해 보세요."
            />
          </div>
          <Skeleton className="h-24 w-full rounded-lg" />
          <ConfirmDialog
            open={dialog}
            onOpenChange={setDialog}
            title="카드를 삭제할까요?"
            description="참고자료와 취향 표시도 함께 삭제됩니다."
            confirmLabel="삭제"
            destructive
            onConfirm={() => {}}
          />
        </Section>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-line bg-brand-0 p-4 lg:p-5">
      <h2 className="text-subtitle font-bold text-brand-900">{title}</h2>
      {children}
    </section>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>
}

function Swatches({ items }: { items: readonly (readonly [string, string])[] }) {
  return (
    <ul className="flex flex-wrap gap-3">
      {items.map(([name, className]) => (
        <li key={name} className="flex w-20 flex-col gap-1">
          <span className={`h-10 rounded-md border border-line ${className}`} />
          <span className="text-caption text-brand-750">{name}</span>
        </li>
      ))}
    </ul>
  )
}
