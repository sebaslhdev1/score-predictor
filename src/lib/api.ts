import axios from "axios"
import { clearSession, getAccessToken, getRefreshToken, setTokens } from "@/lib/session"

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 2000

export const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Ensures concurrent 401s only trigger one refresh attempt
let refreshPromise: Promise<void> | null = null

function expireSession() {
  clearSession()
  window.dispatchEvent(new CustomEvent("auth:expired"))
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const config = error.config

      // Don't retry the refresh call itself — avoids infinite loops
      if (config._isRefresh) {
        expireSession()
        return Promise.reject(error)
      }

      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        expireSession()
        return Promise.reject(error)
      }

      // Deduplicate concurrent refresh calls
      refreshPromise ??= api
        .post<{ access_token: string; refresh_token: string }>(
          "/refresh",
          { refresh_token: refreshToken },
          { _isRefresh: true } as object,
        )
        .then((res) => {
          setTokens(res.data.access_token, res.data.refresh_token)
        })
        .catch((refreshError) => {
          // Only expire the session if the refresh token itself is rejected (401)
          // Network errors or 503s should not log the user out
          if (refreshError.response?.status === 401) {
            expireSession()
          }
          throw error
        })
        .finally(() => {
          refreshPromise = null
        })

      await refreshPromise

      // Retry the original request with the new token
      config.headers.Authorization = `Bearer ${getAccessToken()}`
      return api(config)
    }

    const config = error.config

    // Single retry on 500 — covers transient server errors
    if (error.response?.status === 500 && !config._retried500) {
      config._retried500 = true
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return api(config)
    }

    // Retry on 503 — handles backend cold start
    if (error.response?.status === 503) {
      config._retries = (config._retries ?? 0) + 1
      if (config._retries <= MAX_RETRIES) {
        if (config._retries === 1) {
          window.dispatchEvent(new CustomEvent("service:waking"))
        }
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
        try {
          const response = await api(config)
          window.dispatchEvent(new CustomEvent("service:ready"))
          return response
        } catch (retryError) {
          return Promise.reject(retryError)
        }
      }
      window.dispatchEvent(new CustomEvent("service:failed"))
    }

    return Promise.reject(error)
  },
)
