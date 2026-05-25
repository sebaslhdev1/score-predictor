export interface ScoreboardEntry {
  user_id: string
  rank: number
  name: string
  points: number
  correct_predictions: number
  total_predictions: number
  is_current_user: boolean
}

export interface Participant {
  user_id: string
  name: string
  points: number
  right_answers: number
  total: number
  is_current_user: boolean
}
