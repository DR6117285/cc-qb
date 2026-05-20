export type QuestionOption = {
  key: string
  text: string
  isCorrect: boolean
}

export type QuestionWithOptions = {
  id: string
  questionText: string
  rationale: string
  pageReference: string | null
  sectionId: string
  options: QuestionOption[]
}

export type SelectionConfig = {
  count: number
  weighting: 'uniform'
}
