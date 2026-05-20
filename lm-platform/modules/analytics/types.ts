export type OverallStats = {
  totalAnswered: number
  overallAccuracy: number   // 0–1
  sessionsThisWeek: number
}

export type SectionScore = {
  sectionId: string
  sectionName: string
  questionsAttempted: number
  accuracy: number          // 0–1, 0 if no attempts
}

export type RecentSession = {
  sessionId: string
  completedAt: Date
  score: number
  totalCount: number
  accuracyPct: number       // 0–100, rounded integer
}
