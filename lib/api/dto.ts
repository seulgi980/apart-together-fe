/** 백엔드 응답 모양 (따로같이BE/apart-together-be/docs/API.md) */

export type UserDto = {
  id: number
  loginId: string
  nickname: string
  profileImageUrl: string | null
}

export type AuthResponseDto = {
  accessToken: string
  /** access token 수명(초) */
  expiresIn: number
  user: UserDto
}

export type ConfigDto = {
  maxMembers: number
  maxTripDays: number
  pinColorCount: number
  highlightSeconds: number
  /** 서버의 현재 시각 (하이라이트 계산에서 시계 차이를 맞추는 데 쓴다) */
  serverTime: string
}

export type MemberDto = {
  userId: number
  nickname: string
  profileImageUrl: string | null
  pinColorNo: number
  joinedAt: string
}

export type TripDto = {
  id: number
  title: string
  startDate: string
  endDate: string
  dayCount: number
  ownerUserId: number
  inviteCode: string
  members: MemberDto[]
  formerMembers: { userId: number; status: "LEFT" | "KICKED" }[]
  unreadCount: number
}

export type CategoryDto =
  | "RESTAURANT"
  | "CAFE"
  | "SIGHTSEEING"
  | "LODGING"
  | "SHOPPING"
  | "ETC"

export type ReferenceDto = {
  id: number
  url: string
  title: string
  memo: string | null
  addedByUserId: number
}

export type PlaceDto = {
  id: number
  tripId: number
  placeKey: string
  name: string
  /** 영어 장소명. 없으면 null */
  nameEn: string | null
  address: string | null
  /** 영어 주소. 없으면 null */
  addressEn: string | null
  area: string | null
  latitude: number | null
  longitude: number | null
  googleMapsUrl: string
  category: CategoryDto
  memo: string | null
  createdByUserId: number
  votes: Record<string, "LIKE" | "PASS">
  references: ReferenceDto[]
}

export type ResolvedPlaceDto = {
  placeKey: string
  name: string
  /** 영어 장소명. 없으면 null */
  nameEn: string | null
  address: string | null
  /** 영어 주소. 없으면 null */
  addressEn: string | null
  area: string | null
  latitude: number | null
  longitude: number | null
  googleMapsUrl: string
  /** 구글이 알려준 유형으로 고른 카테고리. 모르면 null */
  category: CategoryDto | null
}

/** 구글에서 받아 오는 장소 정보 (상세 패널 위쪽 3칸). 없는 값은 null */
export type GoogleInfoDto = {
  /** false면 구글 키가 없거나 구글에서 이 장소를 찾지 못했다 */
  available: boolean
  info: {
    rating: number | null
    websiteUrl: string | null
    weekdayHours: string[]
  }
}

export type ScheduleItemDto = {
  id: number
  tripId: number
  scope: "SHARED" | "PERSONAL"
  ownerUserId: number | null
  dayNo: number
  kind: "PLACE" | "MEMO"
  placeId: number | null
  placeName: string | null
  placeCategory: CategoryDto | null
  title: string | null
  startTime: string | null
  endTime: string | null
  memo: string | null
  anchorMinute: number | null
  sortOrder: number
  lastChangeType: "ADDED" | "MOVED" | "TIME_CHANGED" | "EDITED"
  lastChangedByUserId: number
  lastChangedAt: string
}

export type ChatMessageDto = {
  id: number
  tripId: number
  kind: "USER" | "SYSTEM" | "PLACE"
  senderUserId: number | null
  content: string
  sharedPlaceId: number | null
  createdAt: string
}

export type ChatPageDto = { messages: ChatMessageDto[]; hasMore: boolean }

export type PresenceDto = { viewers: { userId: number; day: number }[] }

/** WebSocket 이벤트 (/topic/trips/{tripId}). actorUserId: 변경한 회원 */
export type TripEventDto = { actorUserId?: number | null } & TripEventBody

type TripEventBody =
  | { type: "CHAT_MESSAGE"; payload: ChatMessageDto }
  | {
      type: "SCHEDULE_CHANGED"
      payload: { upserted: ScheduleItemDto[]; removedIds: number[] }
    }
  | { type: "PLACE_UPSERTED"; payload: PlaceDto }
  | { type: "PLACE_DELETED"; payload: { placeId: number; removedItemIds: number[] } }
  | {
      type: "VOTE_CHANGED"
      payload: { placeId: number; userId: number; vote: "LIKE" | "PASS" | null }
    }
  | { type: "MEMBER_JOINED"; payload: MemberDto }
  | { type: "MEMBER_REMOVED"; payload: { userId: number; status: "LEFT" | "KICKED" } }
  | {
      type: "MEMBER_UPDATED"
      payload: {
        userId: number
        pinColorNo?: number
        nickname?: string
        profileImageUrl?: string | null
      }
    }
  | {
      type: "TRIP_UPDATED"
      payload: {
        title: string
        startDate: string
        endDate: string
        inviteCode: string
        removedItemIds: number[]
      }
    }
  | { type: "TRIP_DELETED"; payload: Record<string, never> }
  | { type: "PRESENCE_CHANGED"; payload: PresenceDto }
