import { Suspense } from "react";

import { ScreenSkeleton } from "@/components/app/screen-skeleton";
import { RoomShell } from "@/features/rooms/room-shell";

/**
 * 로그인·참여 여부는 브라우저에서 백엔드 API로 확인한다 (access token은 브라우저 메모리에만 있다).
 * 확인 전에는 하위 화면 대신 로딩 화면을 그리므로, 이 구간은 Next.js의 즉시 이동(instant) 검증에서 제외한다.
 */
export const instant = false;

/** 여행방 화면의 공통 틀 (상단 내비, 하단 탭, 채팅). 주소의 방 id는 요청 시점에 정해진다. */
export default function RoomLayout({ children }: LayoutProps<"/rooms/[roomId]">) {
  return (
    <Suspense fallback={<ScreenSkeleton />}>
      <RoomShell>{children}</RoomShell>
    </Suspense>
  );
}
