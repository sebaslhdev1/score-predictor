export interface QuestionOption {
  id: string
  option_text: string
  icon_code: string
}

export interface QuestionResult {
  icon_code: string
  option_text: string
}

export interface Question {
  id: string
  question: { en: string; es: string }
  due_date: string
  points: number
  options: QuestionOption[]
  answer: QuestionOption | null
  result: QuestionResult | null
}

export interface QuestionPrediction {
  question_id: string
  option_id: string
}
