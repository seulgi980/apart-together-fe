"use client";

import * as React from "react";
import { MapPin } from "lucide-react";

import { AppHeader } from "@/components/app/app-header";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { EmptyState } from "@/components/app/empty-state";
import { FilterChips, type ChipOption } from "@/components/app/filter-chips";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddPlaceDialog } from "@/features/places/add-place-dialog";
import { PlaceListCard } from "@/features/places/place-list-card";
import { usePlaces } from "@/hooks/use-places";
import type { RoomView } from "@/hooks/use-room";
import { CATEGORY_LABEL, FILTER_LABEL } from "@/lib/domain/labels";
import { matchesFilter } from "@/lib/domain/status";
import { isGoogleMapsUrl } from "@/lib/api/places";
import type { Category, PoolFilter } from "@/lib/types";

/** 한 번에 불러오는 카드 수 (무한 스크롤, F3-5) */
const PAGE_SIZE = 12;

const CATEGORY_OPTIONS: ChipOption<Category>[] = (
  ["restaurant", "cafe", "sight", "stay", "shopping", "etc"] as Category[]
).map((value) => ({ value, label: CATEGORY_LABEL[value] }));

const TASTE_FILTERS: PoolFilter[] = [
  "all",
  "like",
  "pass",
  "split",
  "unrated",
  "mine-missing",
];

type Notice = "not-google";

const NOTICE_TEXT: Record<Notice, { title: string; description: string }> = {
  "not-google": {
    title: "구글맵 링크가 아니에요",
    description: "장소는 구글맵 링크로만 등록할 수 있어요.",
  },
};

/** 장소 목록: 링크 입력, 필터, 카드 목록 (F2, F3) */
export function PlaceList({
  view,
  selectedId,
}: {
  view: RoomView;
  selectedId?: string;
}) {
  const roomId = view.room.id;
  const { places, vote } = usePlaces(roomId);

  const [link, setLink] = React.useState("");
  const [addState, setAddState] = React.useState<{
    open: boolean;
    link: string;
  }>({ open: false, link: "" });
  const [category, setCategory] = React.useState<Category | null>(null);
  const [taste, setTaste] = React.useState<PoolFilter>("all");
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);
  const [notice, setNotice] = React.useState<Notice | null>(null);

  const scoped = places.filter(
    ({ place }) => category === null || place.category === category,
  );
  const filtered = scoped.filter(({ place, summary }) =>
    matchesFilter(place, taste, summary, view.me.id),
  );
  // 선택된 카드는 아직 불러오지 않은 뒤쪽에 있어도 보이도록 거기까지 펼친다
  const selectedIndex = filtered.findIndex(
    ({ place }) => place.id === selectedId,
  );
  const shown = filtered.slice(0, Math.max(visibleCount, selectedIndex + 1));

  const tasteOptions: ChipOption<PoolFilter>[] = TASTE_FILTERS.map((value) => ({
    value,
    label: FILTER_LABEL[value],
    count: value === "all" ? scoped.length : undefined,
  }));

  const resetPaging = () => setVisibleCount(PAGE_SIZE);

  // 목록 끝이 보이면 다음 카드를 이어서 불러온다
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const hasMore = filtered.length > visibleCount;
  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((count) => count + PAGE_SIZE);
        }
      },
      { root: scrollRef.current, rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, visibleCount]);

  const submitLink = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isGoogleMapsUrl(link)) {
      setNotice("not-google");
      return;
    }
    setAddState({ open: true, link: link.trim() });
    setLink("");
  };

  return (
    <>
      <div className="lg:hidden">
        <AppHeader
          title="장소 목록"
          subtitle={`${view.room.title} · ${view.members.length}명`}
        />
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-b border-line bg-brand-50 px-4 py-3 lg:px-8 lg:py-4">
        <form onSubmit={submitLink} className="flex items-center gap-3">
          <Input
            aria-label="구글맵 링크"
            inputMode="url"
            placeholder="구글맵 공유 링크를 붙여넣으세요"
            value={link}
            onChange={(event) => setLink(event.target.value)}
          />
          <Button type="submit" disabled={!link.trim()}>
            추가
          </Button>
        </form>
        <FilterChips
          label="카테고리"
          options={CATEGORY_OPTIONS}
          value={category}
          allowEmpty
          onChange={(next) => {
            setCategory(next);
            resetPaging();
          }}
        />
        <FilterChips
          label="취향 필터"
          options={tasteOptions}
          value={taste}
          onChange={(next) => {
            setTaste(next ?? "all");
            resetPaging();
          }}
        />
      </div>

      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto">
        <div className="p-4 lg:p-8">
          {filtered.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title={
                places.length === 0
                  ? "아직 등록된 장소가 없어요"
                  : "조건에 맞는 카드가 없어요"
              }
              description={
                places.length === 0
                  ? "구글맵 공유 링크를 붙여넣어 첫 장소를 추가해 보세요."
                  : "필터를 바꿔 보세요."
              }
            />
          ) : (
            <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
              {shown.map((placeView) => (
                <li key={placeView.place.id} className="min-w-0">
                  <PlaceListCard
                    view={placeView}
                    href={`/rooms/${roomId}/places/${placeView.place.id}`}
                    members={view.members}
                    meId={view.me.id}
                    selected={placeView.place.id === selectedId}
                    onVote={(value) => vote(placeView.place.id, value)}
                  />
                </li>
              ))}
            </ul>
          )}
          <div ref={sentinelRef} className="h-px" aria-hidden />
        </div>
      </div>

      <AddPlaceDialog
        key={addState.link}
        roomId={roomId}
        open={addState.open}
        initialLink={addState.link}
        onOpenChange={(open) => setAddState((state) => ({ ...state, open }))}
      />
      <ConfirmDialog
        open={notice !== null}
        onOpenChange={() => setNotice(null)}
        title={notice ? NOTICE_TEXT[notice].title : ""}
        description={notice ? NOTICE_TEXT[notice].description : undefined}
      />
    </>
  );
}
