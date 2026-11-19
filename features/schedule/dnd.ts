import type { PoolEntry, TimelineEntry } from "@/hooks/use-schedule";

/**
 * 드래그 중인 것: 장소 풀의 카드이거나 타임라인의 시간 미정 항목.
 * 놓을 곳은 타임라인의 틈뿐이고, 어느 틈인지는 화면이 직접 계산한다 (findInsertIndex).
 * (시간이 정해진 항목은 시간순으로 자리가 정해지므로 끌 수 없다)
 */
export type DragData =
  { type: "pool"; entry: PoolEntry } | { type: "item"; entry: TimelineEntry };

export const poolDragId = (placeId: string) => `pool:${placeId}`;
export const itemDragId = (itemId: string) => `item:${itemId}`;
/** 끌기 시작한 요소(카드·항목)를 찾을 때 쓰는 표시 */
export const DRAG_SOURCE_ATTRIBUTE = "data-drag-source";
/** 타임라인의 항목 한 줄을 찾을 때 쓰는 표시 */
export const TIMELINE_ROW_ATTRIBUTE = "data-timeline-row";

/**
 * 끌고 있는 카드의 윗변(y)이 타임라인의 몇 번째 틈에 있는지.
 * 0이면 맨 위, 항목 수와 같으면 맨 아래.
 * 그 줄의 가운데보다 아래로 내려가야 다음 틈으로 넘어간다.
 */
export function findInsertIndex(zone: HTMLElement, y: number): number {
  const rows = zone.querySelectorAll(`[${TIMELINE_ROW_ATTRIBUTE}]`);
  let index = 0;
  rows.forEach((row) => {
    const rect = row.getBoundingClientRect();
    if (rect.top + rect.height / 2 < y) index += 1;
  });
  return index;
}
