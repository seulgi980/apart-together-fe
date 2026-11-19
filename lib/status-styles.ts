import { cva } from "class-variance-authority"
import type { PlaceStatus } from "@/lib/types"

/**
 * 취향 상태 → 스타일 매핑의 단일 출처 (ui-spec 2장).
 * 카드, 필터, 지도, 배지가 모두 여기서 가져다 쓴다.
 * 색만으로 구분하지 않도록 테두리 모양(실선/점선, 굵기)도 다르다.
 */

/** 카드 겉모양: 테두리 + 배경 */
export const statusSurface = cva("rounded-lg", {
  variants: {
    status: {
      like: "border border-solid border-like-line bg-linear-to-br from-brand-400 to-brand-300 shadow-card",
      split: "border-2 border-dashed border-split bg-brand-0 shadow-card",
      pass: "border border-solid border-pass-line bg-pass-subtle",
      unrated: "border border-solid border-line bg-brand-0 shadow-card",
      // 나만 카드는 미평가 카드와 같은 모양이고, "나만" 배지로만 구분한다
      private: "border border-solid border-line bg-brand-0 shadow-card",
    } satisfies Record<PlaceStatus, string>,
  },
})

/** 상태 문구 글자색 */
export const statusTextColor = cva("", {
  variants: {
    status: {
      like: "text-like",
      split: "text-split",
      pass: "text-pass",
      unrated: "text-brand-750",
      private: "text-private",
    } satisfies Record<PlaceStatus, string>,
  },
})

/** 카드 안 장소명 글자색 (패스 카드는 흐리게) */
export const statusTitleColor = cva("", {
  variants: {
    status: {
      like: "text-brand-900",
      split: "text-brand-900",
      pass: "text-pass",
      unrated: "text-brand-900",
      private: "text-brand-900",
    } satisfies Record<PlaceStatus, string>,
  },
})

/** 상태 배지에 쓰는 Badge variant */
export const STATUS_BADGE_VARIANT = {
  like: "like",
  split: "split",
  pass: "pass",
  unrated: "outline",
  private: "solid",
} as const satisfies Record<PlaceStatus, string>
