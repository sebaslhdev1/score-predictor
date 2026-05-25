export type PredictionValue = "local" | "away" | "tie" | "tie-local" | "tie-away" | null

export interface Match {
  match_id: string
  match_type: string
  due_date: string // "YYYY-MM-DDTHH:mm:ss" Colombian time (UTC-5)
  location: string
  local_team: string
  local_team_icon_code: string | null
  away_team: string
  away_team_icon_code: string | null
  score: string | null
}

export interface MatchSubmission {
  match_id: string
  score: string | null // actual team name, "tie", or null to clear
}

export interface PredictionResponse {
  message: string
  blocked: string[] // match_ids that were rejected because due_date passed
}

// Matches keyed by date string for grouped display
export type MatchesByDate = Record<string, Match[]>
