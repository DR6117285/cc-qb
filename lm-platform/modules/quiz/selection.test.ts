import { describe, it, expect } from 'vitest'
import { selectWeightedQuestions, MOCK_EXAM_WEIGHTS } from './selection'
import type { QuestionWithOptions } from './types'

function makeQuestion(id: string, sectionId: string): QuestionWithOptions {
  return {
    id,
    sectionId,
    questionText: 'Q',
    rationale: 'R',
    pageReference: null,
    options: [],
  }
}

function makePool(sectionId: string, count: number): QuestionWithOptions[] {
  return Array.from({ length: count }, (_, i) =>
    makeQuestion(`${sectionId}-${i}`, sectionId),
  )
}

describe('MOCK_EXAM_WEIGHTS', () => {
  it('sums to 200', () => {
    const total = Object.values(MOCK_EXAM_WEIGHTS).reduce((a, b) => a + b, 0)
    expect(total).toBe(200)
  })

  it('has exactly 10 sections', () => {
    expect(Object.keys(MOCK_EXAM_WEIGHTS)).toHaveLength(10)
  })
})

describe('selectWeightedQuestions', () => {
  function makeFullPool(): QuestionWithOptions[] {
    return Object.entries(MOCK_EXAM_WEIGHTS).flatMap(([sectionId, count]) =>
      makePool(sectionId, count + 10),
    )
  }

  it('returns exactly 200 questions', () => {
    const result = selectWeightedQuestions(makeFullPool(), MOCK_EXAM_WEIGHTS)
    expect(result).toHaveLength(200)
  })

  it('respects per-section counts', () => {
    const result = selectWeightedQuestions(makeFullPool(), MOCK_EXAM_WEIGHTS)
    for (const [sectionId, expected] of Object.entries(MOCK_EXAM_WEIGHTS)) {
      const count = result.filter((q) => q.sectionId === sectionId).length
      expect(count).toBe(expected)
    }
  })

  it('contains no duplicates', () => {
    const result = selectWeightedQuestions(makeFullPool(), MOCK_EXAM_WEIGHTS)
    const ids = result.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('throws when a section has too few questions', () => {
    const pool = makeFullPool()
    const tinyWeights = { '01': 9999 }
    expect(() => selectWeightedQuestions(pool, tinyWeights)).toThrow(
      'Not enough questions in section 01',
    )
  })
})
