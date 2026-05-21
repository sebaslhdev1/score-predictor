import { api } from "@/lib/api"
import type { Tournament } from "@/types/tournament"

export async function getTournaments(): Promise<Tournament[]> {
  const { data } = await api.get<Tournament[]>("/get_tournaments")
  return data
}
