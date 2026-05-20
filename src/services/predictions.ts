import { api } from "@/lib/api"
import type { Match, MatchesByDate, PredictionValue } from "@/types/predictions"

export async function getAvailablePredictions(): Promise<Match[]> {
  const { data } = await api.get<Match[]>("/get_available_predictions")
  return data
}

export async function recordPredictions(matches: Match[]): Promise<void> {
  await api.post("/record_predictions", matches)
}

export function groupMatchesByDate(matches: Match[]): MatchesByDate {
  return matches.reduce<MatchesByDate>((acc, match) => {
    const date = match.match_date
    if (!acc[date]) acc[date] = []
    acc[date].push(match)
    return acc
  }, {})
}

export function buildSubmitPayload(
  matches: Match[],
  predictions: Record<string, PredictionValue>,
): Match[] {
  return matches.map((m) => ({ ...m, prediction: predictions[m.match_id] ?? null }))
}

export function formatMatchDate(dateStr: string, locale: string): string {
  const [year, month, day] = dateStr.split("-").map(Number)
  // UTC noon avoids timezone-related day shifts
  const date = new Date(Date.UTC(year, month - 1, day, 12))
  return new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date)
}
