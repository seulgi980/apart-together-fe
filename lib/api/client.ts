import { API_BASE_URL } from "@/lib/api/config"
import type { AuthResponseDto } from "@/lib/api/dto"

/**
 * 백엔드 호출.
 * - access token은 이 모듈의 메모리에만 둔다 (새로고침하면 사라지고, refresh 쿠키로 다시 받는다).
 * - refresh token은 HttpOnly 쿠키라서 코드에서 볼 수 없다. 재발급/로그아웃 요청에만 실려 간다.
 */

export class ApiError extends Error {
  status: number
  code: string
  /** 오류 응답 본문 전체 (conflict, itemCount 등 추가 정보) */
  data: Record<string, unknown>

  constructor(status: number, code: string, message: string, data: Record<string, unknown> = {}) {
    super(message)
    this.status = status
    this.code = code
    this.data = data
  }
}

const NETWORK_MESSAGE = "서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요."

let accessToken: string | null = null
/** access token이 만료되는 시각 (ms) */
let accessTokenExpiresAt = 0
let sessionExpiredHandler: (() => void) | null = null

/** 재발급까지 실패해서 로그인이 풀렸을 때 부를 함수 */
export function setSessionExpiredHandler(handler: () => void) {
  sessionExpiredHandler = handler
}

function storeTokens(auth: AuthResponseDto) {
  accessToken = auth.accessToken
  accessTokenExpiresAt = Date.now() + auth.expiresIn * 1000
}

function clearTokens() {
  accessToken = null
  accessTokenExpiresAt = 0
}

async function parse(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function toError(response: Response): Promise<ApiError> {
  const body = (await parse(response)) as Record<string, unknown> | null
  return new ApiError(
    response.status,
    typeof body?.code === "string" ? body.code : "UNKNOWN",
    typeof body?.message === "string" ? body.message : "요청을 처리하지 못했습니다.",
    body ?? {}
  )
}

async function send(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(API_BASE_URL + path, init)
  } catch {
    throw new ApiError(0, "NETWORK", NETWORK_MESSAGE)
  }
}

/** 쿠키(refresh token)를 주고받는 인증 요청 */
async function authRequest(path: string, body?: unknown): Promise<AuthResponseDto> {
  const response = await send(path, {
    method: "POST",
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) throw await toError(response)
  const auth = (await parse(response)) as AuthResponseDto
  storeTokens(auth)
  return auth
}

let refreshing: Promise<AuthResponseDto | null> | null = null

/**
 * 재발급. 재발급할 때마다 refresh token이 바뀌므로(회전) 동시에 두 번 보내면 안 된다.
 * 진행 중인 요청이 있으면 그 결과를 함께 기다린다.
 */
export function refreshSession(): Promise<AuthResponseDto | null> {
  if (!refreshing) {
    refreshing = authRequest("/api/auth/token/refresh")
      .catch((error: unknown) => {
        clearTokens()
        // 서버에 닿지 못한 것은 로그아웃이 아니다. 그대로 알린다.
        if (error instanceof ApiError && error.status === 0) throw error
        return null
      })
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing
}

/** WebSocket 연결에 쓸 유효한 access token. 만료가 가까우면 먼저 재발급한다. */
export async function ensureAccessToken(): Promise<string | null> {
  if (accessToken && Date.now() < accessTokenExpiresAt - 30_000) return accessToken
  try {
    const auth = await refreshSession()
    return auth?.accessToken ?? null
  } catch {
    return null
  }
}

export const authApi = {
  login: (loginId: string, password: string) =>
    authRequest("/api/auth/login", { loginId, password }),
  signup: (input: { loginId: string; password: string; nickname: string }) =>
    authRequest("/api/auth/signup", input),
  async logout() {
    clearTokens()
    await send("/api/auth/token/logout", { method: "POST", credentials: "include" }).catch(
      () => undefined
    )
  },
  async isAvailable(field: "loginId" | "nickname", value: string): Promise<boolean> {
    const response = await send(
      `/api/auth/availability?${field}=${encodeURIComponent(value)}`,
      { method: "GET" }
    )
    if (!response.ok) return true
    const body = (await parse(response)) as { available?: boolean } | null
    return body?.available !== false
  },
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

async function authorized(method: Method, path: string, body: unknown): Promise<Response> {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData
  const headers: Record<string, string> = {}
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json"
  return send(path, {
    method,
    headers,
    body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
  })
}

/**
 * 기능 API 호출. Authorization 헤더의 access token으로만 인증한다.
 * 401이면 재발급을 한 번 시도하고 원래 요청을 다시 보낸다.
 */
export async function api<T>(method: Method, path: string, body?: unknown): Promise<T> {
  let response = await authorized(method, path, body)
  if (response.status === 401) {
    const auth = await refreshSession()
    if (!auth) {
      sessionExpiredHandler?.()
      throw new ApiError(401, "UNAUTHORIZED", "다시 로그인해 주세요.")
    }
    response = await authorized(method, path, body)
  }
  if (!response.ok) throw await toError(response)
  return (await parse(response)) as T
}

/** 로그인 없이 부르는 공개 API */
export async function publicGet<T>(path: string): Promise<T> {
  const response = await send(path, { method: "GET" })
  if (!response.ok) throw await toError(response)
  return (await parse(response)) as T
}
