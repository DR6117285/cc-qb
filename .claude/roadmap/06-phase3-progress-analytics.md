# Phase 3 — Progress & Analytics

**Goal**: Dashboard shows real personalised data. Weak areas identified. Quiz weights toward weak questions.
**Time estimate**: Week 5

## Analytics Service

File: `src/modules/analytics/service.ts`

```typescript
// Questions with accuracy < 60% (timesCorrect/timesAnswered)
getWeakAreas(userId: string): Promise<WeakArea[]>

// Correct% by session, last 10 sessions
getPerformanceTrend(userId: string): Promise<PerformanceTrend[]>

// Per-section accuracy summary
getSectionBreakdown(userId: string): Promise<SectionScore[]>

// KPI row data
getOverallStats(userId: string): Promise<{
  totalAnswered: number
  overallAccuracy: number
  sessionsThisWeek: number
}>
```

Types in `src/modules/analytics/types.ts`:
```typescript
export type WeakArea = {
  questionId: string
  questionText: string
  sectionId: string
  accuracy: number        // 0–1
  timesAnswered: number
}

export type PerformanceTrend = {
  sessionId: string
  completedAt: Date
  score: number
  totalCount: number
  accuracyPct: number
}

export type SectionScore = {
  sectionId: string
  sectionName: string
  questionsAttempted: number
  accuracy: number
}
```

## Dashboard Page

File: `app/dashboard/page.tsx` (RSC — direct Prisma queries via analytics service)

Three panels:
1. **KPI row** — total answered, overall accuracy %, sessions this week
2. **Performance trend** — Recharts LineChart, last 10 sessions
3. **Weak areas** — list of lowest-accuracy questions with drill-down link

## Update Quiz Selection for Weak Areas

File: `src/modules/quiz/selection.ts`

When `weighting: 'weak-areas-first'`:
- Sort candidates by accuracy ascending (weakest first)
- Take top N×2 candidates
- Random shuffle within that pool
- Return first N

The `createSession()` in `quiz/service.ts` should:
1. Fetch `userProgress` from `user_question_progress` for this user
2. Pass it to `selectQuestions(candidates, config, userProgress)`

## Done When

- [ ] `/dashboard` loads with real data (not empty states)
- [ ] Performance trend chart renders correctly
- [ ] Weak areas list shows questions < 60% accuracy
- [ ] A new quiz correctly over-represents weak questions
- [ ] `/progress` page shows per-section table
