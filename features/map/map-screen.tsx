"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { cva } from "class-variance-authority";
import { MapPin as MapPinIcon } from "lucide-react";

import { ChipSlider } from "@/components/app/chip-slider";
import { DayChip, DayChips } from "@/components/app/day-chips";
import { MapPin } from "@/components/app/map-pin";
import { PlaceSummaryCard } from "@/components/app/place-summary-card";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  hasCoordinates,
  useMapPins,
  type MapPinData,
  type MapSchedule,
} from "@/features/map/use-map-pins";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { useRoom, useRoomId, type RoomView } from "@/hooks/use-room";
import { useScheduleView } from "@/hooks/use-schedule";
import { formatDayDate } from "@/lib/domain/dates";
import { formatRange } from "@/lib/domain/schedule";
import { useStore } from "@/lib/store/store";

const MapCanvas = dynamic(
  () => import("@/features/map/map-canvas").then((module) => module.MapCanvas),
  {
    ssr: false,
    loading: () => <Skeleton className="size-full rounded-none" />,
  },
);
const PinMarker = dynamic(
  () => import("@/features/map/map-canvas").then((module) => module.PinMarker),
  { ssr: false },
);

const rowVariants = cva(
  "flex min-h-14 w-full items-center gap-3 rounded-lg border px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
  {
    variants: {
      selected: {
        true: "border-brand-700 bg-brand-250",
        false: "border-line bg-brand-0 hover:bg-brand-50",
      },
    },
  },
);

const numberVariants = cva(
  "flex shrink-0 items-center justify-center rounded-full font-bold",
  {
    variants: {
      kind: {
        shared: "size-8 bg-brand-900 text-body text-brand-0",
        member: "size-6 bg-member text-caption text-brand-900",
        memo: "size-8 border border-dashed border-brand-500 text-body text-brand-750",
      },
    },
  },
);

/** 지도 화면 (F5). 모바일은 지도가 화면 전체, 웹은 왼쪽 목록 패널(420) + 지도. */
export function MapScreen() {
  const roomId = useRoomId();
  const room = useRoom(roomId);
  if (!room) return null;
  return <MapView room={room} />;
}

function MapView({ room }: { room: RoomView }) {
  const roomId = room.room.id;
  const isDesktop = useIsDesktop();
  const { day, setDay } = useScheduleView(roomId);
  const focusPlaceId = useStore((state) => state.mapFocusPlaceId);
  const places = useStore((state) => state.places);

  // 기본은 공동 일정 핀만. 개인 일정은 스위치로 켜고 멤버를 골라 본다 (F5-4)
  const others = room.members.filter((member) => !member.isMe);
  const [showPersonal, setShowPersonal] = React.useState(false);
  const [memberIds, setMemberIds] = React.useState<string[]>(() =>
    others.length > 0 ? [others[0].id] : [room.me.id],
  );
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);

  const activeMemberIds = React.useMemo(
    () => (showPersonal ? memberIds : []),
    [showPersonal, memberIds],
  );
  const { shared, personal } = useMapPins(room, day, activeMemberIds);
  const allPins = [
    ...shared.pins,
    ...personal.flatMap((schedule) => schedule.pins),
  ];

  // [지도에서 보기]로 넘어온 장소: 일정에 있으면 그 핀을, 없으면 따로 표시한다
  const focusPlace = places
    .filter(hasCoordinates)
    .find((place) => place.id === focusPlaceId);
  const focusPin = allPins.find((pin) => pin.place.id === focusPlaceId);
  const activeKey = selectedKey ?? focusPin?.key ?? null;
  const selectedPin = allPins.find((pin) => pin.key === activeKey) ?? null;

  const fitPoints = [
    ...allPins.map((pin) => pin.place),
    ...(focusPlace && !focusPin ? [focusPlace] : []),
  ];
  const fitKey = `${day}|${activeMemberIds.join(",")}|${focusPlaceId ?? ""}|${allPins.length}`;

  const select = (key: string | null) => {
    setSelectedKey(key);
    if (focusPlaceId) useStore.getState().setMapFocus(null);
  };

  const changeDay = (next: number) => {
    setDay(next);
    select(null);
  };

  const summaryOf = (pin: MapPinData) => (
    <PlaceSummaryCard
      order={pin.order}
      name={pin.place.name}
      time={formatRange(pin.item.start, pin.item.end)}
      meta={pin.meta}
      mapUrl={pin.place.sourceUrl}
      detail={
        pin.canOpen ? (
          <Link href={`/rooms/${roomId}/places/${pin.place.id}`}>
            상세 보기
          </Link>
        ) : undefined
      }
    />
  );

  const dayChips = (
    <DayChips active={day} onChange={changeDay}>
      {Array.from({ length: room.days }, (_, index) => index + 1).map(
        (target) => (
          <DayChip key={target} day={target} active={target === day} />
        ),
      )}
    </DayChips>
  );

  const personalControls = (
    <div className="flex flex-col gap-2">
      <div className="flex min-h-10 items-center justify-between gap-3">
        <Label htmlFor="show-personal">개인 일정 보기</Label>
        <Switch
          id="show-personal"
          checked={showPersonal}
          onCheckedChange={(checked) => {
            setShowPersonal(checked);
            select(null);
          }}
        />
      </div>
      {showPersonal && (
        <ToggleGroup
          type="multiple"
          variant="chip"
          aria-label="개인 일정을 볼 멤버"
          className="h-12 w-full"
          value={memberIds}
          onValueChange={(next) => {
            setMemberIds(next);
            select(null);
          }}
        >
          {/* 멤버가 많아 한 줄에 안 들어가면 좌우 버튼으로 넘긴다 */}
          <ChipSlider label="멤버">
            {room.members.map((member) => (
              <ToggleGroupItem
                key={member.id}
                value={member.id}
                data-member={member.color ?? undefined}
                className="data-[state=on]:border-member-strong data-[state=on]:bg-member data-[state=on]:text-brand-900"
              >
                {member.nickname}
              </ToggleGroupItem>
            ))}
          </ChipSlider>
        </ToggleGroup>
      )}
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1">
      {/* 웹: 왼쪽 목록 패널 */}
      <aside
        aria-label="일정 목록"
        className="hidden w-maplist shrink-0 flex-col border-r border-line bg-brand-50 lg:flex"
      >
        {dayChips}
        <div className="min-h-0 flex-1 overflow-y-auto border-t border-line">
          <div className="flex flex-col gap-8 p-8">
            <ScheduleList
              title={`공동 일정 · Day ${day}`}
              schedule={shared}
              selectedKey={activeKey}
              onSelect={select}
            />
            <section className="flex flex-col gap-3">
              {personalControls}
              <p className="text-caption text-brand-750">
                공동 일정은 진한 핀, 개인 일정은 멤버 색 핀으로 표시돼요.
              </p>
            </section>
            {personal.map((schedule) =>
              schedule.owner === "shared" ? null : (
                <ScheduleList
                  key={schedule.owner.id}
                  title={`${schedule.owner.nickname} 개인 일정 · Day ${day}`}
                  schedule={schedule}
                  selectedKey={activeKey}
                  onSelect={select}
                />
              ),
            )}
          </div>
        </div>
      </aside>

      {/* 지도 */}
      <div className="relative isolate min-w-0 flex-1">
        <div className="absolute inset-0 z-0">
          <MapCanvas
            fitPoints={fitPoints}
            fitKey={fitKey}
            isDesktop={isDesktop}
            onBackgroundClick={() => select(null)}
          >
            {allPins.map((pin) => {
              const selected = pin.key === activeKey;
              const marker = (
                <MapPin
                  kind={pin.kind}
                  member={pin.member?.color}
                  selected={selected}
                  label={`${pin.order}. ${pin.place.name}`}
                  onClick={() => select(pin.key)}
                >
                  {pin.order}
                </MapPin>
              );
              return (
                <PinMarker key={pin.key} position={pin.place} front={selected}>
                  {isDesktop ? (
                    // 웹: 핀 근처에 말풍선 형태의 요약 카드
                    <Popover
                      open={selected}
                      onOpenChange={(open) => {
                        if (!open) select(null);
                      }}
                    >
                      <PopoverAnchor asChild>{marker}</PopoverAnchor>
                      <PopoverContent
                        side="top"
                        sideOffset={28}
                        className="w-80"
                        updatePositionStrategy="always"
                        onOpenAutoFocus={(event) => event.preventDefault()}
                        onFocusOutside={(event) => event.preventDefault()}
                        onPointerDownOutside={(event) => {
                          // 다른 핀을 누른 경우에는 그 핀의 선택 동작에 맡긴다
                          const target = event.target as HTMLElement | null;
                          if (target?.closest("[data-map-pin]"))
                            event.preventDefault();
                        }}
                      >
                        {summaryOf(pin)}
                      </PopoverContent>
                    </Popover>
                  ) : (
                    marker
                  )}
                </PinMarker>
              );
            })}
            {focusPlace && !focusPin && (
              <PinMarker position={focusPlace} front>
                <MapPin
                  kind="shared"
                  selected
                  label={`${focusPlace.name} (일정에 없음)`}
                >
                  <MapPinIcon className="size-5" />
                </MapPin>
              </PinMarker>
            )}
          </MapCanvas>
        </div>

        {/* 모바일: 지도 위 상단 패널 */}
        <div className="absolute inset-x-0 top-0 z-10 flex flex-col border-b border-line bg-brand-50 pt-safe lg:hidden">
          <div className="flex h-14 items-center px-4">
            <h1 className="truncate text-title font-bold text-brand-900">
              {room.room.title}
            </h1>
          </div>
          {dayChips}
          <div className="px-4 pb-2">{personalControls}</div>
        </div>

        {/* 웹: 선택한 날짜 */}
        <p className="absolute top-4 left-4 z-10 hidden rounded-md border border-line bg-brand-0 px-3 py-2 text-caption text-brand-750 lg:block">
          {formatDayDate(room.room.startDate, day)} · Day {day}
        </p>

        {/* 모바일: 핀을 누르면 하단에 요약 카드 */}
        {selectedPin && (
          <div className="absolute inset-x-4 bottom-10 z-10 rounded-xl border border-line bg-brand-0 p-4 shadow-pop lg:hidden">
            {summaryOf(selectedPin)}
          </div>
        )}
        {focusPlace && !focusPin && (
          <p className="absolute inset-x-4 bottom-10 z-10 rounded-xl border border-line bg-brand-0 p-4 text-body text-brand-900 shadow-pop lg:right-auto lg:left-4">
            <span className="font-bold">{focusPlace.name}</span>
            <span className="text-brand-750">
              {" "}
              · 아직 공동 일정에 배치되지 않은 장소예요.
            </span>
          </p>
        )}

      </div>
    </div>
  );
}

/** 웹 왼쪽 패널의 일정 목록. 번호는 지도 핀과 같고, 항목과 핀은 서로 연동된다. */
function ScheduleList({
  title,
  schedule,
  selectedKey,
  onSelect,
}: {
  title: string;
  schedule: MapSchedule;
  selectedKey: string | null;
  onSelect: (key: string) => void;
}) {
  const color = schedule.owner === "shared" ? undefined : schedule.owner.color;
  return (
    <section className="flex flex-col gap-3" data-member={color ?? undefined}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-subtitle font-bold text-brand-900">{title}</h2>
        <span className="text-caption text-brand-750">
          {schedule.pins.length}곳
        </span>
      </div>
      {schedule.rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-brand-500 p-4 text-center text-body text-brand-750">
          이 날은 일정이 없어요.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {schedule.rows.map((row) =>
            row.type === "pin" ? (
              <li key={row.pin.key}>
                <button
                  type="button"
                  aria-pressed={row.pin.key === selectedKey}
                  className={rowVariants({
                    selected: row.pin.key === selectedKey,
                  })}
                  onClick={() => onSelect(row.pin.key)}
                >
                  <span className={numberVariants({ kind: row.pin.kind })}>
                    {row.pin.order}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-body font-medium text-brand-900">
                      {row.pin.place.name}
                    </span>
                    <span className="text-caption text-brand-750">
                      {formatRange(row.pin.item.start, row.pin.item.end)}
                    </span>
                  </span>
                </button>
              </li>
            ) : (
              <li
                key={row.item.id}
                className="flex min-h-14 items-center gap-3 rounded-lg border border-dashed border-brand-600 bg-brand-150 px-3 py-2"
              >
                <span className={numberVariants({ kind: "memo" })}>-</span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-body font-medium text-brand-900">
                    {row.item.title ?? "메모"}
                  </span>
                  <span className="text-caption text-brand-750">
                    메모 · 지도에 표시 안 됨
                  </span>
                </span>
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  );
}
