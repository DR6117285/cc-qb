import type { QuestionWithOptions, SelectionConfig } from './types'

export function selectQuestions(
  candidates: QuestionWithOptions[],
  config: SelectionConfig,
): QuestionWithOptions[] {
  const shuffled = [...candidates].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, config.count)
}

export const MOCK_EXAM_WEIGHTS: Record<string, number> = {
  '01': 8,
  '02': 20,
  '03': 16,
  '04': 8,
  '05': 52,
  '06': 28,
  '07': 20,
  '08': 16,
  '09': 16,
  '10': 16,
}

export function scaleWeights(
  weights: Record<string, number>,
  target: number,
): Record<string, number> {
  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  const entries = Object.entries(weights)

  const floors: Record<string, number> = {}
  const fractions: Array<[string, number]> = []
  let floorSum = 0

  for (const [key, w] of entries) {
    const exact = (w / total) * target
    const floor = Math.floor(exact)
    floors[key] = floor
    floorSum += floor
    fractions.push([key, exact - floor])
  }

  fractions.sort((a, b) => b[1] - a[1])
  const remainder = target - floorSum
  for (let i = 0; i < remainder; i++) {
    floors[fractions[i][0]]++
  }

  return floors
}

export function selectWeightedQuestions(
  candidates: QuestionWithOptions[],
  weights: Record<string, number>,
): QuestionWithOptions[] {
  const bySection = new Map<string, QuestionWithOptions[]>()
  for (const q of candidates) {
    const bucket = bySection.get(q.sectionId) ?? []
    bucket.push(q)
    bySection.set(q.sectionId, bucket)
  }

  const picked: QuestionWithOptions[] = []
  for (const [sectionId, count] of Object.entries(weights)) {
    const pool = bySection.get(sectionId) ?? []
    if (pool.length < count) {
      throw new Error(
        `Not enough questions in section ${sectionId}: need ${count}, have ${pool.length}`,
      )
    }
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    picked.push(...shuffled.slice(0, count))
  }

  return picked.sort(() => Math.random() - 0.5)
}
