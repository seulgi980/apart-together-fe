import type {
  CategoryDto,
  ChatMessageDto,
  PlaceDto,
  ScheduleItemDto,
  TripDto,
  UserDto,
} from "@/lib/api/dto"
import { formatClock } from "@/lib/domain/dates"
import type {
  Category,
  ChatMessage,
  MemberColor,
  Place,
  Room,
  ScheduleItem,
  User,
  Vote,
} from "@/lib/types"

/** 백엔드 응답 -> 화면에서 쓰는 타입 (lib/types.ts). ID는 문자열로 바꿔 쓴다. */

const CATEGORY_FROM_DTO: Record<CategoryDto, Category> = {
  RESTAURANT: "restaurant",
  CAFE: "cafe",
  SIGHTSEEING: "sight",
  LODGING: "stay",
  SHOPPING: "shopping",
  ETC: "etc",
}

const CATEGORY_TO_DTO: Record<Category, CategoryDto> = {
  restaurant: "RESTAURANT",
  cafe: "CAFE",
  sight: "SIGHTSEEING",
  stay: "LODGING",
  shopping: "SHOPPING",
  etc: "ETC",
}

const CHANGE_TYPE = {
  ADDED: "added",
  MOVED: "moved",
  TIME_CHANGED: "time",
  EDITED: "edited",
} as const

export function toCategory(category: CategoryDto): Category {
  return CATEGORY_FROM_DTO[category]
}

export function toCategoryDto(category: Category): CategoryDto {
  return CATEGORY_TO_DTO[category]
}

/**
 * 내 시계와 서버 시계의 차이(ms). 하이라이트(방금 변경됨 30초)는 서버가 기록한 시각을 기준으로 하므로,
 * 내 기기의 시계가 틀려도 맞게 보이도록 서버 시각을 내 시계 기준으로 옮겨 쓴다.
 */
let clockOffset = 0

export function setServerTime(serverTime: string) {
  const parsed = Date.parse(serverTime)
  if (!Number.isNaN(parsed)) clockOffset = Date.now() - parsed
}

export function toUser(dto: UserDto): User {
  return {
    id: String(dto.id),
    loginId: dto.loginId,
    nickname: dto.nickname,
    avatarUrl: dto.profileImageUrl ?? undefined,
  }
}

/** 방 정보와, 그 방 멤버들의 회원 정보 */
export function toRoom(dto: TripDto): { room: Room; users: User[]; unread: number } {
  return {
    room: {
      id: String(dto.id),
      title: dto.title,
      startDate: dto.startDate,
      endDate: dto.endDate,
      ownerId: String(dto.ownerUserId),
      inviteCode: dto.inviteCode,
      members: dto.members.map((member) => ({
        userId: String(member.userId),
        color: member.pinColorNo as MemberColor,
      })),
      formerMembers: dto.formerMembers.map((member) => ({
        userId: String(member.userId),
        status: member.status === "KICKED" ? "kicked" : "left",
      })),
    },
    users: dto.members.map((member) => ({
      id: String(member.userId),
      nickname: member.nickname,
      avatarUrl: member.profileImageUrl ?? undefined,
    })),
    unread: dto.unreadCount,
  }
}

export function toPlace(dto: PlaceDto): Place {
  const votes: Record<string, Vote> = {}
  for (const [userId, vote] of Object.entries(dto.votes)) {
    votes[userId] = vote === "LIKE" ? "like" : "pass"
  }
  return {
    id: String(dto.id),
    roomId: String(dto.tripId),
    placeKey: dto.placeKey,
    name: dto.name,
    nameEn: dto.nameEn ?? undefined,
    address: dto.address ?? "",
    addressEn: dto.addressEn ?? undefined,
    area: dto.area ?? "",
    lat: dto.latitude,
    lng: dto.longitude,
    sourceUrl: dto.googleMapsUrl,
    category: CATEGORY_FROM_DTO[dto.category],
    memo: dto.memo ?? undefined,
    scope: dto.visibility === "SHARED" ? "shared" : "private",
    createdBy: String(dto.createdByUserId),
    votes,
    references: dto.references.map((reference) => ({
      id: String(reference.id),
      title: reference.title,
      url: reference.url,
      memo: reference.memo ?? undefined,
      addedBy: String(reference.addedByUserId),
    })),
  }
}

export function toItem(dto: ScheduleItemDto): ScheduleItem {
  const changedAt = Date.parse(dto.lastChangedAt)
  return {
    id: String(dto.id),
    roomId: String(dto.tripId),
    owner: dto.scope === "SHARED" ? "shared" : String(dto.ownerUserId),
    day: dto.dayNo,
    kind: dto.kind === "MEMO" ? "memo" : "place",
    placeId: dto.placeId === null ? undefined : String(dto.placeId),
    placeName: dto.placeName ?? undefined,
    placeCategory: dto.placeCategory ? CATEGORY_FROM_DTO[dto.placeCategory] : undefined,
    title: dto.title ?? undefined,
    start: dto.startTime ?? undefined,
    end: dto.endTime ?? undefined,
    note: dto.memo ?? undefined,
    order: dto.sortOrder,
    anchor: dto.anchorMinute ?? undefined,
    changedBy: String(dto.lastChangedByUserId),
    changedAt: Number.isNaN(changedAt) ? undefined : changedAt + clockOffset,
    changeType: CHANGE_TYPE[dto.lastChangeType],
  }
}

export function toMessage(dto: ChatMessageDto): ChatMessage {
  return {
    id: String(dto.id),
    seq: dto.id,
    roomId: String(dto.tripId),
    kind: dto.kind === "SYSTEM" ? "system" : dto.kind === "PLACE" ? "place" : "user",
    userId: dto.senderUserId === null ? undefined : String(dto.senderUserId),
    text: dto.kind === "PLACE" ? "장소 카드를 공유했어요" : dto.content,
    placeId: dto.sharedPlaceId === null ? undefined : String(dto.sharedPlaceId),
    time: formatClock(new Date(dto.createdAt)),
  }
}
