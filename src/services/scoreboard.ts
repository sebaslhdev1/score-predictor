import { api } from "@/lib/api"
import { getUserName } from "@/lib/session"
import type { Participant, ScoreboardEntry } from "@/types/scoreboard"

interface PositionEntry {
  user_id: string
  user_name: string
  points: number
  right_answers: number
  total: number
}

async function fetchPositions(tournamentId: string): Promise<PositionEntry[]> {
  const { data } = await api.get<PositionEntry[]>("/get_participants", {
    params: { tournament_id: tournamentId },
  })
  return data
}

export async function getScoreboard(
  tournamentId: string,
): Promise<ScoreboardEntry[]> {
  const data = await fetchPositions(tournamentId)
  const currentUserName = getUserName()
  return [...data]
    .sort(
      (a, b) => b.points - a.points || a.user_name.localeCompare(b.user_name),
    )
    .map((entry, i) => ({
      user_id: entry.user_id,
      rank: i + 1,
      name: entry.user_name,
      points: entry.points,
      correct_predictions: entry.right_answers,
      total_predictions: entry.total,
      is_current_user: entry.user_name === currentUserName,
    }))
}

export async function getParticipants(
  tournamentId: string,
): Promise<Participant[]> {
  const data = await fetchPositions(tournamentId)
  const currentUserName = getUserName()
  return data.map((entry) => ({
    user_id: entry.user_id,
    name: entry.user_name,
    points: entry.points,
    right_answers: entry.right_answers,
    total: entry.total,
    is_current_user: entry.user_name === currentUserName,
  }))
}
