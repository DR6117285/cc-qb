import { prisma } from '@/lib/prisma'

export async function getProgressAggregates(
  userId: string,
): Promise<{ timesAnswered: number; timesCorrect: number }> {
  const result = await prisma.userQuestionProgress.aggregate({
    where: { userId },
    _sum: { timesAnswered: true, timesCorrect: true },
  })
  return {
    timesAnswered: result._sum.timesAnswered ?? 0,
    timesCorrect: result._sum.timesCorrect ?? 0,
  }
}

export async function getSessionsThisWeekCount(userId: string): Promise<number> {
  const startOfWeek = new Date()
  startOfWeek.setHours(0, 0, 0, 0)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())

  return prisma.quizSession.count({
    where: {
      userId,
      status: 'Completed',
      completedAt: { gte: startOfWeek },
    },
  })
}

export type RawSectionProgress = {
  sectionId: string
  sectionName: string
  timesAnswered: number
  timesCorrect: number
}

export async function getSectionProgress(userId: string): Promise<RawSectionProgress[]> {
  const rows = await prisma.userQuestionProgress.findMany({
    where: { userId },
    select: {
      timesAnswered: true,
      timesCorrect: true,
      question: {
        select: {
          sectionId: true,
          section: { select: { name: true } },
        },
      },
    },
  })

  const bySection = new Map<string, RawSectionProgress>()
  for (const row of rows) {
    const sectionId = row.question.sectionId
    const sectionName = row.question.section.name
    const existing = bySection.get(sectionId) ?? {
      sectionId,
      sectionName,
      timesAnswered: 0,
      timesCorrect: 0,
    }
    existing.timesAnswered += row.timesAnswered
    existing.timesCorrect += row.timesCorrect
    bySection.set(sectionId, existing)
  }

  return Array.from(bySection.values())
}

export type RawRecentSession = {
  id: string
  completedAt: Date
  score: number
  totalCount: number
}

export async function getRecentCompletedSessions(
  userId: string,
  limit: number,
): Promise<RawRecentSession[]> {
  const sessions = await prisma.quizSession.findMany({
    where: { userId, status: 'Completed', completedAt: { not: null }, score: { not: null } },
    orderBy: { completedAt: 'desc' },
    take: limit,
    select: { id: true, completedAt: true, score: true, totalCount: true },
  })

  return sessions.map((s) => ({
    id: s.id,
    completedAt: s.completedAt!,
    score: s.score!,
    totalCount: s.totalCount,
  }))
}
