const KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER_NAME: "user_name",
  IS_ADMIN: "is_admin",
  IS_CREATOR: "is_creator",
} as const

const ACCESS_MAX_AGE = 60 * 60 * 24 * 7   // 7 days
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30  // 30 days

export function saveSession(data: {
  access_token: string
  refresh_token: string
  name: string
  is_admin: boolean
  is_creator: boolean
}) {
  localStorage.setItem(KEYS.ACCESS_TOKEN, data.access_token)
  localStorage.setItem(KEYS.REFRESH_TOKEN, data.refresh_token)
  localStorage.setItem(KEYS.USER_NAME, data.name)
  localStorage.setItem(KEYS.IS_ADMIN, String(data.is_admin))
  localStorage.setItem(KEYS.IS_CREATOR, String(data.is_creator))
  document.cookie = `${KEYS.ACCESS_TOKEN}=${data.access_token}; path=/; max-age=${ACCESS_MAX_AGE}; SameSite=Lax`
  document.cookie = `${KEYS.REFRESH_TOKEN}=${data.refresh_token}; path=/; max-age=${REFRESH_MAX_AGE}; SameSite=Lax`
}

export function clearSession() {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k))
  document.cookie = `${KEYS.ACCESS_TOKEN}=; path=/; max-age=0; SameSite=Lax`
  document.cookie = `${KEYS.REFRESH_TOKEN}=; path=/; max-age=0; SameSite=Lax`
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(KEYS.ACCESS_TOKEN)
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(KEYS.REFRESH_TOKEN)
}

export function setTokens(access_token: string, refresh_token: string) {
  localStorage.setItem(KEYS.ACCESS_TOKEN, access_token)
  localStorage.setItem(KEYS.REFRESH_TOKEN, refresh_token)
  document.cookie = `${KEYS.ACCESS_TOKEN}=${access_token}; path=/; max-age=${ACCESS_MAX_AGE}; SameSite=Lax`
  document.cookie = `${KEYS.REFRESH_TOKEN}=${refresh_token}; path=/; max-age=${REFRESH_MAX_AGE}; SameSite=Lax`
}

export function getUserName(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(KEYS.USER_NAME)
}

export function getIsAdmin(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(KEYS.IS_ADMIN) === "true"
}

export function getIsCreator(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(KEYS.IS_CREATOR) === "true"
}
