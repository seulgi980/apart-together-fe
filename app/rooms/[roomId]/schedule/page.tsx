import { ScheduleScreen } from "@/features/schedule/schedule-screen";

/** 로그인 확인을 브라우저에서 하므로 즉시 이동 검증에서 제외한다 (app/rooms/[roomId]/layout.tsx 참고) */
export const instant = false;

export default function SchedulePage() {
  return <ScheduleScreen />;
}
