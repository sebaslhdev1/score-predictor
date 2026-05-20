export type PredictionValue = "local" | "away" | "tie" | null

export interface Match {
  match_id: string
  match_type: string
  match_date: string  // "YYYY-MM-DD"
  location: string
  local_team: string
  away_team: string
  prediction: PredictionValue
}

// Matches keyed by date string for grouped display
export type MatchesByDate = Record<string, Match[]>
