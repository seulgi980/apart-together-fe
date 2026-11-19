import { notFound } from "next/navigation";

import { Styleguide } from "@/features/styleguide/styleguide";

/** 개발 중에만 열리는 스타일 가이드: 모든 토큰과 공용 컴포넌트의 variant를 한 화면에서 확인한다. */
export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Styleguide />;
}
