import { RoomIndexRedirect } from "@/features/rooms/room-index-redirect";

/** 로그인 확인을 브라우저에서 하므로 즉시 이동 검증에서 제외한다 (app/rooms/[roomId]/layout.tsx 참고) */
export const instant = false;

/** 방 주소로만 들어오면 메인 화면인 일정으로 보낸다. */
export default function RoomPage() {
  return <RoomIndexRedirect />;
}
