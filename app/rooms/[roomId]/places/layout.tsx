import { PlacesLayout } from "@/features/places/places-layout";

/** 장소 목록은 레이아웃에 두어 카드를 골라도 스크롤과 필터가 유지된다. */
export default function PlacesRouteLayout({
  children,
}: LayoutProps<"/rooms/[roomId]/places">) {
  return <PlacesLayout>{children}</PlacesLayout>;
}
