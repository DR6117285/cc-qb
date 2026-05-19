# Mock Exam — Candidate Types, Scaled Weights & Timed Sessions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend mock exam to support three IBLM candidate types with proportionally scaled question counts and a 4-hour timed session with snapshot-and-continue UX at expiry.

**Architecture:** CandidateType is stored on the User model; question count (150 or 120) and time limit are derived at session creation and stored on QuizSession. A client-side timer component drives the countdown, calls a server action to snapshot the timed score at expiry, and presents a modal. The results page shows both timed and final scores when a timed snapshot exists.

**Tech Stack:** Next.js 16 App Router, Prisma 7, PostgreSQL, TypeScript, Vitest, Tailwind CSS

---

## File Map

| File | Change |
|---|---|
| `lm-platform/prisma/schema.prisma` | Add `CandidateType` enum; `candidateType` on User; `timeLimitSec`, `timedScore`, `timedAt` on QuizSession |
| `lm-platform/modules/quiz/selection.ts` | Add `scaleWeights` helper |
| `lm-platform/modules/quiz/selection.test.ts` | Add `scaleWeights` tests |
| `lm-platform/modules/quiz/repository.ts` | Accept `timeLimitSec` in `createSession`; add `snapshotTimedScore` |
| `lm-platform/modules/quiz/service.ts` | Update `createSession` mock-exam branch; add `snapshotTimedScore`; extend `SessionView` with timer fields |
| `lm-platform/modules/quiz/service.test.ts` | New — test `snapshotTimedScore` |
| `lm-platform/app/quiz/[sessionId]/actions.ts` | Add `snapshotTimedScoreAction` |
| `lm-platform/app/quiz/[sessionId]/mock-exam-timer.tsx` | New client component — countdown + time-up modal |
| `lm-platform/app/quiz/[sessionId]/page.tsx` | Wire in `MockExamTimer` |
| `lm-platform/app/quiz/[sessionId]/results/page.tsx` | Show timed score row when present |
| `lm-platform/app/quiz/new/page.tsx` | Show question count + time on mock exam button |
| `lm-platform/app/profile/page.tsx` | New — candidateType selector |
| `lm-platform/app/profile/actions.ts` | New — `updateCandidateTypeAction` |

---

## Task 1: Schema — CandidateType and timer fields

**Files:**
- Modify: `lm-platform/prisma/schema.prisma`

- [ ] **Step 1: Add enum and fields**

In `schema.prisma`, add the enum after the existing `QuizSessionStatus` enum:

```prisma
enum CandidateType {
  Physician
  Professional
  Practitioner
}
```

Add to `model User` (after the `role` field):

```prisma
candidateType  CandidateType?
```

Add to `model QuizSession` (after `completedAt`):

```prisma
timeLimitSec  Int?
timedScore    Int?
timedAt       DateTime?
```

- [ ] **Step 2: Run migration**

```powershell
cd lm-platform
npx prisma migrate dev --name add-candidate-type-and-timer
```

Expected: `The following migration(s) have been applied: ...add_candidate_type_and_timer`

- [ ] **Step 3: Verify generated client**

```powershell
npx prisma generate
```

Expected: `Generated Prisma Client`

- [ ] **Step 4: Commit**

```bash
git add lm-platform/prisma/schema.prisma lm-platform/prisma/migrations/
git commit -m "feat: add CandidateType enum and timer fields to schema"
```

---

## Task 2: scaleWeights helper (TDD)

**Files:**
- Modify: `lm-platform/modules/quiz/selection.ts`
- Modify: `lm-platform/modules/quiz/selection.test.ts`

- [ ] **Step 1: Write failing tests**

Add to `selection.test.ts` after the existing `selectWeightedQuestions` describe block:

```typescript
describe('scaleWeights', () => {
  it('returns identical weights when target equals original sum', () => {
    const result = scaleWeights(MOCK_EXAM_WEIGHTS, 200)
    expect(result).toEqual(MOCK_EXAM_WEIGHTS)
  })

  it('sums to 150 for Physician target', () => {
    const result = scaleWeights(MOCK_EXAM_WEIGHTS, 150)
    const total = Object.values(result).reduce((a, b) => a + b, 0)
    expect(total).toBe(150)
  })

  it('sums to 120 for Professional target', () => {
    const result = scaleWeights(MOCK_EXAM_WEIGHTS, 120)
    const total = Object.values(result).reduce((a, b) => a + b, 0)
    expect(total).toBe(120)
  })

  it('preserves all section keys', () => {
    const result = scaleWeights(MOCK_EXAM_WEIGHTS, 150)
    expect(Object.keys(result)).toEqual(Object.keys(MOCK_EXAM_WEIGHTS))
  })

  it('all values are positive integers', () => {
    const result = scaleWeights(MOCK_EXAM_WEIGHTS, 120)
    for (const v of Object.values(result)) {
      expect(v).toBeGreaterThan(0)
      expect(Number.isInteger(v)).toBe(true)
    }
  })
})
```

Add `scaleWeights` to the import in the test file:
```typescript
import { selectWeightedQuestions, scaleWeights, MOCK_EXAM_WEIGHTS } from './selection'
```

- [ ] **Step 2: Run tests to verify they fail**

```powershell
cd lm-platform
npx vitest run modules/quiz/selection.test.ts
```

Expected: `scaleWeights` tests fail with `scaleWeights is not a function`.

- [ ] **Step 3: Implement scaleWeights**

Add to `lm-platform/modules/quiz/selection.ts` after `MOCK_EXAM_WEIGHTS`:

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

```powershell
npx vitest run modules/quiz/selection.test.ts
```

Expected: all tests pass, including the pre-existing ones.

- [ ] **Step 5: Commit**

```bash
git add lm-platform/modules/quiz/selection.ts lm-platform/modules/quiz/selection.test.ts
git commit -m "feat: add scaleWeights helper with largest-remainder rounding"
```

---

## Task 3: Update createSession — candidateType lookup + timeLimitSec

**Files:**
- Modify: `lm-platform/modules/quiz/repository.ts`
- Modify: `lm-platform/modules/quiz/service.ts`

- [ ] **Step 1: Update repository CreateSessionInput**

In `lm-platform/modules/quiz/repository.ts`, update `CreateSessionInput` and `createSession`:

```typescript
export type CreateSessionInput = {
  userId: string
  questionIds: string[]
  timeLimitSec?: number
}

export async function createSession(input: CreateSessionInput): Promise<QuizSession> {
  return prisma.quizSession.create({
    data: {
      userId: input.userId,
      totalCount: input.questionIds.length,
      timeLimitSec: input.timeLimitSec ?? null,
      questions: {
        create: input.questionIds.map((questionId, position) => ({ questionId, position })),
      },
    },
  })
}
```

- [ ] **Step 2: Update createSession mock-exam branch in service.ts**

Replace the mock-exam branch in `lm-platform/modules/quiz/service.ts` (lines 85–110):

```typescript
export async function createSession(input: CreateSessionInput): Promise<{ sessionId: string }> {
  if (input.mode === 'mock-exam') {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { candidateType: true },
    })
    const target =
      user?.candidateType === 'Physician' ? 150 : 120

    const scaledWeights = scaleWeights(MOCK_EXAM_WEIGHTS, target)

    const rawQuestions = await prisma.question.findMany({
      select: {
        id: true,
        questionText: true,
        rationale: true,
        pageReference: true,
        sectionId: true,
        options: true,
      },
    })

    const candidates: QuestionWithOptions[] = rawQuestions.map((q) => ({
      ...q,
      options: q.options as QuestionOption[],
    }))

    const selected = selectWeightedQuestions(candidates, scaledWeights)

    const session = await repo.createSession({
      userId: input.userId,
      questionIds: selected.map((q) => q.id),
      timeLimitSec: 14400,
    })

    return { sessionId: session.id }
  }
  // ... rest of function unchanged
```

Also update the import line at the top of service.ts:

```typescript
import { selectQuestions, selectWeightedQuestions, MOCK_EXAM_WEIGHTS, scaleWeights } from './selection'
```

- [ ] **Step 3: Verify TypeScript compiles**

```powershell
cd lm-platform
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lm-platform/modules/quiz/repository.ts lm-platform/modules/quiz/service.ts
git commit -m "feat: createSession reads candidateType and scales mock exam weights"
```

---

## Task 4: Extend SessionView with timer fields

**Files:**
- Modify: `lm-platform/modules/quiz/service.ts`

The quiz page and results page need `createdAt`, `timeLimitSec`, `timedScore`, and `timedAt` from the session.

- [ ] **Step 1: Update SessionView type**

In `service.ts`, update the `SessionView` type:

```typescript
export type SessionView = {
  sessionId: string
  status: 'InProgress' | 'Completed'
  totalCount: number
  answeredCount: number
  createdAt: string        // ISO string — safe to pass as a React prop
  timeLimitSec: number | null
  timedScore: number | null
  timedAt: string | null   // ISO string
  questions: QuestionView[]
}
```

- [ ] **Step 2: Update getSessionView to populate new fields**

Replace the return statement in `getSessionView`:

```typescript
return {
  sessionId,
  status: session.status as 'InProgress' | 'Completed',
  totalCount: session.totalCount,
  answeredCount: questions.filter((q) => q.answer !== null).length,
  createdAt: session.createdAt.toISOString(),
  timeLimitSec: session.timeLimitSec ?? null,
  timedScore: session.timedScore ?? null,
  timedAt: session.timedAt ? session.timedAt.toISOString() : null,
  questions,
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```powershell
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lm-platform/modules/quiz/service.ts
git commit -m "feat: extend SessionView with createdAt, timeLimitSec, timedScore, timedAt"
```

---

## Task 5: snapshotTimedScore — repo, service, action (TDD)

**Files:**
- Modify: `lm-platform/modules/quiz/repository.ts`
- Modify: `lm-platform/modules/quiz/service.ts`
- Create: `lm-platform/modules/quiz/service.test.ts`
- Modify: `lm-platform/app/quiz/[sessionId]/actions.ts`

- [ ] **Step 1: Write failing service test**

Create `lm-platform/modules/quiz/service.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```powershell
cd lm-platform
npx vitest run modules/quiz/service.test.ts
```

Expected: fails with `snapshotTimedScore is not a function`.

- [ ] **Step 3: Add snapshotTimedScore to repository**

Add to `lm-platform/modules/quiz/repository.ts`:

```typescript
export async function snapshotTimedScore(
  sessionId: string,
  timedScore: number,
): Promise<void> {
  await prisma.quizSession.update({
    where: { id: sessionId },
    data: { timedScore, timedAt: new Date() },
  })
}
```

- [ ] **Step 4: Add snapshotTimedScore to service**

Add to `lm-platform/modules/quiz/service.ts`:

```typescript
export type TimedSnapshotResult = {
  timedScore: number
  answeredCount: number
  totalCount: number
}

export async function snapshotTimedScore(
  sessionId: string,
  userId: string,
): Promise<TimedSnapshotResult> {
  const session = await repo.findSession(sessionId)
  if (!session) throw new Error('Session not found')
  if (session.userId !== userId) throw new Error('Forbidden')

  if (session.timedScore !== null) {
    const answeredCount = await repo.countAnswers(sessionId)
    return { timedScore: session.timedScore, answeredCount, totalCount: session.totalCount }
  }

  const timedScore = await repo.countCorrectAnswers(sessionId)
  await repo.snapshotTimedScore(sessionId, timedScore)
  const answeredCount = await repo.countAnswers(sessionId)
  return { timedScore, answeredCount, totalCount: session.totalCount }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```powershell
npx vitest run modules/quiz/service.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 6: Add snapshotTimedScoreAction server action**

In `lm-platform/app/quiz/[sessionId]/actions.ts`, add after the existing actions:

```typescript
import { submitAnswer, endSession, snapshotTimedScore } from '@/modules/quiz/service'

export async function snapshotTimedScoreAction(sessionId: string) {
  const session = await auth()
  if (!session?.user?.id) return null
  return snapshotTimedScore(sessionId, session.user.id)
}
```

Note: update the import line at the top — add `snapshotTimedScore` to the existing import from `@/modules/quiz/service`.

- [ ] **Step 7: Verify TypeScript compiles**

```powershell
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add lm-platform/modules/quiz/repository.ts lm-platform/modules/quiz/service.ts lm-platform/modules/quiz/service.test.ts lm-platform/app/quiz/[sessionId]/actions.ts
git commit -m "feat: add snapshotTimedScore to repo, service, and server action"
```

---

## Task 6: MockExamTimer client component + wire into quiz page

**Files:**
- Create: `lm-platform/app/quiz/[sessionId]/mock-exam-timer.tsx`
- Modify: `lm-platform/app/quiz/[sessionId]/page.tsx`

- [ ] **Step 1: Create MockExamTimer client component**

Create `lm-platform/app/quiz/[sessionId]/mock-exam-timer.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { snapshotTimedScoreAction, endSessionAction } from './actions'

type Props = {
  sessionId: string
  createdAtIso: string
  timeLimitSec: number
}

type Modal = {
  timedScore: number
  answeredCount: number
  totalCount: number
}

function formatTime(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function MockExamTimer({ sessionId, createdAtIso, timeLimitSec }: Props) {
  const [remaining, setRemaining] = useState<number | null>(null)
  const [modal, setModal] = useState<Modal | null>(null)
  const [continuing, setContinuing] = useState(false)

  useEffect(() => {
    const expiresAt = new Date(createdAtIso).getTime() + timeLimitSec * 1000

    const tick = () => {
      const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
      setRemaining(diff)
      if (diff === 0) {
        clearInterval(id)
        snapshotTimedScoreAction(sessionId).then((result) => {
          if (result) setModal(result)
        })
      }
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [sessionId, createdAtIso, timeLimitSec])

  if (continuing || remaining === null) return null

  return (
    <>
      <span
        className={`text-sm font-mono tabular-nums ${
          remaining < 300 ? 'text-red-600 font-semibold' : 'text-gray-500'
        }`}
      >
        {formatTime(remaining)} remaining
      </span>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="rounded-2xl bg-white p-8 shadow-xl w-full max-w-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Time&apos;s up</h2>
            <p className="text-sm text-gray-600 mb-1">
              You answered {modal.answeredCount} of {modal.totalCount} questions.
            </p>
            <p className="text-sm text-gray-600 mb-6">
              Timed score:{' '}
              <span className="font-semibold text-gray-900">
                {modal.timedScore} / {modal.totalCount}
              </span>
            </p>
            <p className="text-sm text-gray-700 mb-6">
              Would you like to continue and finish the remaining questions without a timer?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setContinuing(true)}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Continue
              </button>
              <button
                onClick={async () => { await endSessionAction(sessionId) }}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                End Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Wire MockExamTimer into the quiz page**

In `lm-platform/app/quiz/[sessionId]/page.tsx`, add the import:

```typescript
import { MockExamTimer } from './mock-exam-timer'
```

In the progress bar section (the `<div className="mb-6">` block), add the timer after the `<span>{view.answeredCount} answered</span>` span:

Replace this block:
```tsx
<div className="mb-1 flex justify-between text-sm text-gray-500">
  <span>Question {position + 1} of {view.totalCount}</span>
  <span>{view.answeredCount} answered</span>
</div>
```

With:
```tsx
<div className="mb-1 flex justify-between text-sm text-gray-500">
  <span>Question {position + 1} of {view.totalCount}</span>
  <div className="flex items-center gap-4">
    {view.timeLimitSec && (
      <MockExamTimer
        sessionId={sessionId}
        createdAtIso={view.createdAt}
        timeLimitSec={view.timeLimitSec}
      />
    )}
    <span>{view.answeredCount} answered</span>
  </div>
</div>
```

- [ ] **Step 3: Verify TypeScript compiles**

```powershell
cd lm-platform
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "lm-platform/app/quiz/[sessionId]/mock-exam-timer.tsx" "lm-platform/app/quiz/[sessionId]/page.tsx"
git commit -m "feat: add MockExamTimer client component with time-up modal"
```

---

## Task 7: Results page — show timed score

**Files:**
- Modify: `lm-platform/app/quiz/[sessionId]/results/page.tsx`

- [ ] **Step 1: Update results page to show timed score**

`getSessionView` now returns `timedScore` and `totalCount`. Update the score card section in `results/page.tsx`.

Replace the score card's `<p className="mt-2 text-gray-600 text-sm">` line and the `<a>` button so the full score card becomes:

```tsx
{/* Score card */}
<div className="rounded-2xl bg-white p-8 shadow-sm text-center">
  <p className="text-sm font-medium text-gray-500 mb-1">Your Score</p>
  <p className={`text-6xl font-bold ${scoreColor}`}>{pct}%</p>
  <p className="mt-2 text-gray-600 text-sm">{correct} / {total} correct</p>

  {view.timedScore !== null && (
    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 text-left space-y-1">
      <p>
        <span className="font-medium">Timed score</span>{' '}
        <span className="text-gray-500">(within 4 hours):</span>{' '}
        <span className="font-semibold">{view.timedScore} / {total}</span>
      </p>
      <p>
        <span className="font-medium">Final score</span>{' '}
        <span className="text-gray-500">(all answers):</span>{' '}
        <span className="font-semibold">{correct} / {total}</span>
      </p>
    </div>
  )}

  <div className="mt-6 h-3 w-full rounded-full bg-gray-200">
    <div
      className={`h-3 rounded-full transition-all ${pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
      style={{ width: `${pct}%` }}
    />
  </div>

  <a
    href="/quiz/new"
    className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
  >
    Start New Quiz
  </a>
</div>
```

- [ ] **Step 2: Verify TypeScript compiles**

```powershell
cd lm-platform
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "lm-platform/app/quiz/[sessionId]/results/page.tsx"
git commit -m "feat: show timed and final scores on results page"
```

---

## Task 8: Profile page — candidateType selector

**Files:**
- Create: `lm-platform/app/profile/actions.ts`
- Create: `lm-platform/app/profile/page.tsx`

- [ ] **Step 1: Create updateCandidateTypeAction**

Create `lm-platform/app/profile/actions.ts`:

```typescript
'use server'

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import type { CandidateType } from '@prisma/client'

const VALID_TYPES: CandidateType[] = ['Physician', 'Professional', 'Practitioner']

export async function updateCandidateTypeAction(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth/signin')

  const raw = formData.get('candidateType') as string
  if (!VALID_TYPES.includes(raw as CandidateType)) {
    throw new Error('Invalid candidate type')
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { candidateType: raw as CandidateType },
  })

  redirect('/profile')
}
```

- [ ] **Step 2: Create profile page**

Create `lm-platform/app/profile/page.tsx`:

```tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { updateCandidateTypeAction } from './actions'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth/signin')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, candidateType: true },
  })

  const candidateType = user?.candidateType ?? null

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-md px-4">
        <div className="rounded-2xl bg-white p-8 shadow-sm space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
            {user?.email && (
              <p className="mt-1 text-sm text-gray-500">{user.email}</p>
            )}
          </div>

          <form action={updateCandidateTypeAction} className="space-y-5">
            <div>
              <label htmlFor="candidateType" className="mb-1 block text-sm font-medium text-gray-700">
                Candidate type
              </label>
              <p className="mb-2 text-xs text-gray-500">
                This determines how many questions appear in your mock exam (150 for Physicians, 120 for others).
              </p>
              <select
                id="candidateType"
                name="candidateType"
                defaultValue={candidateType ?? ''}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="" disabled>Select your candidate type</option>
                <option value="Physician">Physician (MD/DO) — 150 questions</option>
                <option value="Professional">Professional (Masters/PhD) — 120 questions</option>
                <option value="Practitioner">Practitioner (Degree level) — 120 questions</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```powershell
cd lm-platform
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lm-platform/app/profile/page.tsx lm-platform/app/profile/actions.ts
git commit -m "feat: add profile page with candidateType selector"
```

---

## Task 9: Mock exam button — show question count

**Files:**
- Modify: `lm-platform/app/quiz/new/page.tsx`

- [ ] **Step 1: Fetch candidateType on the quiz config page**

In `lm-platform/app/quiz/new/page.tsx`, after the `const session = await auth()` line, add:

```typescript
const user = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: { candidateType: true },
})
const mockExamCount = user?.candidateType === 'Physician' ? 150 : 120
```

- [ ] **Step 2: Update the mock exam button label**

Replace the button span inside the mock exam form:

```tsx
<button
  type="submit"
  className="w-full rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
>
  Start Mock Exam
  <span className="ml-2 text-xs font-normal text-gray-400">
    {mockExamCount} questions · 4 hours · board-weighted
  </span>
</button>
```

- [ ] **Step 3: Add profile link below the mock exam form**

After the closing `</form>` of the mock exam form, add:

```tsx
<p className="text-center text-xs text-gray-400">
  Wrong count?{' '}
  <a href="/profile" className="text-blue-500 hover:underline">
    Update your candidate type
  </a>
</p>
```

- [ ] **Step 4: Verify TypeScript compiles**

```powershell
cd lm-platform
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add lm-platform/app/quiz/new/page.tsx
git commit -m "feat: show question count on mock exam button based on candidateType"
```

---

## Final Verification

- [ ] Confirm all tests pass: `npx vitest run`
- [ ] Start dev server: `npm run dev`
- [ ] Test profile page at `/profile` — set candidate type to Physician
- [ ] Test quiz config page at `/quiz/new` — button shows "150 questions · 4 hours · board-weighted"
- [ ] Start mock exam — verify session creates with 150 questions and `timeLimitSec: 14400`
- [ ] Verify timer appears in quiz header
- [ ] Change candidate type to Professional — verify button shows 120 questions
