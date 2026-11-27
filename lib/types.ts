/** 도메인 타입. 백엔드 API가 붙으면 응답 타입을 여기에 맞춘다. */

export type MemberColor = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export const MEMBER_COLORS: MemberColor[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
export const MAX_MEMBERS = 10

/** 회원 정보 (닉네임, 프로필 사진). 핀 색은 여행방 멤버 정보다. */
export type User = {
  id: string
  /** 내 계정에만 있다 (다른 멤버의 아이디는 받지 않는다) */
  loginId?: string
  nickname: string
  avatarUrl?: string
}

export type RoomMember = {
  userId: string
  color: MemberColor
}

/** 방을 떠난 멤버: left = 스스로 나감(다시 들어올 수 있음), kicked = 내보내짐(다시 들어올 수 없음) */
export type FormerMember = {
  userId: string
  status: "left" | "kicked"
}

export type Room = {
  id: string
  title: string
  /** YYYY-MM-DD */
  startDate: string
  /** YYYY-MM-DD */
  endDate: string
  ownerId: string
  inviteCode: string
  members: RoomMember[]
  /** 방을 떠난 멤버의 기록. 내보내진 멤버의 재참여를 막는 데 쓴다. */
  formerMembers?: FormerMember[]
}

/** 화면에서 쓰는 멤버 (회원 정보 + 방 안의 핀 색) */
export type MemberView = {
  id: string
  nickname: string
  avatarUrl?: string
  /** 탈퇴한 멤버는 null */
  color: MemberColor | null
  isMe: boolean
}

export type Category =
  | "restaurant"
  | "cafe"
  | "sight"
  | "stay"
  | "shopping"
  | "etc"

export type Vote = "like" | "pass"

/** 취향 상태 (F3-2) */
export type PlaceStatus = "like" | "split" | "pass" | "unrated"

export type Reference = {
  id: string
  title: string
  url: string
  memo?: string
  addedBy: string
}

export type Place = {
  id: string
  roomId: string
  /** 구글맵 장소 식별자. 방마다 같은 장소는 1장 (중복 등록 판단 기준) */
  placeKey: string
  name: string
  /** 영어 장소명 (구글에서 받은 값. 없을 수 있다) */
  nameEn?: string
  address: string
  /** 영어 주소 (없을 수 있다) */
  addressEn?: string
  /** 카드에 보이는 짧은 지역명 (한국어. 구글에 한국어가 없으면 영어일 수 있다) */
  area: string
  /** 영어 지역명 (없을 수 있다). 화면은 "영어 (한국어)"로 보여준다 (formatArea) */
  areaEn?: string
  /** 좌표를 얻지 못한 장소는 null. 지도에 표시하지 않는다. */
  lat: number | null
  lng: number | null
  /** 등록할 때 붙여넣은 구글맵 링크 */
  sourceUrl: string
  category: Category
  memo?: string
  createdBy: string
  votes: Record<string, Vote>
  references: Reference[]
}

/** 일정의 주인: 공동 일정이거나 멤버의 개인 일정 */
export type ScheduleOwner = "shared" | (string & {})

export type ScheduleItem = {
  id: string
  roomId: string
  owner: ScheduleOwner
  /** 1부터 시작 */
  day: number
  kind: "place" | "memo"
  placeId?: string
  /** 장소 항목의 장소명·카테고리 (서버가 함께 내려준다. 카드가 지워졌으면 없다) */
  placeName?: string
  placeCategory?: Category
  /** 메모 항목의 제목 ("숙소 체크인" 등) */
  title?: string
  /** HH:MM. 없으면 시간 미정 */
  start?: string
  /** HH:MM. 선택 */
  end?: string
  /** 항목에 붙인 메모 */
  note?: string
  /** 같은 자리에 놓인 시간 미정 항목끼리의 순서 */
  order: number
  /**
   * 시간 미정 항목이 타임라인에서 놓인 자리: 바로 앞 시간 항목의 시작 시각(분).
   * -1이면 맨 위, 없으면 맨 아래.
   */
  anchor?: number
  /** 변경 가시화 (F4-17) */
  changedBy?: string
  changedAt?: number
  /** added 추가 · moved Day 이동 · time 시간 변경 · edited 메모 등 내용 수정 */
  changeType?: "added" | "moved" | "time" | "edited"
}

/**
 * 내가 보냈지만 서버 확인을 아직 못 받은 메시지 (보낸 사람 화면에만 있다).
 * 서버가 받으면 같은 clientId의 진짜 메시지가 와서 이 항목은 사라진다.
 */
export type OutgoingMessage = {
  /** 보낼 때 만든 번호표. 서버가 응답·이벤트·거절 알림에 그대로 돌려준다. [재전송]도 같은 번호표로 보낸다. */
  clientId: string
  roomId: string
  /** sending: 전송 중 (흐리게) / failed: 실패 (재전송·삭제) */
  status: "sending" | "failed"
  /** 일반 메시지면 내용, 장소 카드 공유면 공유할 카드 */
  content?: string
  placeId?: string
}

export type ChatMessage = {
  id: string
  /** 서버의 메시지 번호. 순서 정렬과 이전 메시지 조회에 쓴다. */
  seq: number
  roomId: string
  kind: "user" | "system" | "place"
  userId?: string
  text: string
  /**
   * kind가 place일 때 공유한 장소 카드.
   * kind가 system이면 "OO님이 XX 장소 카드를 추가했습니다." 알림이 가리키는 카드 (카드 등록 알림)
   */
  placeId?: string
  /** 표시용 시각 ("오후 2:10") */
  time: string
  /** 표시용 날짜 ("2026년 11월 25일"). 날짜가 바뀌는 첫 메시지 위에 구분선으로 한 번 보여준다. */
  date: string
}

export type PoolFilter = "all" | PlaceStatus | "mine-missing"
