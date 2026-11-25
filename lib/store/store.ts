"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

import {
  api,
  ApiError,
  authApi,
  publicGet,
  refreshSession,
  setSessionExpiredHandler,
} from "@/lib/api/client"
import type {
  ChatMessageDto,
  ChatPageDto,
  ConfigDto,
  MemberDto,
  PlaceDto,
  PresenceDto,
  ScheduleItemDto,
  TripDto,
  TripEventDto,
  UserDto,
} from "@/lib/api/dto"
import {
  setServerTime,
  toCategoryDto,
  toItem,
  toMessage,
  toPlace,
  toRoom,
  toUser,
} from "@/lib/api/mappers"
import { countDays } from "@/lib/domain/dates"
import { layoutSequence } from "@/lib/domain/schedule"
import { realtime } from "@/lib/realtime/socket"
import type {
  Category,
  ChatMessage,
  MemberColor,
  Place,
  Room,
  ScheduleItem,
  ScheduleOwner,
  User,
  Vote,
} from "@/lib/types"

/**
 * 화면이 쓰는 데이터 저장소.
 * 데이터의 주인은 백엔드다. 여기는 서버에서 받은 것을 담아 두는 곳이고,
 * 모든 변경은 API를 부른 뒤 서버 응답(과 WebSocket 이벤트)으로 반영한다. 검증도 서버가 한다.
 */

/** 일정 변경 결과 (F4-19, F4-22) */
export type ScheduleResult =
  | { ok: true }
  | {
      ok: false
      reason: "overlap"
      /** 현재 확정된 항목의 위치 */
      conflict: { day: number; start?: string }
    }
  /** 그 밖의 거절 (메시지를 그대로 보여준다) */
  | { ok: false; reason: "error"; message: string }

export type JoinResult =
  | { status: "joined" | "already"; roomId: string }
  /** kicked: 이 방에서 내보내져서 다시 들어올 수 없다 */
  | { status: "full" | "not-found" | "kicked" }
  | { status: "error"; message: string }

/** 성공 또는 사용자에게 보여줄 실패 메시지 */
export type ActionResult = { ok: true } | { ok: false; message: string; code?: string }

export type PlaceDraft = {
  placeKey: string
  name: string
  /** 영어 장소명 (구글에서 받은 값. 없을 수 있다) */
  nameEn?: string
  address: string
  /** 영어 주소 (없을 수 있다) */
  addressEn?: string
  area: string
  /** 영어 지역명 (없을 수 있다) */
  areaEn?: string
  lat: number | null
  lng: number | null
  sourceUrl: string
  category: Category
  memo?: string
}

export type ReferenceDraft = {
  title: string
  url: string
  memo?: string
}

export type AppConfig = {
  maxMembers: number
  maxTripDays: number
  pinColorCount: number
  highlightSeconds: number
}

type DataState = {
  /** 내 계정과, 내가 참여한 방의 멤버들 */
  users: User[]
  rooms: Room[]
  places: Place[]
  items: ScheduleItem[]
  messages: ChatMessage[]
  sessionUserId: string | null
  unread: Record<string, number>
  /** 방마다 더 불러올 이전 메시지가 있는지 */
  hasOlder: Record<string, boolean>
  /** 방마다 다른 멤버가 보고 있는 Day: userId -> day (F4-16) */
  presence: Record<string, Record<string, number>>
  config: AppConfig
}

/** 브라우저에 남겨 두는 화면 설정 (서버 데이터는 저장하지 않는다) */
type ViewState = {
  /** 방마다 보고 있는 Day */
  dayByRoom: Record<string, number>
  /** 방마다 선택한 사람 탭 */
  tabByRoom: Record<string, ScheduleOwner>
  /** 웹 일정 화면의 채팅 패널 열림 여부 */
  chatDocked: boolean
}

type TransientState = {
  /** 처음 로그인 확인(재발급 시도)이 끝났는지 */
  hydrated: boolean
  /** 모바일 채팅 슬라이드 패널 열림 여부 */
  chatSheetOpen: boolean
  /** 로그인 전에 열어 본 초대 코드 (로그인 후 참여 절차로 이어진다) */
  pendingInvite: string | null
  /** [지도에서 보기]로 지도에서 강조할 장소 */
  mapFocusPlaceId: string | null
  /** [일정으로 이동]으로 넘어와 잠깐 강조할 일정 항목 */
  focusItemId: string | null
  /** 일정 화면에서 상세 패널로 열어 둔 장소 */
  schedulePlaceId: string | null
  /**
   * 장소 풀에서 골라 둔 카드. 고른 카드는 선택 표시가 되고, 그 카드가 놓인 Day 탭과 일정 줄이 강조된다.
   * 고르면 상세 패널도 함께 열리고, 다시 누르거나 상세를 닫으면 풀린다.
   */
  poolSelectedId: string | null
  /** 웹 일정 화면 오른쪽 자리에 채팅과 장소 상세가 둘 다 열려 있을 때, 나중에 연 쪽 (그쪽을 보여준다) */
  scheduleFront: "chat" | "place"
}

type Actions = {
  /** 앱을 열 때 한 번: 설정값을 받고, refresh 쿠키로 로그인 상태를 되살린다 (F1-3) */
  bootstrap: () => Promise<void>

  login: (loginId: string, password: string) => Promise<ActionResult>
  signup: (input: { loginId: string; password: string; nickname: string }) => Promise<ActionResult>
  logout: () => Promise<void>
  /** avatar: 새로 고른 사진 파일 / null이면 사진 지우기 / undefined면 그대로 */
  updateProfile: (input: { nickname: string; avatar?: File | null }) => Promise<ActionResult>
  setPendingInvite: (code: string | null) => void

  loadRooms: () => Promise<void>
  /** 방에 들어갈 때: 방 정보, 장소 카드, 일정, 채팅, 보는 중 표시를 한 번에 불러온다 */
  loadRoom: (roomId: string) => Promise<void>
  createRoom: (input: { title: string; startDate: string; endDate: string }) => Promise<string | null>
  joinByCode: (code: string) => Promise<JoinResult>
  /** confirmedDelete: 기간을 줄여 사라지는 일정을 지워도 된다고 확인받았는지 (F1-8) */
  updateRoom: (
    roomId: string,
    input: { title: string; startDate: string; endDate: string },
    confirmedDelete: boolean
  ) => Promise<ActionResult>
  /** reason: left = 스스로 나감, kicked = 방장이 내보냄 (다시 들어올 수 없다) */
  removeMember: (roomId: string, userId: string, reason: "left" | "kicked") => Promise<ActionResult>
  regenerateInvite: (roomId: string) => Promise<ActionResult>
  deleteRoom: (roomId: string) => Promise<ActionResult>
  changeMemberColor: (roomId: string, color: MemberColor) => Promise<ActionResult>

  addPlace: (
    roomId: string,
    draft: PlaceDraft
  ) => Promise<{ ok: true; id: string } | { ok: false; duplicate: boolean; message: string }>
  updatePlace: (placeId: string, patch: { name: string; category: Category; memo?: string }) => Promise<ActionResult>
  deletePlace: (placeId: string) => Promise<ActionResult>
  vote: (placeId: string, vote: Vote) => Promise<ActionResult>
  addReference: (placeId: string, draft: ReferenceDraft) => Promise<ActionResult>
  updateReference: (placeId: string, referenceId: string, draft: ReferenceDraft) => Promise<ActionResult>
  deleteReference: (placeId: string, referenceId: string) => Promise<ActionResult>

  /** index를 주면 타임라인의 그 자리(0 = 맨 위)에 끼워 넣는다. 없으면 맨 아래 시간 미정으로. */
  placeItem: (input: { roomId: string; owner: ScheduleOwner; day: number; placeId: string; start?: string; end?: string; index?: number }) => Promise<ScheduleResult>
  addMemoItem: (input: { roomId: string; owner: ScheduleOwner; day: number; title: string; start?: string; end?: string }) => Promise<ScheduleResult>
  /** patch에 start 키가 있으면 시간 변경이다 (값이 없으면 시간 미정으로) */
  updateItem: (itemId: string, patch: { title?: string; start?: string; end?: string; note?: string }) => Promise<ScheduleResult>
  moveItemToDay: (itemId: string, day: number) => Promise<ScheduleResult>
  removeItem: (itemId: string) => Promise<ScheduleResult>
  /** 한 Day의 항목을 주어진 순서로 다시 놓는다 (시간 미정 항목을 끌어 옮길 때) */
  arrangeDay: (input: { roomId: string; owner: ScheduleOwner; day: number; orderedIds: string[]; movedId: string }) => Promise<ScheduleResult>

  sendMessage: (roomId: string, text: string) => Promise<void>
  sharePlace: (roomId: string, placeId: string) => Promise<void>
  loadOlderMessages: (roomId: string) => Promise<void>
  markRead: (roomId: string) => Promise<void>

  /** WebSocket으로 받은 이벤트를 반영한다 */
  applyEvent: (roomId: string, event: TripEventDto) => void

  setDay: (roomId: string, day: number) => void
  setTab: (roomId: string, tab: ScheduleOwner) => void
  setChatDocked: (open: boolean) => void
  setChatSheetOpen: (open: boolean) => void
  setMapFocus: (placeId: string | null) => void
  setFocusItem: (itemId: string | null) => void
  setSchedulePlace: (placeId: string | null) => void
  /** 장소 풀 카드를 누를 때: 고르면서 상세를 열고, 이미 고른 카드면 풀면서 상세를 닫는다 */
  togglePoolPlace: (placeId: string) => void
}

export type Store = DataState & ViewState & TransientState & Actions

const DEFAULT_CONFIG: AppConfig = {
  maxMembers: 10,
  maxTripDays: 99,
  pinColorCount: 10,
  highlightSeconds: 30,
}

function emptyData(): DataState {
  return {
    users: [],
    rooms: [],
    places: [],
    items: [],
    messages: [],
    sessionUserId: null,
    unread: {},
    hasOlder: {},
    presence: {},
    config: DEFAULT_CONFIG,
  }
}

/* ───────── 도우미 ───────── */

function failure(error: unknown): { ok: false; message: string; code?: string } {
  if (error instanceof ApiError) {
    return { ok: false, message: error.message, code: error.code }
  }
  return { ok: false, message: "요청을 처리하지 못했습니다." }
}

/** id가 같은 것은 바꾸고 없는 것은 더한다 */
function upsert<T extends { id: string }>(list: T[], incoming: T[]): T[] {
  if (incoming.length === 0) return list
  const byId = new Map(incoming.map((entry) => [entry.id, entry]))
  const next = list.map((entry) => {
    const replaced = byId.get(entry.id)
    if (replaced) byId.delete(entry.id)
    return replaced ?? entry
  })
  return [...next, ...byId.values()]
}

function mergeUsers(current: User[], incoming: User[]): User[] {
  const byId = new Map(current.map((user) => [user.id, user]))
  for (const user of incoming) {
    // 내 계정의 loginId는 멤버 정보에 없으므로 지우지 않고 합친다
    byId.set(user.id, { ...byId.get(user.id), ...user })
  }
  return [...byId.values()]
}

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  return upsert(current, incoming).sort((a, b) => a.seq - b.seq)
}

function scheduleFailure(error: unknown): ScheduleResult {
  if (error instanceof ApiError && error.code === "SCHEDULE_OVERLAP") {
    const conflict = (error.data.conflict ?? {}) as { dayNo?: number; startTime?: string | null }
    return {
      ok: false,
      reason: "overlap",
      conflict: { day: conflict.dayNo ?? 0, start: conflict.startTime ?? undefined },
    }
  }
  return { ok: false, reason: "error", message: failure(error).message }
}

function placeBody(draft: PlaceDraft) {
  return {
    placeKey: draft.placeKey,
    name: draft.name,
    nameEn: draft.nameEn || null,
    address: draft.address || null,
    addressEn: draft.addressEn || null,
    area: draft.area || null,
    areaEn: draft.areaEn || null,
    latitude: draft.lat,
    longitude: draft.lng,
    googleMapsUrl: draft.sourceUrl,
    category: toCategoryDto(draft.category),
    memo: draft.memo || null,
  }
}

function toPresence(dto: PresenceDto): Record<string, number> {
  const viewers: Record<string, number> = {}
  for (const viewer of dto.viewers) viewers[String(viewer.userId)] = viewer.day
  return viewers
}

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      /** 방 하나의 서버 응답을 저장소에 넣는다 */
      const putRoom = (dto: TripDto) => {
        const { room, users, unread } = toRoom(dto)
        set((state) => ({
          rooms: state.rooms.some((candidate) => candidate.id === room.id)
            ? state.rooms.map((candidate) => (candidate.id === room.id ? room : candidate))
            : [...state.rooms, room],
          users: mergeUsers(state.users, users),
          unread: { ...state.unread, [room.id]: unread },
        }))
        return room
      }

      /** 내가 더 이상 멤버가 아닌 방의 데이터를 비운다 */
      const dropRoom = (roomId: string) =>
        set((state) => ({
          rooms: state.rooms.filter((room) => room.id !== roomId),
          places: state.places.filter((place) => place.roomId !== roomId),
          items: state.items.filter((item) => item.roomId !== roomId),
          messages: state.messages.filter((message) => message.roomId !== roomId),
        }))

      const putPlace = (dto: PlaceDto) =>
        set((state) => ({ places: upsert(state.places, [toPlace(dto)]) }))

      const putItems = (dtos: ScheduleItemDto[]) =>
        set((state) => ({ items: upsert(state.items, dtos.map(toItem)) }))

      const putMessages = (dtos: ChatMessageDto[]) =>
        set((state) => ({ messages: mergeMessages(state.messages, dtos.map(toMessage)) }))

      const startSession = (user: UserDto) =>
        set((state) => ({
          sessionUserId: String(user.id),
          users: mergeUsers(state.users, [toUser(user)]),
        }))

      /** 멤버가 아니게 된 방에서 온 거절이면 방을 비운다 */
      const handleFailure = (roomId: string | undefined, error: unknown) => {
        if (roomId && error instanceof ApiError && error.code === "NOT_TRIP_MEMBER") {
          dropRoom(roomId)
        }
      }

      const roomOfPlace = (placeId: string) =>
        get().places.find((place) => place.id === placeId)?.roomId

      /** 장소 카드 한 장을 바꾸는 요청의 공통 처리 */
      const placeRequest = async (
        placeId: string,
        method: "PUT" | "PATCH" | "POST" | "DELETE",
        suffix: string,
        body?: unknown
      ): Promise<ActionResult> => {
        const roomId = roomOfPlace(placeId)
        if (!roomId) return { ok: false, message: "장소 카드를 찾을 수 없습니다." }
        try {
          const dto = await api<PlaceDto | null>(
            method,
            `/api/trips/${roomId}/places/${placeId}${suffix}`,
            body
          )
          if (dto) putPlace(dto)
          return { ok: true }
        } catch (error) {
          handleFailure(roomId, error)
          return failure(error)
        }
      }

      const ownerPath = (owner: ScheduleOwner) => (owner === "shared" ? "shared" : owner)

      const addScheduleItem = async (
        roomId: string,
        owner: ScheduleOwner,
        body: Record<string, unknown>
      ): Promise<ScheduleResult> => {
        try {
          const dto = await api<ScheduleItemDto>(
            "POST",
            `/api/trips/${roomId}/schedules/${ownerPath(owner)}/items`,
            body
          )
          putItems([dto])
          return { ok: true }
        } catch (error) {
          handleFailure(roomId, error)
          return scheduleFailure(error)
        }
      }

      return {
        ...emptyData(),
        dayByRoom: {},
        tabByRoom: {},
        chatDocked: true,
        hydrated: false,
        chatSheetOpen: false,
        pendingInvite: null,
        mapFocusPlaceId: null,
        focusItemId: null,
        schedulePlaceId: null,
        poolSelectedId: null,
        scheduleFront: "chat",

        bootstrap: async () => {
          if (get().hydrated) return
          setSessionExpiredHandler(() => {
            realtime.disconnect()
            set({ ...emptyData(), config: get().config })
          })
          try {
            const config = await publicGet<ConfigDto>("/api/config")
            setServerTime(config.serverTime)
            set({
              config: {
                maxMembers: config.maxMembers,
                maxTripDays: config.maxTripDays,
                pinColorCount: config.pinColorCount,
                highlightSeconds: config.highlightSeconds,
              },
            })
          } catch {
            // 설정값을 못 받으면 기본값으로 계속한다
          }
          try {
            const auth = await refreshSession()
            if (auth) {
              startSession(auth.user)
              await get().loadRooms()
            }
          } catch {
            // 서버에 닿지 못했다. 비로그인 화면으로 시작한다.
          }
          set({ hydrated: true })
        },

        /* ───────── 회원 ───────── */

        login: async (loginId, password) => {
          try {
            const auth = await authApi.login(loginId, password)
            startSession(auth.user)
            await get().loadRooms()
            return { ok: true }
          } catch (error) {
            return failure(error)
          }
        },

        signup: async (input) => {
          try {
            const auth = await authApi.signup(input)
            startSession(auth.user)
            await get().loadRooms()
            return { ok: true }
          } catch (error) {
            return failure(error)
          }
        },

        logout: async () => {
          realtime.disconnect()
          await authApi.logout()
          set({ ...emptyData(), config: get().config, chatSheetOpen: false })
        },

        updateProfile: async ({ nickname, avatar }) => {
          try {
            const me = get().users.find((user) => user.id === get().sessionUserId)
            let profileImageUrl: string | null = me?.avatarUrl ?? null
            if (avatar === null) profileImageUrl = null
            if (avatar instanceof File) {
              const form = new FormData()
              form.append("file", avatar)
              const uploaded = await api<{ url: string }>(
                "POST",
                "/api/users/me/profile-image",
                form
              )
              profileImageUrl = uploaded.url
            }
            const user = await api<UserDto>("PATCH", "/api/users/me", {
              nickname,
              profileImageUrl,
            })
            set((state) => ({
              users: state.users.map((candidate) =>
                candidate.id === String(user.id) ? toUser(user) : candidate
              ),
            }))
            return { ok: true }
          } catch (error) {
            return failure(error)
          }
        },

        setPendingInvite: (code) => set({ pendingInvite: code }),

        /* ───────── 여행방 ───────── */

        loadRooms: async () => {
          try {
            const trips = await api<TripDto[]>("GET", "/api/trips")
            const mapped = trips.map(toRoom)
            const ids = new Set(mapped.map((entry) => entry.room.id))
            set((state) => ({
              rooms: mapped.map((entry) => entry.room),
              users: mergeUsers(
                state.users,
                mapped.flatMap((entry) => entry.users)
              ),
              unread: Object.fromEntries(mapped.map((entry) => [entry.room.id, entry.unread])),
              places: state.places.filter((place) => ids.has(place.roomId)),
              items: state.items.filter((item) => ids.has(item.roomId)),
              messages: state.messages.filter((message) => ids.has(message.roomId)),
            }))
          } catch {
            // 목록을 못 받으면 지금 가진 것을 그대로 둔다
          }
        },

        loadRoom: async (roomId) => {
          const base = `/api/trips/${roomId}`
          try {
            const [trip, places, items, chat, presence] = await Promise.all([
              api<TripDto>("GET", base),
              api<PlaceDto[]>("GET", `${base}/places`),
              api<ScheduleItemDto[]>("GET", `${base}/schedule-items`),
              api<ChatPageDto>("GET", `${base}/chat/messages`),
              api<PresenceDto>("GET", `${base}/presence`),
            ])
            putRoom(trip)
            set((state) => ({
              places: [
                ...state.places.filter((place) => place.roomId !== roomId),
                ...places.map(toPlace),
              ],
              items: [
                ...state.items.filter((item) => item.roomId !== roomId),
                ...items.map(toItem),
              ],
              messages: mergeMessages(
                state.messages.filter((message) => message.roomId !== roomId),
                chat.messages.map(toMessage)
              ),
              hasOlder: { ...state.hasOlder, [roomId]: chat.hasMore },
              presence: { ...state.presence, [roomId]: toPresence(presence) },
            }))
          } catch (error) {
            handleFailure(roomId, error)
          }
        },

        createRoom: async (input) => {
          try {
            const room = putRoom(await api<TripDto>("POST", "/api/trips", input))
            return room.id
          } catch {
            return null
          }
        },

        joinByCode: async (code) => {
          try {
            const result = await api<{ status: "JOINED" | "ALREADY"; tripId: number }>(
              "POST",
              "/api/trips/join",
              { inviteCode: code.trim() }
            )
            await get().loadRooms()
            return {
              status: result.status === "JOINED" ? "joined" : "already",
              roomId: String(result.tripId),
            }
          } catch (error) {
            const code = error instanceof ApiError ? error.code : ""
            if (code === "TRIP_FULL") return { status: "full" }
            if (code === "KICKED_MEMBER") return { status: "kicked" }
            if (code === "INVITE_NOT_FOUND" || code === "VALIDATION_FAILED") {
              return { status: "not-found" }
            }
            return { status: "error", message: failure(error).message }
          }
        },

        updateRoom: async (roomId, input, confirmedDelete) => {
          try {
            const room = putRoom(
              await api<TripDto>("PATCH", `/api/trips/${roomId}`, {
                ...input,
                deleteOutOfRangeItems: confirmedDelete,
              })
            )
            const days = countDays(room.startDate, room.endDate)
            set((state) => ({
              // 기간이 줄어 사라진 Day의 일정은 서버에서 삭제됐다 (F1-8)
              items: state.items.filter((item) => item.roomId !== roomId || item.day <= days),
              dayByRoom: {
                ...state.dayByRoom,
                [roomId]: Math.min(state.dayByRoom[roomId] ?? 1, days),
              },
            }))
            return { ok: true }
          } catch (error) {
            handleFailure(roomId, error)
            return failure(error)
          }
        },

        removeMember: async (roomId, userId, reason) => {
          try {
            if (reason === "left") {
              await api("POST", `/api/trips/${roomId}/leave`)
              realtime.disconnect()
              dropRoom(roomId)
            } else {
              await api("DELETE", `/api/trips/${roomId}/members/${userId}`)
              // 그 멤버의 투표, 개인 일정이 지워졌다. 방을 다시 불러온다.
              await get().loadRoom(roomId)
            }
            return { ok: true }
          } catch (error) {
            handleFailure(roomId, error)
            return failure(error)
          }
        },

        regenerateInvite: async (roomId) => {
          try {
            putRoom(await api<TripDto>("POST", `/api/trips/${roomId}/invite-code`))
            return { ok: true }
          } catch (error) {
            handleFailure(roomId, error)
            return failure(error)
          }
        },

        deleteRoom: async (roomId) => {
          try {
            await api("DELETE", `/api/trips/${roomId}`)
            realtime.disconnect()
            dropRoom(roomId)
            return { ok: true }
          } catch (error) {
            handleFailure(roomId, error)
            return failure(error)
          }
        },

        changeMemberColor: async (roomId, color) => {
          try {
            const member = await api<MemberDto>("PATCH", `/api/trips/${roomId}/members/me`, {
              pinColorNo: color,
            })
            get().applyEvent(roomId, { type: "MEMBER_UPDATED", payload: member })
            return { ok: true }
          } catch (error) {
            handleFailure(roomId, error)
            return failure(error)
          }
        },

        /* ───────── 장소 카드 ───────── */

        addPlace: async (roomId, draft) => {
          try {
            const dto = await api<PlaceDto>("POST", `/api/trips/${roomId}/places`, placeBody(draft))
            putPlace(dto)
            return { ok: true, id: String(dto.id) }
          } catch (error) {
            handleFailure(roomId, error)
            return {
              ok: false,
              // 방마다 같은 장소는 1장만 등록할 수 있다 (F2-3)
              duplicate: error instanceof ApiError && error.code === "PLACE_DUPLICATE",
              message: failure(error).message,
            }
          }
        },

        updatePlace: (placeId, patch) =>
          placeRequest(placeId, "PATCH", "", {
            name: patch.name,
            category: toCategoryDto(patch.category),
            memo: patch.memo || null,
          }),

        deletePlace: async (placeId) => {
          const result = await placeRequest(placeId, "DELETE", "")
          if (result.ok) {
            set((state) => ({
              places: state.places.filter((place) => place.id !== placeId),
              // 일정에 배치된 항목도 함께 제거된다 (F2-6)
              items: state.items.filter((item) => item.placeId !== placeId),
            }))
          }
          return result
        },

        // 이미 고른 쪽을 한 번 더 누르면 투표를 취소한다 (F3-1)
        vote: (placeId, vote) => {
          const { places, sessionUserId } = get()
          const mine = places.find((place) => place.id === placeId)?.votes[sessionUserId ?? ""]
          return mine === vote
            ? placeRequest(placeId, "DELETE", "/vote")
            : placeRequest(placeId, "PUT", "/vote", { vote: vote === "like" ? "LIKE" : "PASS" })
        },

        addReference: (placeId, draft) =>
          placeRequest(placeId, "POST", "/references", { ...draft, memo: draft.memo || null }),

        updateReference: (placeId, referenceId, draft) =>
          placeRequest(placeId, "PATCH", `/references/${referenceId}`, {
            ...draft,
            memo: draft.memo || null,
          }),

        deleteReference: (placeId, referenceId) =>
          placeRequest(placeId, "DELETE", `/references/${referenceId}`),

        /* ───────── 일정 ───────── */

        placeItem: ({ roomId, owner, day, placeId, start, end, index }) =>
          addScheduleItem(roomId, owner, {
            dayNo: day,
            placeId: Number(placeId),
            startTime: start ?? null,
            endTime: end ?? null,
            index: index ?? null,
          }),

        addMemoItem: ({ roomId, owner, day, title, start, end }) =>
          addScheduleItem(roomId, owner, {
            dayNo: day,
            title,
            startTime: start ?? null,
            endTime: end ?? null,
          }),

        updateItem: async (itemId, patch) => {
          const target = get().items.find((item) => item.id === itemId)
          if (!target) return { ok: true }
          const body: Record<string, unknown> = {}
          if ("start" in patch) {
            body.startTime = patch.start ?? null
            body.endTime = patch.end ?? null
          }
          if ("title" in patch) body.title = patch.title
          if ("note" in patch) body.memo = patch.note ?? null
          try {
            putItems([
              await api<ScheduleItemDto>(
                "PATCH",
                `/api/trips/${target.roomId}/schedule-items/${itemId}`,
                body
              ),
            ])
            return { ok: true }
          } catch (error) {
            handleFailure(target.roomId, error)
            return scheduleFailure(error)
          }
        },

        moveItemToDay: async (itemId, day) => {
          const target = get().items.find((item) => item.id === itemId)
          if (!target || target.day === day) return { ok: true }
          try {
            putItems([
              await api<ScheduleItemDto>(
                "POST",
                `/api/trips/${target.roomId}/schedule-items/${itemId}/move`,
                { dayNo: day }
              ),
            ])
            return { ok: true }
          } catch (error) {
            handleFailure(target.roomId, error)
            return scheduleFailure(error)
          }
        },

        removeItem: async (itemId) => {
          const target = get().items.find((item) => item.id === itemId)
          if (!target) return { ok: true }
          try {
            await api("DELETE", `/api/trips/${target.roomId}/schedule-items/${itemId}`)
            set((state) => ({ items: state.items.filter((item) => item.id !== itemId) }))
            return { ok: true }
          } catch (error) {
            handleFailure(target.roomId, error)
            return scheduleFailure(error)
          }
        },

        arrangeDay: async ({ roomId, owner, day, orderedIds, movedId }) => {
          // 끌어 놓은 자리에 바로 보이게 먼저 화면에 반영하고, 서버가 거절하면 다시 불러온다
          set((state) => {
            const dayItems = state.items.filter(
              (item) => item.roomId === roomId && item.owner === owner && item.day === day
            )
            const sequence = orderedIds
              .map((id) => dayItems.find((item) => item.id === id))
              .filter((item): item is ScheduleItem => item !== undefined)
            const laid = new Map(layoutSequence(sequence).map((item) => [item.id, item]))
            return { items: state.items.map((item) => laid.get(item.id) ?? item) }
          })
          try {
            putItems(
              await api<ScheduleItemDto[]>(
                "PUT",
                `/api/trips/${roomId}/schedules/${ownerPath(owner)}/days/${day}/order`,
                { orderedIds: orderedIds.map(Number), movedId: Number(movedId) }
              )
            )
            return { ok: true }
          } catch (error) {
            handleFailure(roomId, error)
            await get().loadRoom(roomId)
            return scheduleFailure(error)
          }
        },

        /* ───────── 채팅 ───────── */

        sendMessage: async (roomId, text) => {
          // 실시간 연결이 있으면 WebSocket으로 보낸다. 내 메시지도 이벤트로 돌아와 화면에 뜬다.
          if (realtime.sendChat(roomId, { content: text })) return
          try {
            putMessages([
              await api<ChatMessageDto>("POST", `/api/trips/${roomId}/chat/messages`, {
                content: text,
              }),
            ])
          } catch (error) {
            handleFailure(roomId, error)
          }
        },

        sharePlace: async (roomId, placeId) => {
          const body = { sharedPlaceId: Number(placeId) }
          if (realtime.sendChat(roomId, body)) return
          try {
            putMessages([
              await api<ChatMessageDto>("POST", `/api/trips/${roomId}/chat/messages`, body),
            ])
          } catch (error) {
            handleFailure(roomId, error)
          }
        },

        loadOlderMessages: async (roomId) => {
          const state = get()
          if (!state.hasOlder[roomId]) return
          const oldest = state.messages.find((message) => message.roomId === roomId)
          try {
            const page = await api<ChatPageDto>(
              "GET",
              `/api/trips/${roomId}/chat/messages${oldest ? `?before=${oldest.seq}` : ""}`
            )
            putMessages(page.messages)
            set((current) => ({ hasOlder: { ...current.hasOlder, [roomId]: page.hasMore } }))
          } catch (error) {
            handleFailure(roomId, error)
          }
        },

        markRead: async (roomId) => {
          if (!get().unread[roomId]) return
          set((state) => ({ unread: { ...state.unread, [roomId]: 0 } }))
          try {
            await api("POST", `/api/trips/${roomId}/chat/read`, {})
          } catch (error) {
            handleFailure(roomId, error)
          }
        },

        /* ───────── 실시간 이벤트 ───────── */

        applyEvent: (roomId, event) => {
          const me = get().sessionUserId
          switch (event.type) {
            case "CHAT_MESSAGE": {
              const message = toMessage(event.payload)
              set((state) => {
                const known = state.messages.some((candidate) => candidate.id === message.id)
                // 내가 보낸 메시지와 내가 일정을 바꿔 생긴 시스템 메시지는 안 읽은 수에 넣지 않는다
                const mine =
                  message.userId === me ||
                  (event.actorUserId != null && String(event.actorUserId) === me)
                return {
                  messages: mergeMessages(state.messages, [message]),
                  unread:
                    known || mine
                      ? state.unread
                      : { ...state.unread, [roomId]: (state.unread[roomId] ?? 0) + 1 },
                }
              })
              break
            }
            case "SCHEDULE_CHANGED": {
              const removed = new Set(event.payload.removedIds.map(String))
              set((state) => ({
                items: upsert(
                  state.items.filter((item) => !removed.has(item.id)),
                  event.payload.upserted.map(toItem)
                ),
              }))
              break
            }
            case "PLACE_UPSERTED":
              putPlace(event.payload)
              break
            case "PLACE_DELETED": {
              const placeId = String(event.payload.placeId)
              const removed = new Set(event.payload.removedItemIds.map(String))
              set((state) => ({
                places: state.places.filter((place) => place.id !== placeId),
                items: state.items.filter(
                  (item) => !removed.has(item.id) && item.placeId !== placeId
                ),
                schedulePlaceId: state.schedulePlaceId === placeId ? null : state.schedulePlaceId,
                poolSelectedId: state.poolSelectedId === placeId ? null : state.poolSelectedId,
              }))
              break
            }
            case "VOTE_CHANGED": {
              const { placeId, userId, vote } = event.payload
              set((state) => ({
                places: state.places.map((place) => {
                  if (place.id !== String(placeId)) return place
                  const votes = { ...place.votes }
                  if (vote === null) delete votes[String(userId)]
                  else votes[String(userId)] = vote === "LIKE" ? "like" : "pass"
                  return { ...place, votes }
                }),
              }))
              break
            }
            case "MEMBER_JOINED":
              // 다시 들어온 멤버가 남긴 기록이 닉네임으로 보이도록 방 정보를 새로 받는다
              void get().loadRoom(roomId)
              break
            case "MEMBER_REMOVED":
              if (String(event.payload.userId) === me) {
                realtime.disconnect()
                dropRoom(roomId)
              } else {
                // 그 멤버의 투표, 개인 일정이 지워졌다
                void get().loadRoom(roomId)
              }
              break
            case "MEMBER_UPDATED": {
              const { userId, pinColorNo, nickname, profileImageUrl } = event.payload
              const id = String(userId)
              set((state) => ({
                rooms:
                  pinColorNo === undefined
                    ? state.rooms
                    : state.rooms.map((room) =>
                        room.id === roomId
                          ? {
                              ...room,
                              members: room.members.map((member) =>
                                member.userId === id
                                  ? { ...member, color: pinColorNo as MemberColor }
                                  : member
                              ),
                            }
                          : room
                      ),
                users:
                  nickname === undefined
                    ? state.users
                    : state.users.map((user) =>
                        user.id === id
                          ? { ...user, nickname, avatarUrl: profileImageUrl ?? undefined }
                          : user
                      ),
              }))
              break
            }
            case "TRIP_UPDATED": {
              const { title, startDate, endDate, inviteCode, removedItemIds } = event.payload
              const removed = new Set(removedItemIds.map(String))
              const days = countDays(startDate, endDate)
              set((state) => ({
                rooms: state.rooms.map((room) =>
                  room.id === roomId ? { ...room, title, startDate, endDate, inviteCode } : room
                ),
                items: state.items.filter((item) => !removed.has(item.id)),
                dayByRoom: {
                  ...state.dayByRoom,
                  [roomId]: Math.min(state.dayByRoom[roomId] ?? 1, days),
                },
              }))
              break
            }
            case "TRIP_DELETED":
              realtime.disconnect()
              dropRoom(roomId)
              break
            case "PRESENCE_CHANGED":
              set((state) => ({
                presence: { ...state.presence, [roomId]: toPresence(event.payload) },
              }))
              break
          }
        },

        /* ───────── 화면 상태 ───────── */

        setDay: (roomId, day) => {
          set((state) => ({ dayByRoom: { ...state.dayByRoom, [roomId]: day } }))
          realtime.sendPresence(roomId, day)
        },

        setTab: (roomId, tab) =>
          set((state) => ({ tabByRoom: { ...state.tabByRoom, [roomId]: tab } })),

        setChatDocked: (open) =>
          set(open ? { chatDocked: true, scheduleFront: "chat" } : { chatDocked: false }),
        setChatSheetOpen: (open) => set({ chatSheetOpen: open }),
        setMapFocus: (placeId) => set({ mapFocusPlaceId: placeId }),
        setFocusItem: (itemId) => set({ focusItemId: itemId }),
        // 다른 장소의 상세를 열거나 상세를 닫으면 풀에서 고른 카드도 풀린다
        setSchedulePlace: (placeId) =>
          set((state) => ({
            ...(placeId
              ? { schedulePlaceId: placeId, scheduleFront: "place" as const }
              : { schedulePlaceId: null }),
            poolSelectedId:
              placeId !== null && placeId === state.poolSelectedId ? state.poolSelectedId : null,
          })),
        togglePoolPlace: (placeId) =>
          set((state) =>
            state.poolSelectedId === placeId
              ? { poolSelectedId: null, schedulePlaceId: null }
              : { poolSelectedId: placeId, schedulePlaceId: placeId, scheduleFront: "place" }
          ),
      }
    },
    {
      // 서버 데이터는 브라우저에 저장하지 않는다. 화면 설정만 남긴다.
      name: "apart-together-view",
      version: 1,
      // 서버 렌더 결과와 맞추기 위해 마운트 후에 직접 불러온다 (StoreHydrator)
      skipHydration: true,
      partialize: (state): ViewState => ({
        dayByRoom: state.dayByRoom,
        tabByRoom: state.tabByRoom,
        chatDocked: state.chatDocked,
      }),
    }
  )
)
