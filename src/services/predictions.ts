import { api } from "@/lib/api"
import { utcToLocal } from "@/lib/date"
import type {
  Match,
  MatchesByDate,
  MatchSubmission,
  PredictionResponse,
  PredictionValue,
} from "@/types/predictions"
import type { Question, QuestionPrediction } from "@/types/questions"

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
  const { data } = await api.get<TournamentByIdResponse>(
    "/get_tournament_by_id",
    {
      params: { tournament_id: tournamentId },
    },
  )
  return { name: data.name, matches: data.available_predictions }
}

export async function getQuestions(tournamentId: string): Promise<Question[]> {
  const { data } = await api.get<Question[]>("/get_questions", {
    params: { tournament_id: tournamentId },
  })
  return data
}

export async function recordPredictions(
  matchPredictions: MatchSubmission[],
  questionPredictions: QuestionPrediction[] = [],
): Promise<PredictionResponse> {
  const { data } = await api.post<PredictionResponse>("/record_predictions", {
    match_predictions: matchPredictions,
    question_predictions: questionPredictions,
  })
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

export function isMatchLocked(dueDateStr: string): boolean {
  return Date.now() >= utcToLocal(dueDateStr).getTime()
}

export function isMatchToday(dueDateStr: string): boolean {
  const local = utcToLocal(dueDateStr)
  const now = new Date()
  return (
    local.getFullYear() === now.getFullYear() &&
    local.getMonth() === now.getMonth() &&
    local.getDate() === now.getDate()
  )
}

export function groupMatchesByDate(matches: Match[]): MatchesByDate {
  return matches.reduce<MatchesByDate>((acc, match) => {
    const local = utcToLocal(match.due_date)
    const dateKey = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`
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
      pick === "local"
        ? m.local_team
        : pick === "away"
          ? m.away_team
          : pick === "tie"
            ? m.match_type === "Knockout"
              ? null
              : "tie"
            : pick === "tie-local"
              ? `tie-${m.local_team}`
              : pick === "tie-away"
                ? `tie-${m.away_team}`
                : null
    return { match_id: m.match_id, score }
  })
}

export function formatMatchTime(dueDateStr: string): string {
  try {
    const local = utcToLocal(dueDateStr)
    const h = local.getHours()
    const m = local.getMinutes()
    const period = h >= 12 ? "PM" : "AM"
    const hour = h % 12 || 12
    return `${hour}:${m.toString().padStart(2, "0")} ${period}`
  } catch {
    return ""
  }
}

export function formatMatchDate(dueDateStr: string, locale: string): string {
  try {
    const local = utcToLocal(dueDateStr)
    if (isNaN(local.getTime())) return dueDateStr
    return new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(local)
  } catch {
    return dueDateStr
  }
}
