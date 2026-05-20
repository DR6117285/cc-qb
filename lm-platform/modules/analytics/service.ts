import * as repo from './repository'
import type { OverallStats, SectionScore, RecentSession } from './types'

export async function getOverallStats(userId: string): Promise<OverallStats> {
  const [aggregates, sessionsThisWeek] = await Promise.all([
    repo.getProgressAggregates(userId),
    repo.getSessionsThisWeekCount(userId),
  ])

  return {
    totalAnswered: aggregates.timesAnswered,
    overallAccuracy:
      aggregates.timesAnswered > 0
        ? aggregates.timesCorrect / aggregates.timesAnswered
        : 0,
    sessionsThisWeek,
  }
}

export async function getSectionScores(userId: string): Promise<SectionScore[]> {
  const rows = await repo.getSectionProgress(userId)

  const scores: SectionScore[] = rows.map((row) => ({
    sectionId: row.sectionId,
    sectionName: row.sectionName,
    questionsAttempted: row.timesAnswered,
    accuracy: row.timesAnswered > 0 ? row.timesCorrect / row.timesAnswered : 0,
  }))

  return scores.sort((a, b) => a.accuracy - b.accuracy)
}

export async function getRecentSessions(userId: string): Promise<RecentSession[]> {
  const rows = await repo.getRecentCompletedSessions(userId, 10)

  return rows.map((row) => ({
    sessionId: row.id,
    completedAt: row.completedAt,
    score: row.score,
    totalCount: row.totalCount,
    accuracyPct: row.totalCount > 0 ? Math.round((row.score / row.totalCount) * 100) : 0,
  }))
}
