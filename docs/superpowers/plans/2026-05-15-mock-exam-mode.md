# Mock Exam Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Start Mock Exam" button to the quiz config page that generates a 200-question session weighted by the real IBLM board exam's section distribution.

**Architecture:** Add a `selectWeightedQuestions` pure function and a `MOCK_EXAM_WEIGHTS` constant to `modules/quiz/selection.ts`. Extend `createSession` in the service layer with a `mode?: 'mock-exam'` branch that uses this function. Thread `mode` through the server action and add a second submit button to the UI. No schema changes, no new routes.

**Tech Stack:** Next.js 16, TypeScript, Prisma 7, Tailwind CSS 4, Vitest (added in Task 1)

---

## File Map

| File | Change |
|------|--------|
| `lm-platform/package.json` | Add vitest + @vitest/coverage-v8 as devDependencies |
| `lm-platform/vitest.config.ts` | New — vitest config |
| `lm-platform/modules/quiz/selection.ts` | Add `MOCK_EXAM_WEIGHTS` + `selectWeightedQuestions` |
| `lm-platform/modules/quiz/selection.test.ts` | New — tests for `selectWeightedQuestions` |
| `lm-platform/modules/quiz/service.ts` | Add `mode?` to `CreateSessionInput`; add mock-exam branch |
| `lm-platform/app/quiz/new/actions.ts` | Read `mode` from formData, pass to `createSession` |
| `lm-platform/app/quiz/new/page.tsx` | Add "Start Mock Exam" button with hidden `mode` input |

---

## Task 1: Set up Vitest

**Files:**
- Modify: `lm-platform/package.json`
- Create: `lm-platform/vitest.config.ts`

- [ ] **Step 1: Install vitest**

```powershell
cd lm-platform
npm install --save-dev vitest @vitest/coverage-v8
```

- [ ] **Step 2: Create vitest config**

Create `lm-platform/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 3: Add test script to package.json**

In `lm-platform/package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify vitest runs**

```powershell
npm test
```

Expected: `No test files found` (or similar — no failures).

- [ ] **Step 5: Commit**

```powershell
git -C .. add lm-platform/package.json lm-platform/package-lock.json lm-platform/vitest.config.ts
git -C .. commit -m "chore: add vitest"
```

---

## Task 2: `selectWeightedQuestions` — tests first

**Files:**
- Create: `lm-platform/modules/quiz/selection.test.ts`
- Modify: `lm-platform/modules/quiz/selection.ts`

- [ ] **Step 1: Write failing tests**

Create `lm-platform/modules/quiz/selection.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests — expect failures**

```powershell
npm test -- modules/quiz/selection.test.ts
```

Expected: FAIL — `selectWeightedQuestions` and `MOCK_EXAM_WEIGHTS` not exported.

- [ ] **Step 3: Implement `MOCK_EXAM_WEIGHTS` and `selectWeightedQuestions`**

Replace the full contents of `lm-platform/modules/quiz/selection.ts`:

```ts
import type { QuestionWithOptions, SelectionConfig } from './types'

export function selectQuestions(
  candidates: QuestionWithOptions[],
  config: SelectionConfig,
): QuestionWithOptions[] {
  const shuffled = [...candidates].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, config.count)
}

export const MOCK_EXAM_WEIGHTS: Record<string, number> = {
  '01': 8,
  '02': 20,
  '03': 16,
  '04': 8,
  '05': 52,
  '06': 28,
  '07': 20,
  '08': 16,
  '09': 16,
  '10': 16,
}

export function selectWeightedQuestions(
  candidates: QuestionWithOptions[],
  weights: Record<string, number>,
): QuestionWithOptions[] {
  const bySection = new Map<string, QuestionWithOptions[]>()
  for (const q of candidates) {
    const bucket = bySection.get(q.sectionId) ?? []
    bucket.push(q)
    bySection.set(q.sectionId, bucket)
  }

  const picked: QuestionWithOptions[] = []
  for (const [sectionId, count] of Object.entries(weights)) {
    const pool = bySection.get(sectionId) ?? []
    if (pool.length < count) {
      throw new Error(
        `Not enough questions in section ${sectionId}: need ${count}, have ${pool.length}`,
      )
    }
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    picked.push(...shuffled.slice(0, count))
  }

  return picked.sort(() => Math.random() - 0.5)
}
```

- [ ] **Step 4: Run tests — expect all pass**

```powershell
npm test -- modules/quiz/selection.test.ts
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```powershell
git -C .. add lm-platform/modules/quiz/selection.ts lm-platform/modules/quiz/selection.test.ts
git -C .. commit -m "feat: add selectWeightedQuestions and MOCK_EXAM_WEIGHTS"
```

---

## Task 3: Service layer — `mode` field and mock-exam branch

**Files:**
- Modify: `lm-platform/modules/quiz/service.ts`

- [ ] **Step 1: Add `mode` to `CreateSessionInput` and the mock-exam branch**

In `lm-platform/modules/quiz/service.ts`:

1. Add import for `selectWeightedQuestions` and `MOCK_EXAM_WEIGHTS`:

```ts
import { selectQuestions, selectWeightedQuestions, MOCK_EXAM_WEIGHTS } from './selection'
```

(Replace the existing import line: `import { selectQuestions } from './selection'`)

2. Add `mode` to the type (around line 58):

```ts
export type CreateSessionInput = {
  userId: string
  sectionId?: string
  count: number
  mode?: 'mock-exam'
}
```

3. Replace the body of `createSession` (currently lines 83–117) with:

```ts
export async function createSession(input: CreateSessionInput): Promise<{ sessionId: string }> {
  if (input.mode === 'mock-exam') {
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

    const selected = selectWeightedQuestions(candidates, MOCK_EXAM_WEIGHTS)

    const session = await repo.createSession({
      userId: input.userId,
      questionIds: selected.map((q) => q.id),
    })

    return { sessionId: session.id }
  }

  const where = input.sectionId ? { sectionId: input.sectionId } : {}

  const rawQuestions = await prisma.question.findMany({
    where,
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

  if (candidates.length < input.count) {
    throw new Error(
      `Not enough questions: requested ${input.count}, available ${candidates.length}`,
    )
  }

  const selected = selectQuestions(candidates, { count: input.count, weighting: 'uniform' })

  const session = await repo.createSession({
    userId: input.userId,
    questionIds: selected.map((q) => q.id),
  })

  return { sessionId: session.id }
}
```

- [ ] **Step 2: Type-check**

```powershell
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```powershell
git -C .. add lm-platform/modules/quiz/service.ts
git -C .. commit -m "feat: add mock-exam mode to createSession"
```

---

## Task 4: Server action — thread `mode` through

**Files:**
- Modify: `lm-platform/app/quiz/new/actions.ts`

- [ ] **Step 1: Read `mode` from formData and pass to `createSession`**

Replace the full contents of `lm-platform/app/quiz/new/actions.ts`:

```ts
'use server'

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { createSession } from '@/modules/quiz/service'

export async function startQuizAction(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth/signin')

  const rawMode = formData.get('mode')
  const mode = rawMode === 'mock-exam' ? 'mock-exam' as const : undefined

  const sectionId = formData.get('sectionId') as string | null
  const count = parseInt(formData.get('count') as string, 10)

  if (!mode && (!count || count < 1 || count > 200)) {
    throw new Error('Invalid question count')
  }

  const { sessionId } = await createSession({
    userId: session.user.id,
    sectionId: sectionId || undefined,
    count: count || 200,
    mode,
  })

  redirect(`/quiz/${sessionId}`)
}
```

- [ ] **Step 2: Type-check**

```powershell
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```powershell
git -C .. add lm-platform/app/quiz/new/actions.ts
git -C .. commit -m "feat: pass mode through startQuizAction"
```

---

## Task 5: UI — "Start Mock Exam" button

**Files:**
- Modify: `lm-platform/app/quiz/new/page.tsx`

- [ ] **Step 1: Add the mock exam form below the existing form**

Replace the full contents of `lm-platform/app/quiz/new/page.tsx`:

```tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { startQuizAction } from './actions'

export default async function NewQuizPage() {
  const session = await auth()
  if (!session) redirect('/api/auth/signin')

  const sections = await prisma.section.findMany({
    orderBy: { id: 'asc' },
    select: { id: true, name: true },
  })

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-sm">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-gray-900">Start a Quiz</h1>
          <p className="text-sm text-gray-500">Choose a section and question count</p>
        </div>

        <form action={startQuizAction} className="space-y-5">
          <div>
            <label htmlFor="sectionId" className="mb-1 block text-sm font-medium text-gray-700">
              Section
            </label>
            <select
              id="sectionId"
              name="sectionId"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All sections</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="count" className="mb-1 block text-sm font-medium text-gray-700">
              Number of questions
            </label>
            <input
              id="count"
              name="count"
              type="number"
              min={1}
              max={200}
              defaultValue={10}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Start Quiz
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs text-gray-400">
            <span className="bg-white px-2">or</span>
          </div>
        </div>

        <form action={startQuizAction}>
          <input type="hidden" name="mode" value="mock-exam" />
          <button
            type="submit"
            className="w-full rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Start Mock Exam
            <span className="ml-2 text-xs font-normal text-gray-400">200 questions · board-weighted</span>
          </button>
        </form>
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

Visit `http://localhost:3000/quiz/new`. Verify:
- Existing "Start Quiz" form works as before (pick a section, set a count, start).
- "Start Mock Exam" button creates a session and redirects to `/quiz/[sessionId]`.
- The resulting session has 200 questions.

- [ ] **Step 4: Commit**

```powershell
git -C .. add lm-platform/app/quiz/new/page.tsx
git -C .. commit -m "feat: add Start Mock Exam button to quiz config page"
```

---

## Done When

- [ ] `npm test` passes (5 tests green)
- [ ] "Start Quiz" flow unchanged
- [ ] "Start Mock Exam" creates a 200-question session
- [ ] Per-section breakdown in the DB matches the weight map (spot-check via admin `/admin/questions`)
