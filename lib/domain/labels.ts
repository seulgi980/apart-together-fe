import type { Category, PoolFilter } from "@/lib/types"

export const CATEGORY_LABEL: Record<Category, string> = {
  restaurant: "식당",
  cafe: "카페",
  sight: "관광",
  stay: "숙소",
  shopping: "쇼핑",
  etc: "기타",
}

export const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[]

export const FILTER_LABEL: Record<PoolFilter, string> = {
  all: "전체",
  like: "좋아요",
  pass: "패스",
  split: "의견갈림",
  unrated: "미평가",
  "mine-missing": "내가 투표 안 한",
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

/**
 * 링크 사이트의 아이콘(파비콘) 주소 후보 (F2-4).
 * 사이트 도메인만 구글 파비콘 서비스에 보내서 받아온다.
 * 하위 도메인(blog.naver.com)에 아이콘이 없으면 상위 도메인(naver.com)도 시도한다.
 */
export function faviconCandidates(url: string): string[] {
  const host = getDomain(url)
  const hosts = [host]
  const labels = host.split(".")
  if (labels.length > 2) {
    const parent = labels.slice(1)
    // co.kr, ne.jp 같은 공용 접미사만 남는 경우는 제외한다
    const isPublicSuffix =
      parent.length === 2 && parent[0].length <= 3 && parent[1].length === 2
    if (!isPublicSuffix) hosts.push(parent.join("."))
  }
  return hosts.map(
    (name) =>
      `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(name)}`
  )
}

export function isHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

/** 카드의 보조 문구: "관광 · 아사쿠사". 지역명을 얻지 못한 장소는 카테고리만 보여준다. */
export function placeMeta(category: Category, area: string): string {
  return area ? `${CATEGORY_LABEL[category]} · ${area}` : CATEGORY_LABEL[category]
}

/** 이름 가나다순 비교 (장소 카드, 장소 풀 카드 정렬) */
export function compareNames(a: string, b: string): number {
  return a.localeCompare(b, "ko")
}
