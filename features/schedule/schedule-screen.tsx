"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { MessageCircle, StickyNote } from "lucide-react";

import { AppHeader } from "@/components/app/app-header";
import { ConfirmDialog } from "@/components/app/confirm-dialog";
import { DayChip, DayChips } from "@/components/app/day-chips";
import { FilterChips, type ChipOption } from "@/components/app/filter-chips";
import { PersonTabs } from "@/components/app/person-tabs";
import {
  PlacePoolSheet,
  type PoolSnap,
} from "@/components/app/place-pool-sheet";
import { TimelineItem } from "@/components/app/timeline-item";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useChatToggle } from "@/features/chat/use-chat-toggle";
import {
  DRAG_SOURCE_ATTRIBUTE,
  findInsertIndex,
  type DragData,
} from "@/features/schedule/dnd";
import {
  ItemDialog,
  type ItemDialogState,
  type ItemDialogValue,
} from "@/features/schedule/item-dialog";
import { PoolCardView, PoolList } from "@/features/schedule/pool";
import { Timeline, type InsertPreview } from "@/features/schedule/timeline";
import { useRoom, useRoomId } from "@/hooks/use-room";
import {
  usePool,
  useScheduleActions,
  useScheduleView,
  useTimeline,
  type TimelineEntry,
} from "@/hooks/use-schedule";
import { formatDayDate } from "@/lib/domain/dates";
import { FILTER_LABEL } from "@/lib/domain/labels";
import {
  fitsGap,
  formatGap,
  formatRange,
  gapWindow,
} from "@/lib/domain/schedule";
import { notifyGapRejected } from "@/lib/notify";
import { matchesFilter } from "@/lib/domain/status";
import { useStore } from "@/lib/store/store";
import type { MemberView, PoolFilter } from "@/lib/types";

const SHARED_FILTERS: PoolFilter[] = [
  "all",
  "like",
  "split",
  "unrated",
  "mine-missing",
];
/** 끄는 동안 타임라인 끝에서 이만큼(px) 안쪽이면 자동으로 스크롤한다 */
const SCROLL_EDGE = 56;
/** 자동 스크롤 속도 (한 프레임에 px) */
const SCROLL_STEP = 8;
/** 끝 구간에 이만큼 머물러야 자동 스크롤을 시작한다 */
const SCROLL_DWELL_MS = 350;

type Point = { x: number; y: number };

/** 끌기 시작한 순간: 잡은 곳(화면 좌표)과 잡힌 요소의 자리 */
type DragOrigin = { pointer: Point; rect: DOMRect };

/** 마우스·터치 이벤트에서 화면 좌표를 꺼낸다 */
function pointOf(event: Event): Point | null {
  if ("touches" in event) {
    const touch =
      (event as TouchEvent).touches[0] ??
      (event as TouchEvent).changedTouches[0];
    return touch ? { x: touch.clientX, y: touch.clientY } : null;
  }
  if ("clientX" in event) {
    const mouse = event as MouseEvent;
    return { x: mouse.clientX, y: mouse.clientY };
  }
  return null;
}

const PERSONAL_FILTERS: PoolFilter[] = [
  "all",
  "like",
  "split",
  "pass",
  "unrated",
  "private",
  "mine-missing",
];

/** 일정 화면 (F4). 모바일과 웹이 같은 구조: 사람 탭, Day 칩, 타임라인, 장소 풀 시트. */
export function ScheduleScreen() {
  const roomId = useRoomId();
  const room = useRoom(roomId);
  const chat = useChatToggle(roomId);
  const { day, tab, setDay, setTab, presence } = useScheduleView(roomId);

  const entries = useTimeline(roomId, tab, day);
  const pool = usePool(roomId, tab);
  const actions = useScheduleActions(roomId, tab);

  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  const [snap, setSnap] = React.useState<PoolSnap>("collapsed");
  const snapBeforeDrag = React.useRef<PoolSnap>("collapsed");
  const [filter, setFilter] = React.useState<PoolFilter>("all");
  const [drag, setDrag] = React.useState<DragData | null>(null);
  /** 끌고 있는 것을 놓으면 들어갈 타임라인의 틈 */
  const [insert, setInsert] = React.useState<InsertPreview | null>(null);
  const zoneRef = React.useRef<HTMLDivElement>(null);

  // 끄는 동안의 포인터 위치와, 포인터를 따라다니는 카드(ghost).
  // dnd-kit의 DragOverlay는 끌기 시작할 때 장소 풀 시트가 접히며 생기는 자리 이동을
  // 카드 위치에 섞어 버려서, 따라다니는 카드는 직접 그리고 직접 옮긴다.
  const pointer = React.useRef<Point>({ x: 0, y: 0 });
  const origin = React.useRef<DragOrigin | null>(null);
  const ghostRef = React.useRef<HTMLDivElement>(null);

  /** 따라다니는 카드의 현재 자리 (화면 좌표의 왼쪽 위) */
  const ghostAt = React.useRef<Point | null>(null);

  /**
   * 따라다니는 카드를 "잡은 곳"이 포인터 아래에 오도록 놓는다.
   * 다만 타임라인 영역을 벗어나지 않게 가둔다:
   * 위는 타임라인 위쪽 끝, 좌우는 타임라인 좌우 끝, 아래는 화면 아래 끝.
   */
  const placeGhost = React.useCallback(() => {
    const ghost = ghostRef.current;
    const from = origin.current;
    if (!ghost || !from) return;
    // 잡은 곳이 따라다니는 카드보다 오른쪽이면 카드 안으로 당긴다
    const grabX = Math.min(
      from.pointer.x - from.rect.left,
      ghost.offsetWidth - 16,
    );
    const grabY = from.pointer.y - from.rect.top;
    let x = pointer.current.x - grabX;
    let y = pointer.current.y - grabY;
    const zone = zoneRef.current;
    if (zone) {
      const area = zone.getBoundingClientRect();
      x = Math.max(area.left, Math.min(x, area.right - ghost.offsetWidth));
      y = Math.max(
        area.top,
        Math.min(y, window.innerHeight - ghost.offsetHeight),
      );
    }
    x = Math.round(x);
    y = Math.round(y);
    ghostAt.current = { x, y };
    ghost.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, []);

  React.useEffect(() => {
    // dnd-kit보다 먼저 받도록 캡처 단계에서 듣는다
    const track = (event: Event) => {
      const point = pointOf(event);
      if (!point) return;
      pointer.current = point;
      placeGhost();
    };
    const options = { capture: true, passive: true };
    window.addEventListener("pointermove", track, options);
    window.addEventListener("touchmove", track, options);
    return () => {
      window.removeEventListener("pointermove", track, options);
      window.removeEventListener("touchmove", track, options);
    };
  }, [placeGhost]);

  // 끌기 시작해 따라다니는 카드가 그려지면 바로 제자리에 놓는다
  React.useLayoutEffect(() => {
    const ghost = ghostRef.current;
    if (!drag || !ghost) return;
    // 타임라인 항목은 원래 줄과 같은 폭으로 따라다닌다
    if (drag.type === "item" && origin.current) {
      ghost.style.width = `${origin.current.rect.width}px`;
    }
    placeGhost();
  }, [drag, placeGhost]);
  /** Day 이동 확인창에 올라온 항목 */
  const [moving, setMoving] = React.useState<{
    entry: TimelineEntry;
    target: number;
  } | null>(null);
  const [dialog, setDialog] = React.useState<ItemDialogState>({
    mode: "closed",
  });

  // 놓을 틈을 계산할 때 쓰는 최신 값들 (포인터가 움직일 때와 자동 스크롤될 때 모두 다시 계산한다)
  const dragData = React.useRef<DragData | null>(null);
  const entryIds = React.useRef<string[]>([]);
  React.useEffect(() => {
    entryIds.current = entries.map((entry) => entry.item.id);
  }, [entries]);

  /** 끌고 있는 카드의 윗변이 타임라인의 어느 틈에 있는지 다시 계산해 미리보기를 맞춘다 */
  const refreshInsert = React.useCallback(() => {
    const zone = zoneRef.current;
    const from = origin.current;
    const data = dragData.current;
    if (!zone || !from || !data) return;

    let index: number | null = null;
    const area = zone.getBoundingClientRect();
    // 따라다니는 카드의 윗변이 타임라인 안에 있을 때만 (장소 풀 위에 있으면 놓을 곳이 없다)
    const top =
      ghostAt.current?.y ??
      from.rect.top + (pointer.current.y - from.pointer.y);
    if (top >= area.top && top <= area.bottom) {
      index = findInsertIndex(zone, top);
    }
    if (index !== null && data.type === "item") {
      // 제자리(자기 바로 위·아래 틈)는 옮기는 것이 아니다
      const own = entryIds.current.indexOf(data.entry.item.id);
      if (index === own || index === own + 1) index = null;
    }
    const name = data.type === "pool" ? data.entry.place.name : data.entry.name;
    setInsert((current) => {
      if (index === null) return current === null ? current : null;
      return current?.index === index ? current : { index, name };
    });
  }, []);

  // 끄는 동안 포인터가 타임라인의 위·아래 끝에 가까우면 타임라인을 스크롤한다
  React.useEffect(() => {
    if (!drag) return;
    let frame = 0;
    // 끝 구간에 머문 시간. 장소 풀에서 끌어 올리며 지나가기만 할 때는 스크롤하지 않는다.
    let direction = 0;
    let since = 0;
    const tick = (now: number) => {
      const zone = zoneRef.current;
      if (zone) {
        const area = zone.getBoundingClientRect();
        const { x, y } = pointer.current;
        let next = 0;
        if (x >= area.left && x <= area.right) {
          if (y > area.bottom - SCROLL_EDGE && y < area.bottom + SCROLL_EDGE) {
            next = 1;
          } else if (y < area.top + SCROLL_EDGE && y > area.top - SCROLL_EDGE) {
            next = -1;
          }
        }
        if (next !== direction) {
          direction = next;
          since = now;
        }
        if (direction !== 0 && now - since >= SCROLL_DWELL_MS) {
          const before = zone.scrollTop;
          zone.scrollTop += direction * SCROLL_STEP;
          if (zone.scrollTop !== before) refreshInsert();
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [drag, refreshInsert]);

  // 마우스와 터치를 같은 방식으로 지원한다 (터치는 길게 눌러 드래그)
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );

  if (!room) return null;

  const isShared = tab === "shared";
  const owner = isShared ? null : room.getMember(tab);
  const readOnly = !isShared && tab !== room.me.id;
  const days = Array.from({ length: room.days }, (_, index) => index + 1);

  const filters = isShared ? SHARED_FILTERS : PERSONAL_FILTERS;
  const activeFilter = filters.includes(filter) ? filter : "all";
  const filterOptions: ChipOption<PoolFilter>[] = filters.map((value) => ({
    value,
    label: FILTER_LABEL[value],
  }));
  const shownPool = readOnly
    ? []
    : pool.filter(({ place, summary }) =>
        matchesFilter(place, activeFilter, summary, room.me.id),
      );

  const viewersOf = (target: number): MemberView[] =>
    room.members.filter(
      (member) => !member.isMe && presence[member.id] === target,
    );

  const onDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as DragData;
    const start = event.activatorEvent ? pointOf(event.activatorEvent) : null;
    const source = (event.activatorEvent?.target as Element | null)?.closest(
      `[${DRAG_SOURCE_ATTRIBUTE}]`,
    );
    if (start && source) {
      pointer.current = start;
      origin.current = { pointer: start, rect: source.getBoundingClientRect() };
    }
    dragData.current = data;
    setDrag(data);
    if (data.type === "pool") {
      // 시트를 접어서 놓을 영역이 가려지지 않게 한다 (F4-5)
      snapBeforeDrag.current = snap;
      setSnap("collapsed");
    }
  };

  const onDragMove = () => refreshInsert();

  const endDrag = () => {
    if (drag?.type === "pool") setSnap(snapBeforeDrag.current);
    setDrag(null);
    setInsert(null);
    origin.current = null;
    ghostAt.current = null;
    dragData.current = null;
  };

  const onDragEnd = (event: DragEndEvent) => {
    const data = event.active.data.current as DragData;
    const index = insert?.index ?? null;
    endDrag();
    // 다른 Day에 넣으려면 Day 칩으로 그 Day를 연 뒤 타임라인에 놓는다
    if (index === null) return;

    if (data.type === "pool") {
      // 타임라인의 틈에 놓으면 시간을 묻는 창을 띄운다
      setDialog({
        mode: "place",
        placeId: data.entry.place.id,
        name: data.entry.place.name,
        index,
        window: gapWindow(
          entries.map((entry) => entry.item),
          index,
        ),
      });
      return;
    }
    // 시간 미정 항목을 다른 틈으로 옮긴다
    const ids = entries.map((entry) => entry.item.id);
    const from = ids.indexOf(data.entry.item.id);
    if (from === -1) return;
    ids.splice(from, 1);
    ids.splice(index > from ? index - 1 : index, 0, data.entry.item.id);
    void actions.arrange(day, ids, data.entry.item.id);
  };

  const openPlace = (placeId: string) =>
    useStore.getState().setSchedulePlace(placeId);

  const openEdit = (entry: TimelineEntry) =>
    setDialog({
      mode: "edit",
      itemId: entry.item.id,
      kind: entry.item.kind,
      name: entry.name,
      start: entry.item.start,
      end: entry.item.end,
      note: entry.item.note,
    });

  const submitDialog = async (value: ItemDialogValue): Promise<boolean> => {
    if (dialog.mode === "new-memo") {
      return actions.addMemo({
        day,
        title: value.title ?? "메모",
        start: value.start,
        end: value.end,
      });
    }
    if (dialog.mode === "place") {
      // 시간을 정했으면 놓은 자리의 앞뒤 일정 사이에 들어가야 한다
      if (value.start && !fitsGap(dialog.window, value.start, value.end)) {
        notifyGapRejected(formatGap(dialog.window));
        return false;
      }
      return actions.place(dialog.placeId, day, {
        index: dialog.index,
        start: value.start,
        end: value.end,
      });
    }
    if (dialog.mode === "edit") {
      return actions.update(dialog.itemId, {
        ...(dialog.kind === "memo" ? { title: value.title } : {}),
        start: value.start,
        end: value.end,
        note: value.note,
      });
    }
    return true;
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onDragCancel={endDrag}
    >
      <div className="lg:hidden">
        <AppHeader
          title={room.room.title}
          backHref="/rooms"
          backLabel="여행방 목록"
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                className="relative rounded-full"
                aria-pressed={chat.open}
                onClick={chat.toggle}
              >
                <MessageCircle />
                채팅
                {chat.unreadLabel && (
                  <Badge variant="count" className="absolute -top-2 -right-2">
                    {chat.unreadLabel}
                  </Badge>
                )}
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-full"
              >
                <Link href={`/rooms/${roomId}/places`}>장소 목록</Link>
              </Button>
            </>
          }
        />
      </div>

      <div className="mx-auto flex min-h-0 w-full max-w-timeline flex-1 flex-col bg-brand-50 lg:border-x lg:border-line">
        <div className="flex shrink-0 flex-col gap-1 py-3 lg:py-4">
          <PersonTabs members={room.members} active={tab} onChange={setTab} />

          <div className="flex h-8 shrink-0 items-center px-4 lg:px-8">
            <p className="truncate text-caption text-brand-750">
              {formatDayDate(room.room.startDate, day)} · Day {day}
            </p>
          </div>

          <DayChips active={day} onChange={setDay}>
            {days.map((target) => (
              <DayChip key={target} day={target} viewers={viewersOf(target)} />
            ))}
          </DayChips>
        </div>

        <div
          ref={setContainer}
          className="relative min-h-0 flex-1 overflow-hidden border-t border-line"
        >
          <Timeline
            room={room}
            day={day}
            entries={entries}
            readOnly={readOnly}
            ownerName={owner?.nickname ?? ""}
            snap={snap}
            insert={insert}
            dragging={drag !== null}
            zoneRef={zoneRef}
            onOpenPlace={openPlace}
            onEditTime={openEdit}
            onMoveDay={(entry, target) => setMoving({ entry, target })}
            onRemove={(entry) => void actions.remove(entry.item.id)}
          />
          <PlacePoolSheet
            scope={isShared ? "shared" : "personal"}
            snap={snap}
            onSnapChange={setSnap}
            container={container}
            count={readOnly ? 0 : pool.length}
            disabled={readOnly}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialog({ mode: "new-memo" })}
              >
                <StickyNote />
                <span className="hidden lg:inline">메모 항목 추가</span>
                <span className="lg:hidden">메모</span>
              </Button>
            }
            filters={
              <FilterChips
                label="장소 풀 필터"
                options={filterOptions}
                value={activeFilter}
                onChange={(next) => setFilter(next ?? "all")}
              />
            }
          >
            <PoolList
              entries={shownPool}
              snap={snap}
              onAdd={(entry) => void actions.place(entry.place.id, day)}
              onOpen={(entry) => openPlace(entry.place.id)}
            />
          </PlacePoolSheet>
        </div>
      </div>

      {drag &&
        createPortal(
          <div
            ref={ghostRef}
            aria-hidden
            data-drag-ghost
            className="pointer-events-none fixed top-0 left-0 z-50"
          >
            {drag.type === "pool" ? (
              <div className="w-48 lg:w-56">
                <PoolCardView
                  entry={drag.entry}
                  dimmed={false}
                  className="shadow-pop"
                />
              </div>
            ) : (
              <TimelineItem.Card className="border border-brand-500 bg-brand-0 shadow-pop">
                <TimelineItem.Text name={drag.entry.name} />
              </TimelineItem.Card>
            )}
          </div>,
          document.body,
        )}

      <ConfirmDialog
        open={moving !== null}
        onOpenChange={(open) => {
          if (!open) setMoving(null);
        }}
        title={
          moving ? `Day ${day} → Day ${moving.target}(으)로 옮길까요?` : ""
        }
        description={
          moving
            ? moving.entry.item.start
              ? `${formatRange(moving.entry.item.start, moving.entry.item.end)} ${moving.entry.name}의 시간은 초기화되고, Day ${moving.target}의 맨 아래에 시간 미정으로 추가됩니다.`
              : `${moving.entry.name}이(가) Day ${moving.target}의 맨 아래에 시간 미정으로 추가됩니다.`
            : undefined
        }
        confirmLabel="옮기기"
        onConfirm={() => {
          if (moving) void actions.moveToDay(moving.entry.item.id, moving.target);
        }}
      />

      <ItemDialog
        state={dialog}
        day={day}
        onClose={() => setDialog({ mode: "closed" })}
        onSubmit={submitDialog}
      />
    </DndContext>
  );
}
