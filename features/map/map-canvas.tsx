"use client";

import * as React from "react";
import {
  AdvancedMarker,
  APIProvider,
  Map,
  useMap,
} from "@vis.gl/react-google-maps";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  GOOGLE_MAPS_BROWSER_KEY,
  GOOGLE_MAPS_MAP_ID,
} from "@/lib/api/config";

/**
 * 구글 지도. React Google Maps 라이브러리(@vis.gl/react-google-maps)로 그린다.
 * 브라우저에서만 그려야 해서 map-screen이 동적으로 불러온다.
 *  - APIProvider: 구글 지도 스크립트를 한 번 불러온다.
 *  - Map: 지도.
 *  - AdvancedMarker: 좌표에 우리 핀(React 요소)을 붙인다 (PinMarker). 지도 ID(mapId)가 있어야 쓸 수 있다.
 * 핀 사이를 잇는 경로 선은 그리지 않는다 (순서는 핀의 번호로 본다).
 *
 * 키는 NEXT_PUBLIC_GOOGLE_MAPS_API_KEY로 받는다. 지도는 브라우저가 구글에 직접 요청하므로
 * 이 키는 페이지에 보인다. 값은 .env.local 에만 넣고 코드에는 적지 않는다.
 */

export type MapPoint = { lat: number; lng: number };

/** 도쿄 시내 (핀이 하나도 없을 때의 기본 위치) */
const DEFAULT_CENTER: MapPoint = { lat: 35.6812, lng: 139.7671 };
/** 핀에 맞춰 화면을 잡을 때 이보다 더 확대하지 않는다 */
const MAX_FIT_ZOOM = 15;

export function MapCanvas({
  fitPoints,
  fitKey,
  isDesktop,
  onBackgroundClick,
  children,
}: {
  /** 화면에 모두 들어오게 맞출 좌표 */
  fitPoints: MapPoint[];
  /** 이 값이 바뀔 때만 화면을 다시 맞춘다 (Day, 멤버 선택 등) */
  fitKey: string;
  isDesktop: boolean;
  onBackgroundClick: () => void;
  /** PinMarker 목록 */
  children: React.ReactNode;
}) {
  const [failed, setFailed] = React.useState(false);

  // 키가 틀렸거나 이 주소에서 쓸 수 없는 키면 구글이 이 함수를 부른다
  React.useEffect(() => {
    const target = window as unknown as { gm_authFailure?: () => void };
    target.gm_authFailure = () => setFailed(true);
    return () => {
      delete target.gm_authFailure;
    };
  }, []);

  if (!GOOGLE_MAPS_BROWSER_KEY || failed) {
    return (
      <div className="flex size-full items-center justify-center bg-brand-200 p-8">
        <p className="max-w-80 text-center text-body text-brand-750">
          {GOOGLE_MAPS_BROWSER_KEY
            ? "지도를 불러오지 못했어요. 구글 지도 키가 이 주소에서 쓸 수 있는 키인지 확인해 주세요."
            : "지도를 표시하려면 구글 지도 키(NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)가 필요해요."}
        </p>
      </div>
    );
  }

  return (
    <APIProvider
      apiKey={GOOGLE_MAPS_BROWSER_KEY}
      language="ko"
      onError={() => setFailed(true)}
    >
      <div className="relative size-full bg-brand-200">
        <Map
          className="size-full"
          mapId={GOOGLE_MAPS_MAP_ID}
          defaultCenter={DEFAULT_CENTER}
          defaultZoom={12}
          // 구글 기본 버튼은 끄고 확대/축소 버튼만 우리 것으로 둔다 (구글 로고와 저작권 표시는 남는다)
          disableDefaultUI
          // 지도 위의 가게 아이콘을 눌러도 구글 정보창이 뜨지 않게 한다
          clickableIcons={false}
          gestureHandling="greedy"
          onClick={onBackgroundClick}
        >
          {children}
        </Map>
        <FitBounds points={fitPoints} fitKey={fitKey} isDesktop={isDesktop} />
        <ZoomButtons />
      </div>
    </APIProvider>
  );
}

/** 핀이 모두 보이게 화면을 맞춘다 */
function FitBounds({
  points,
  fitKey,
  isDesktop,
}: {
  points: MapPoint[];
  fitKey: string;
  isDesktop: boolean;
}) {
  const map = useMap();
  const pointsRef = React.useRef(points);
  React.useEffect(() => {
    pointsRef.current = points;
  });

  React.useEffect(() => {
    const current = pointsRef.current;
    if (!map || current.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    for (const point of current) bounds.extend(point);
    // 모바일은 위쪽 패널과 아래 요약 카드에 가려지는 만큼 여백을 더 둔다
    map.fitBounds(
      bounds,
      isDesktop
        ? { top: 64, right: 64, bottom: 64, left: 64 }
        : { top: 240, right: 40, bottom: 200, left: 40 },
    );
    // 핀이 하나뿐이거나 서로 가까우면 너무 크게 확대되므로 한 번 되돌린다
    const listener = google.maps.event.addListenerOnce(map, "idle", () => {
      if ((map.getZoom() ?? 0) > MAX_FIT_ZOOM) map.setZoom(MAX_FIT_ZOOM);
    });
    return () => listener.remove();
  }, [map, fitKey, isDesktop]);

  return null;
}

/** 웹 전용 확대/축소 버튼 (모바일은 두 손가락으로 확대한다) */
function ZoomButtons() {
  const map = useMap();
  if (!map) return null;
  const zoomBy = (delta: number) => map.setZoom((map.getZoom() ?? 12) + delta);
  return (
    <div className="absolute top-4 right-4 z-10 hidden flex-col gap-2 lg:flex">
      <Button
        variant="outline"
        size="icon"
        aria-label="지도 확대"
        onClick={() => zoomBy(1)}
      >
        <Plus />
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label="지도 축소"
        onClick={() => zoomBy(-1)}
      >
        <Minus />
      </Button>
    </div>
  );
}

/** 지도 좌표에 React 요소(핀)를 붙인다. 자식은 좌표 지점을 기준으로 놓인다. */
export function PinMarker({
  position,
  front = false,
  children,
}: {
  position: MapPoint;
  /** 선택된 핀은 다른 핀 위로 올린다 */
  front?: boolean;
  children: React.ReactNode;
}) {
  return (
    <AdvancedMarker
      position={{ lat: position.lat, lng: position.lng }}
      zIndex={front ? 1000 : 0}
      // 핀이 클릭을 받게 한다. 핀을 누른 것은 지도 배경 클릭으로 처리되지 않는다.
      // (실제 동작은 핀 안의 React 요소가 처리한다)
      clickable
    >
      {/* 크기 0짜리 기준점. 핀은 이 점을 중심으로 스스로 자리를 잡는다. */}
      <div className="relative size-0">{children}</div>
    </AdvancedMarker>
  );
}
