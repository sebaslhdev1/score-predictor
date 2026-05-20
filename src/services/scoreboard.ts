import type { Participant, ScoreboardEntry } from "@/types/scoreboard"
// import { api } from "@/lib/api"  // uncomment when endpoints are ready

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const MOCK_SCOREBOARD: ScoreboardEntry[] = [
  { user_id: "1", rank: 1, name: "Carlos Arango",    points: 45, correct_predictions: 15, total_predictions: 20, is_current_user: false },
  { user_id: "2", rank: 2, name: "María García",     points: 42, correct_predictions: 14, total_predictions: 20, is_current_user: false },
  { user_id: "3", rank: 3, name: "Juan Pérez",       points: 38, correct_predictions: 13, total_predictions: 20, is_current_user: false },
  { user_id: "4", rank: 4, name: "Sebastián Loaiza", points: 35, correct_predictions: 12, total_predictions: 20, is_current_user: true  },
  { user_id: "5", rank: 5, name: "Laura Martínez",   points: 30, correct_predictions: 10, total_predictions: 20, is_current_user: false },
  { user_id: "6", rank: 6, name: "Andrés Torres",    points: 27, correct_predictions: 9,  total_predictions: 20, is_current_user: false },
  { user_id: "7", rank: 7, name: "Valeria Ramos",    points: 21, correct_predictions: 7,  total_predictions: 20, is_current_user: false },
  { user_id: "8", rank: 8, name: "Felipe Castro",    points: 18, correct_predictions: 6,  total_predictions: 18, is_current_user: false },
]

const MOCK_PARTICIPANTS: Participant[] = [
  { user_id: "1", name: "Carlos Arango",    predictions_made: 20, total_matches: 20, joined_at: "2026-05-10" },
  { user_id: "2", name: "María García",     predictions_made: 20, total_matches: 20, joined_at: "2026-05-10" },
  { user_id: "3", name: "Juan Pérez",       predictions_made: 20, total_matches: 20, joined_at: "2026-05-11" },
  { user_id: "4", name: "Sebastián Loaiza", predictions_made: 20, total_matches: 20, joined_at: "2026-05-11" },
  { user_id: "5", name: "Laura Martínez",   predictions_made: 17, total_matches: 20, joined_at: "2026-05-12" },
  { user_id: "6", name: "Andrés Torres",    predictions_made: 15, total_matches: 20, joined_at: "2026-05-13" },
  { user_id: "7", name: "Valeria Ramos",    predictions_made: 12, total_matches: 20, joined_at: "2026-05-14" },
  { user_id: "8", name: "Felipe Castro",    predictions_made: 8,  total_matches: 20, joined_at: "2026-05-15" },
]

export async function getScoreboard(): Promise<ScoreboardEntry[]> {
  // TODO: replace with real endpoint
  // const { data } = await api.get<ScoreboardEntry[]>("/get_scoreboard")
  // return data
  await delay(700)
  return MOCK_SCOREBOARD
}

export async function getParticipants(): Promise<Participant[]> {
  // TODO: replace with real endpoint
  // const { data } = await api.get<Participant[]>("/get_participants")
  // return data
  await delay(700)
  return MOCK_PARTICIPANTS
}
