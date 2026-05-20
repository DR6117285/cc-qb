# Analytics Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/dashboard` RSC showing at-a-glance progress — KPI row, per-section accuracy breakdown, and recent session trend — backed by a new `modules/analytics/` module.

**Architecture:** New `modules/analytics/` module with `types.ts`, `repository.ts`, `service.ts` following the exact same pattern as `modules/quiz/`. The dashboard page (`app/dashboard/page.tsx`) is a pure RSC that calls the service and renders three panels. No client components, no new dependencies, no schema changes.

**Tech Stack:** Next.js 15, TypeScript, Prisma 7, Tailwind CSS 4, Vitest

---

## File Map

| File | Change |
|------|--------|
| `lm-platform/modules/analytics/types.ts` | New — domain types |
| `lm-platform/modules/analytics/repository.ts` | New — 4 Prisma queries |
| `lm-platform/modules/analytics/service.ts` | New — orchestration + derived calculations |
| `lm-platform/modules/analytics/service.test.ts` | New — Vitest tests for service logic |
| `lm-platform/app/dashboard/page.tsx` | Replace stub with real RSC |

---

## Task 1: Types

**Files:**
- Create: `lm-platform/modules/analytics/types.ts`

- [ ] **Step 1: Create the types file**

Create `lm-platform/modules/analytics/types.ts`:

```ts
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
```

- [ ] **Step 2: Type-check**

```powershell
cd lm-platform && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```powershell
git -C .. add lm-platform/modules/analytics/types.ts
git -C .. commit -m "feat: add analytics module types"
```

---

## Task 2: Repository

**Files:**
- Create: `lm-platform/modules/analytics/repository.ts`

- [ ] **Step 1: Create the repository**

Create `lm-platform/modules/analytics/repository.ts`:

```ts
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
```

- [ ] **Step 2: Type-check**

```powershell
npx tsc --noEmit
```

Expected: no errors. If Prisma complains about `question.section`, check `prisma/schema.prisma` — the `Question` model must have a `section Section @relation(...)` field. If it does not, add it before continuing:

```prisma
// In the Question model, add:
section   Section  @relation(fields: [sectionId], references: [id])
```

Then run `npx prisma generate`.

- [ ] **Step 3: Commit**

```powershell
git -C .. add lm-platform/modules/analytics/repository.ts
git -C .. commit -m "feat: add analytics repository"
```

---

## Task 3: Service + Tests

**Files:**
- Create: `lm-platform/modules/analytics/service.ts`
- Create: `lm-platform/modules/analytics/service.test.ts`

- [ ] **Step 1: Write failing tests first**

Create `lm-platform/modules/analytics/service.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests — expect failures**

```powershell
npx vitest run modules/analytics/service.test.ts
```

Expected: FAIL — `getOverallStats` etc. not found.

- [ ] **Step 3: Implement the service**

Create `lm-platform/modules/analytics/service.ts`:

```ts
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
```

- [ ] **Step 4: Run tests — expect all pass**

```powershell
npx vitest run modules/analytics/service.test.ts
```

Expected: 6 tests PASS.

- [ ] **Step 5: Type-check**

```powershell
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```powershell
git -C .. add lm-platform/modules/analytics/service.ts lm-platform/modules/analytics/service.test.ts
git -C .. commit -m "feat: add analytics service with tests"
```

---

## Task 4: Dashboard Page

**Files:**
- Modify: `lm-platform/app/dashboard/page.tsx`

- [ ] **Step 1: Replace the stub with the real RSC**

Replace the full contents of `lm-platform/app/dashboard/page.tsx`:

```tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getOverallStats, getSectionScores, getRecentSessions } from '@/modules/analytics/service'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth/signin')

  const userId = session.user.id

  const [stats, sectionScores, recentSessions] = await Promise.all([
    getOverallStats(userId),
    getSectionScores(userId),
    getRecentSessions(userId),
  ])

  if (stats.totalAnswered === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-2xl bg-white p-10 shadow-sm text-center max-w-sm">
          <p className="text-lg font-semibold text-gray-800 mb-2">No data yet</p>
          <p className="text-sm text-gray-500 mb-6">Complete a quiz to see your progress here.</p>
          <a
            href="/quiz/new"
            className="inline-block rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Start a Quiz
          </a>
        </div>
      </main>
    )
  }

  const accuracyPct = Math.round(stats.overallAccuracy * 100)

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 space-y-6">

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-white p-5 shadow-sm text-center">
            <p className="text-xs font-medium text-gray-500 mb-1">Overall Accuracy</p>
            <p className={`text-3xl font-bold ${accuracyPct >= 70 ? 'text-green-600' : accuracyPct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
              {accuracyPct}%
            </p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm text-center">
            <p className="text-xs font-medium text-gray-500 mb-1">Questions Answered</p>
            <p className="text-3xl font-bold text-gray-800">{stats.totalAnswered}</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm text-center">
            <p className="text-xs font-medium text-gray-500 mb-1">Sessions This Week</p>
            <p className="text-3xl font-bold text-gray-800">{stats.sessionsThisWeek}</p>
          </div>
        </div>

        {/* Two-column panel */}
        <div className="grid grid-cols-2 gap-4">

          {/* Section breakdown */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Section Breakdown</h2>
            {sectionScores.length === 0 ? (
              <p className="text-sm text-gray-400">No section data yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100">
                    <th className="text-left pb-2 font-medium">Section</th>
                    <th className="text-right pb-2 font-medium">Attempted</th>
                    <th className="text-right pb-2 font-medium">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sectionScores.map((s) => {
                    const pct = Math.round(s.accuracy * 100)
                    const dot = pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    return (
                      <tr key={s.sectionId}>
                        <td className="py-2 text-gray-700 pr-2">{s.sectionName}</td>
                        <td className="py-2 text-right text-gray-500">{s.questionsAttempted}</td>
                        <td className="py-2 text-right">
                          <span className="inline-flex items-center gap-1.5">
                            <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
                            <span className="text-gray-700">{pct}%</span>
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Recent sessions */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Recent Sessions</h2>
            {recentSessions.length === 0 ? (
              <p className="text-sm text-gray-400">No completed sessions yet.</p>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((s) => {
                  const barColor =
                    s.accuracyPct >= 70
                      ? 'bg-green-500'
                      : s.accuracyPct >= 50
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  const date = s.completedAt.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                  })
                  return (
                    <div key={s.sessionId}>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{date}</span>
                        <span>{s.score}/{s.totalCount} · {s.accuracyPct}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100">
                        <div
                          className={`h-2 rounded-full ${barColor}`}
                          style={{ width: `${s.accuracyPct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

        {/* Nav */}
        <div className="flex gap-3">
          <a href="/quiz/new" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Start Quiz
          </a>
        </div>

      </div>
    </main>
  )
}
```

- [ ] **Step 2: Type-check**

```powershell
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Start dev server and verify manually**

```powershell
npm run dev
```

Visit `http://localhost:3000/dashboard`. Verify:
- If you have quiz history: KPI row shows real numbers, section table renders, bars appear in recent sessions.
- If no history: empty state card with "Start a Quiz" link.
- No console errors.

- [ ] **Step 4: Commit**

```powershell
git -C .. add lm-platform/app/dashboard/page.tsx
git -C .. commit -m "feat: analytics dashboard with KPIs, section breakdown, and session trend"
```

---

## Done When

- [ ] `npx vitest run` passes (all 6 analytics tests green)
- [ ] `/dashboard` loads with real data after completing at least one quiz
- [ ] Empty state renders correctly for a new user
- [ ] Section table sorted weakest-first
- [ ] Session bars coloured by accuracy threshold
- [ ] `npx tsc --noEmit` clean
