import { api } from "@/lib/api"
import type { Match, MatchesByDate, MatchSubmission, PredictionResponse, PredictionValue } from "@/types/predictions"

interface TournamentByIdResponse {
  id: string
  name: string
  available_predictions: Match[]
}

export async function getClosedMatches(tournamentId: string): Promise<Match[]> {
  const { data } = await api.get<Match[]>("/get_non_available_predictions", {
    params: { tournament_id: tournamentId },
  })
  return data
}

export async function getTournamentById(
  tournamentId: string,
): Promise<{ name: string; matches: Match[] }> {
  const { data } = await api.get<TournamentByIdResponse>("/get_tournament_by_id", {
    params: { tournament_id: tournamentId },
  })
  return { name: data.name, matches: data.available_predictions }
}

export async function recordPredictions(submissions: MatchSubmission[]): Promise<PredictionResponse> {
  const { data } = await api.post<PredictionResponse>("/record_predictions", submissions)
  return data
}

export function scoreToPrediction(match: Match): PredictionValue {
  if (!match.score) return null
  const lower = match.score.toLowerCase()
  if (lower === "tie") return "tie"
  if (lower.startsWith("tie-")) {
    const winner = lower.slice(4)
    if (winner === match.local_team.toLowerCase()) return "tie-local"
    if (winner === match.away_team.toLowerCase()) return "tie-away"
  }
  if (lower === match.local_team.toLowerCase()) return "local"
  if (lower === match.away_team.toLowerCase()) return "away"
  return null
}

// Colombia is permanently UTC-5 (no DST)
function parseDueDate(dueDateStr: string): Date {
  return new Date(dueDateStr + "-05:00")
}

export function isMatchLocked(dueDateStr: string): boolean {
  return Date.now() >= parseDueDate(dueDateStr).getTime()
}

export function isMatchToday(dueDateStr: string): boolean {
  const colombianNow = new Date(Date.now() - 5 * 60 * 60 * 1000)
  const todayStr = colombianNow.toISOString().split("T")[0]
  return dueDateStr.split("T")[0] === todayStr
}

export function groupMatchesByDate(matches: Match[]): MatchesByDate {
  return matches.reduce<MatchesByDate>((acc, match) => {
    // Extract the Colombian date portion ("YYYY-MM-DD") for grouping
    const dateKey = match.due_date.split("T")[0]
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(match)
    return acc
  }, {})
}

export function buildSubmitPayload(
  matches: Match[],
  predictions: Record<string, PredictionValue>,
): MatchSubmission[] {
  return matches.map((m) => {
    const pick = predictions[m.match_id] ?? null
    const score =
      pick === "local" ? m.local_team
      : pick === "away" ? m.away_team
      : pick === "tie" ? (m.match_type === "Knockout" ? null : "tie")
      : pick === "tie-local" ? `tie-${m.local_team}`
      : pick === "tie-away" ? `tie-${m.away_team}`
      : null
    return { match_id: m.match_id, score }
  })
}

export function formatMatchTime(dueDateStr: string): string {
  try {
    const timePart = dueDateStr.split("T")[1]?.slice(0, 5) ?? ""
    const [h, m] = timePart.split(":").map(Number)
    const period = h >= 12 ? "PM" : "AM"
    const hour = h % 12 || 12
    return `${hour}:${m.toString().padStart(2, "0")} ${period}`
  } catch {
    return ""
  }
}

export function formatMatchDate(dueDateStr: string, locale: string): string {
  try {
    const dateKey = dueDateStr.split("T")[0]
    const [year, month, day] = dateKey.split("-").map(Number)
    const date = new Date(Date.UTC(year, month - 1, day, 12))
    if (isNaN(date.getTime())) return dateKey
    return new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }).format(date)
  } catch {
    return dueDateStr.split("T")[0]
  }
}
