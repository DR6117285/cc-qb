# Analytics Dashboard — Design Spec

**Date:** 2026-05-20  
**Status:** Approved for implementation

---

## Goal

Add a `/dashboard` page showing at-a-glance progress: overall accuracy KPIs, per-section breakdown, and recent session trend. No new DB models, no schema changes, no chart libraries.

---

## Layout

Layout B: KPI row on top, two-column panel below (section breakdown left, session trend right).

---

## New Module: `modules/analytics/`

### `types.ts`

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
  accuracyPct: number       // 0–100, rounded
}
```

### `repository.ts`

Three thin Prisma queries — no business logic:

1. `getProgressAggregates(userId)` — aggregate `user_question_progress`: sum `timesAnswered`, sum `timesCorrect`
2. `getSessionsThisWeek(userId)` — count completed `quiz_sessions` where `completedAt >= start of current week`
3. `getSectionProgress(userId)` — group `user_question_progress` by `questions.sectionId`, join `sections.name`, return per-section sums
4. `getRecentSessions(userId, limit: number)` — fetch last N completed `quiz_sessions` ordered by `completedAt desc`, select `id, score, totalCount, completedAt`

### `service.ts`

Thin orchestration layer. Calls repository functions, applies derived calculations:

- `getOverallStats(userId): Promise<OverallStats>` — calls `getProgressAggregates` + `getSessionsThisWeek`; computes `overallAccuracy = timesCorrect / timesAnswered` (returns 0 if `timesAnswered === 0`)
- `getSectionScores(userId): Promise<SectionScore[]>` — calls `getSectionProgress`; computes per-section `accuracy`; sorted by accuracy ascending (weakest first)
- `getRecentSessions(userId): Promise<RecentSession[]>` — calls `getRecentSessions(userId, 10)`; computes `accuracyPct = Math.round((score / totalCount) * 100)`

---

## Dashboard Page

`app/dashboard/page.tsx` — RSC, no client components.

**Structure:**

```
[ KPI: Overall Accuracy ] [ KPI: Total Answered ] [ KPI: Sessions This Week ]

[ Section Breakdown (left)        ] [ Recent Sessions trend (right)  ]
  Section name  | Attempted | Acc    Session date    ████████░░ 80%
  Nutrition     |    52     | 48% ●  Session date    ██████░░░░ 60%
  Sleep         |    16     | 52% ●  ...
  Exercise      |    28     | 81% ●
```

**Section breakdown:** table rows. Accuracy dot colour: green ≥70%, amber 50–69%, red <50%.

**Session trend:** each session rendered as a CSS `div` with `width: ${accuracyPct}%`, labelled with short date + score fraction. Background bar is full-width grey; fill is coloured by same thresholds.

**Empty state:** if `totalAnswered === 0`, show a single prompt card: "Complete a quiz to see your progress" with a link to `/quiz/new`.

---

## Files Changed

| File | Change |
|------|--------|
| `lm-platform/modules/analytics/types.ts` | New — domain types |
| `lm-platform/modules/analytics/repository.ts` | New — 4 Prisma queries |
| `lm-platform/modules/analytics/service.ts` | New — orchestration + derived calculations |
| `lm-platform/app/dashboard/page.tsx` | Replace stub with real RSC |

No schema changes. No new routes. No new dependencies.

---

## Error Handling

- Divide-by-zero: `accuracy = timesAnswered > 0 ? timesCorrect / timesAnswered : 0`
- Empty state handled in the page (not the service) — service returns empty arrays/zero stats, page renders the prompt card

---

## Out of Scope

- Weak-areas-first quiz weighting (Session B)
- Per-section score on results page
- Filtering/date-range on the trend
