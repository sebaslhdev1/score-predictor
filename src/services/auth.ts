import axios from "axios"
import { clearSession } from "@/lib/session"

// Plain instance without interceptors — used only for unauthenticated auth endpoints
const authApi = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
})

export interface VerifyResult {
  access_token: string
  refresh_token: string
  expires_in: number
  name: string
  is_admin: boolean
  is_creator: boolean
}

export async function signIn(email: string): Promise<void> {
  await authApi.post("/sign_in_user", { email })
}

export async function signUp(email: string, name: string): Promise<void> {
  await authApi.post("/signup_user", { email, name })
}

export async function verifyOtp(email: string, token: string): Promise<VerifyResult> {
  const { data } = await authApi.post<VerifyResult>("/verify", { email, token })
  return data
}

export function isNewUserError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404
}

export function logout(): void {
  clearSession()
}
