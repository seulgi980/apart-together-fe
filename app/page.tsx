import { redirect } from "next/navigation";

// 이 화면은 그리는 것 없이 곧바로 다른 주소로 보내기만 하므로,
// 개발 서버의 "즉시 이동" 검사 대상에서 뺀다 (검사가 리다이렉트를 오류로 본다).
export const instant = false;

/** 첫 화면은 내 여행방 목록. 로그인하지 않았으면 그 화면이 로그인으로 보낸다. */
export default function HomePage() {
  redirect("/rooms");
}
