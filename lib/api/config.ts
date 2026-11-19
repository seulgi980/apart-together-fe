/**
 * 백엔드 주소. 값이 없으면 로컬 주소를 쓴다.
 * 배포할 때는 도커 이미지를 빌드하면서 NEXT_PUBLIC_API_URL=https://도메인 을 넣는다 (Dockerfile, GitHub Actions).
 * 웹소켓 주소(NEXT_PUBLIC_WS_URL)는 비워 두면 위 주소에서 만든다 (https -> wss, 끝에 /ws).
 * 비어 있는 값("")도 없는 것으로 본다.
 */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
).replace(/\/$/, "")

export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || API_BASE_URL.replace(/^http/, "ws") + "/ws"

/**
 * 지도 화면을 그리는 구글 지도 키 (Maps JavaScript API).
 * 브라우저가 구글에 직접 요청하므로 페이지에 보이는 값이다. 서버의 GOOGLE_MAPS_API_KEY와는 따로 만들고,
 * 구글 콘솔에서 이 사이트 주소에서만 쓰도록 제한한다. 값은 .env.local 에만 넣는다 (git에 올라가지 않는다).
 */
export const GOOGLE_MAPS_BROWSER_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""

/**
 * 구글 지도 ID. 지도의 모양·기능 설정에 붙이는 이름이고, 핀(AdvancedMarker)을 쓰려면 꼭 있어야 한다.
 * DEMO_MAP_ID는 구글이 테스트용으로 열어 둔 값이다. 배포할 때는 구글 콘솔에서 만든 지도 ID로 바꾼다.
 */
export const GOOGLE_MAPS_MAP_ID =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID"
