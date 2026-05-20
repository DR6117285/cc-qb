import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as repo from './repository'

vi.mock('./repository')

import {
  getOverallStats,
  getSectionScores,
  getRecentSessions,
} from './service'

beforeEach(() => vi.clearAllMocks())

describe('getOverallStats', () => {
  it('computes accuracy correctly', async () => {
    vi.mocked(repo.getProgressAggregates).mockResolvedValue({
      timesAnswered: 100,
      timesCorrect: 74,
    })
    vi.mocked(repo.getSessionsThisWeekCount).mockResolvedValue(3)

    const stats = await getOverallStats('user-1')
    expect(stats.totalAnswered).toBe(100)
    expect(stats.overallAccuracy).toBeCloseTo(0.74)
    expect(stats.sessionsThisWeek).toBe(3)
  })

  it('returns 0 accuracy when no questions answered', async () => {
    vi.mocked(repo.getProgressAggregates).mockResolvedValue({
      timesAnswered: 0,
      timesCorrect: 0,
    })
    vi.mocked(repo.getSessionsThisWeekCount).mockResolvedValue(0)

    const stats = await getOverallStats('user-1')
    expect(stats.overallAccuracy).toBe(0)
  })
})

describe('getSectionScores', () => {
  it('computes per-section accuracy and sorts weakest first', async () => {
    vi.mocked(repo.getSectionProgress).mockResolvedValue([
      { sectionId: '05', sectionName: 'Nutrition', timesAnswered: 50, timesCorrect: 24 },
      { sectionId: '06', sectionName: 'Exercise', timesAnswered: 28, timesCorrect: 23 },
    ])

    const scores = await getSectionScores('user-1')
    expect(scores[0].sectionId).toBe('05')          // weaker: 48%
    expect(scores[0].accuracy).toBeCloseTo(0.48)
    expect(scores[1].sectionId).toBe('06')           // stronger: 82%
    expect(scores[0].questionsAttempted).toBe(50)
  })

  it('returns accuracy 0 for sections with no attempts', async () => {
    vi.mocked(repo.getSectionProgress).mockResolvedValue([
      { sectionId: '01', sectionName: 'Intro', timesAnswered: 0, timesCorrect: 0 },
    ])

    const scores = await getSectionScores('user-1')
    expect(scores[0].accuracy).toBe(0)
  })
})

describe('getRecentSessions', () => {
  it('computes accuracyPct correctly', async () => {
    const now = new Date()
    vi.mocked(repo.getRecentCompletedSessions).mockResolvedValue([
      { id: 's1', completedAt: now, score: 8, totalCount: 10 },
      { id: 's2', completedAt: now, score: 3, totalCount: 10 },
    ])

    const sessions = await getRecentSessions('user-1')
    expect(sessions[0].accuracyPct).toBe(80)
    expect(sessions[1].accuracyPct).toBe(30)
    expect(sessions[0].sessionId).toBe('s1')
  })
})
