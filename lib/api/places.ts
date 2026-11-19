import { api, ApiError } from "@/lib/api/client"
import type { GoogleInfoDto, ResolvedPlaceDto } from "@/lib/api/dto"
import { toCategory } from "@/lib/api/mappers"
import type { Category } from "@/lib/types"

/** 구글맵 링크에서 서버가 풀어 준 장소 정보 (F2-2) */
export type ResolvedPlace = {
  placeKey: string
  name: string
  /** 영어 장소명 (구글에서 받은 값. 없을 수 있다) */
  nameEn?: string
  address: string
  /** 영어 주소 (없을 수 있다) */
  addressEn?: string
  area: string
  /** 구글이 좌표를 주지 않은 장소는 null (지도에 표시하지 않는다) */
  lat: number | null
  lng: number | null
  /** 서버가 추천한 카테고리 */
  category?: Category
}

/** 구글에서 받아 온 평점, 영업시간, 웹사이트. 없는 값은 비어 있다. */
export type PlaceGoogleInfo = {
  /** false면 구글에서 정보를 받지 못했다 (서버에 키가 없거나 구글 호출 실패) */
  available: boolean
  rating?: number
  websiteUrl?: string
  /** 요일별 영업시간 문구 (월요일부터) */
  weekdayHours: string[]
}

export type ResolveResult<T> =
  | { ok: true; value: T }
  | { ok: false; notGoogle: boolean; message: string }

const GOOGLE_MAPS_HOSTS = [
  "maps.app.goo.gl",
  "goo.gl",
  "maps.google.com",
  "google.com",
  "www.google.com",
  "google.co.kr",
  "www.google.co.kr",
  "g.co",
]

/** 구글맵 링크인지 확인 (F2-7). 서버도 같은 규칙으로 다시 확인한다. */
export function isGoogleMapsUrl(input: string): boolean {
  try {
    const url = new URL(input.trim())
    if (!GOOGLE_MAPS_HOSTS.includes(url.hostname)) return false
    if (url.hostname === "maps.app.goo.gl" || url.hostname === "maps.google.com") {
      return true
    }
    return url.pathname.startsWith("/maps") || url.hostname === "g.co"
  } catch {
    return false
  }
}

function toResolved(dto: ResolvedPlaceDto): ResolvedPlace {
  return {
    placeKey: dto.placeKey,
    name: dto.name,
    nameEn: dto.nameEn ?? undefined,
    address: dto.address ?? "",
    addressEn: dto.addressEn ?? undefined,
    area: dto.area ?? "",
    lat: dto.latitude,
    lng: dto.longitude,
    category: dto.category ? toCategory(dto.category) : undefined,
  }
}

/**
 * 장소 상세의 구글 정보. 서버가 구글에 물어봐서 돌려준다 (구글 키는 서버에만 있다).
 * 받지 못하면 available이 false다. 화면은 받지 못했다고 알려준다.
 */
export function fetchPlaceGoogleInfo(
  roomId: string,
  placeId: string
): Promise<PlaceGoogleInfo> {
  const key = `${roomId}/${placeId}`
  const cached = googleInfoCache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.result
  const result = requestPlaceGoogleInfo(roomId, placeId)
  googleInfoCache.set(key, { result, expiresAt: Date.now() + GOOGLE_INFO_CACHE_MS })
  // 받지 못한 결과는 기억하지 않는다 (다음에 열면 다시 물어본다)
  void result.then((info) => {
    if (!info.available && googleInfoCache.get(key)?.result === result) {
      googleInfoCache.delete(key)
    }
  })
  return result
}

/**
 * 같은 카드를 다시 열 때 구글을 또 부르지 않도록, 받은 결과를 이 탭에서 10분 동안 기억한다.
 * 새로고침하거나 탭을 닫으면 사라진다. (동시에 같은 카드를 두 번 물어도 요청은 한 번만 나간다)
 */
const GOOGLE_INFO_CACHE_MS = 10 * 60 * 1000
const googleInfoCache = new Map<
  string,
  { result: Promise<PlaceGoogleInfo>; expiresAt: number }
>()

async function requestPlaceGoogleInfo(
  roomId: string,
  placeId: string
): Promise<PlaceGoogleInfo> {
  try {
    const dto = await api<GoogleInfoDto>(
      "GET",
      `/api/trips/${roomId}/places/${placeId}/google-info`
    )
    return {
      available: dto.available,
      rating: dto.info.rating ?? undefined,
      websiteUrl: dto.info.websiteUrl ?? undefined,
      weekdayHours: dto.info.weekdayHours ?? [],
    }
  } catch {
    return { available: false, weekdayHours: [] }
  }
}

function toFailure(error: unknown): { ok: false; notGoogle: boolean; message: string } {
  if (error instanceof ApiError) {
    return {
      ok: false,
      notGoogle: error.code === "NOT_GOOGLE_MAPS_URL",
      message: error.message,
    }
  }
  return { ok: false, notGoogle: false, message: "장소 정보를 불러오지 못했습니다." }
}

/** 구글맵 공유 링크 -> 장소 정보. 서버가 링크를 풀어 장소명·주소·좌표를 채워준다. */
export async function resolvePlaceLink(link: string): Promise<ResolveResult<ResolvedPlace>> {
  try {
    const dto = await api<ResolvedPlaceDto>("POST", "/api/places/resolve", { url: link.trim() })
    return { ok: true, value: toResolved(dto) }
  } catch (error) {
    return toFailure(error)
  }
}
