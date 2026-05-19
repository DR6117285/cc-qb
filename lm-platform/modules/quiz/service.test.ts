import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./repository', () => ({
  findSession: vi.fn(),
  countCorrectAnswers: vi.fn(),
  countAnswers: vi.fn(),
  snapshotTimedScore: vi.fn(),
}))

import * as repo from './repository'
import { snapshotTimedScore } from './service'

const mockSession = {
  id: 'session-1',
  userId: 'user-1',
  status: 'InProgress',
  totalCount: 150,
  score: null,
  createdAt: new Date(),
  completedAt: null,
  timeLimitSec: 14400,
  timedScore: null,
  timedAt: null,
}

beforeEach(() => vi.clearAllMocks())

describe('snapshotTimedScore', () => {
  it('snapshots the timed score and returns counts', async () => {
    vi.mocked(repo.findSession).mockResolvedValue(mockSession as any)
    vi.mocked(repo.countCorrectAnswers).mockResolvedValue(87)
    vi.mocked(repo.countAnswers).mockResolvedValue(130)
    vi.mocked(repo.snapshotTimedScore).mockResolvedValue(undefined)

    const result = await snapshotTimedScore('session-1', 'user-1')

    expect(repo.snapshotTimedScore).toHaveBeenCalledWith('session-1', 87)
    expect(result).toEqual({ timedScore: 87, answeredCount: 130, totalCount: 150 })
  })

  it('returns existing snapshot without re-writing if already snapshotted', async () => {
    const snapshotted = { ...mockSession, timedScore: 70 }
    vi.mocked(repo.findSession).mockResolvedValue(snapshotted as any)
    vi.mocked(repo.countAnswers).mockResolvedValue(110)

    const result = await snapshotTimedScore('session-1', 'user-1')

    expect(repo.snapshotTimedScore).not.toHaveBeenCalled()
    expect(result).toEqual({ timedScore: 70, answeredCount: 110, totalCount: 150 })
  })

  it('throws when session not found', async () => {
    vi.mocked(repo.findSession).mockResolvedValue(null)
    await expect(snapshotTimedScore('bad', 'user-1')).rejects.toThrow('Session not found')
  })

  it('throws when userId does not match', async () => {
    vi.mocked(repo.findSession).mockResolvedValue(mockSession as any)
    await expect(snapshotTimedScore('session-1', 'other-user')).rejects.toThrow('Forbidden')
  })
})
