# Phase 2 — Quiz Engine

**Goal**: Full quiz loop working end-to-end (pick → quiz → scored review).
**Time estimate**: Weeks 3–4

## Migration

```bash
npx prisma migrate dev --name add-quiz
# adds: QuizSession, QuizAnswer, UserQuestionProgress
```

## Build Order (one session each)

### Session 1 — Question Selection (pure function)

File: `src/modules/quiz/selection.ts`

```typescript
export function selectQuestions(
  candidates: QuestionWithOptions[],
  config: { count: number; weighting: 'uniform' | 'weak-areas-first' },
  userProgress: Map<string, number>  // questionId → accuracy 0–1
): QuestionWithOptions[]
```

Start with `uniform` weighting (random shuffle, take N). Weak-areas-first comes in Phase 3.

### Session 2 — Quiz Service

File: `src/modules/quiz/service.ts`

```typescript
createSession(userId: string, config: CreateSessionInput): Promise<{ sessionId: string }>
submitAnswer(sessionId: string, userId: string, input: SubmitAnswerInput): Promise<AnswerResult>
endSession(sessionId: string, userId: string): Promise<SessionResult>
```

`submitAnswer` runs a Prisma transaction:
1. Verify question belongs to session (no cheating)
2. Check not already answered
3. Get correct key from `question_options`
4. `isCorrect = selectedKey === correctKey`
5. INSERT quiz_answer
6. UPSERT user_question_progress (timesAnswered+1, timesCorrect+isCorrect)
7. Return `{ isCorrect, correctKey, rationale, pageReference, isLastQuestion }`

### Session 3 — Quiz Config Page + Server Action

File: `app/quiz/new/page.tsx`

Form inputs:
- Section (dropdown: All + 10 sections)
- Question type (All / General / Supplementary / Study-Tool Based)
- Count (10 / 20 / 40)

Server Action calls `quiz/service.createSession()` → redirects to `/quiz/[sessionId]`

### Session 4 — Quiz Engine Client Component

File: `app/quiz/[sessionId]/page.tsx` (`'use client'`)

State (useReducer):
```typescript
type QuizState = {
  questions: QuestionWithOptions[]
  currentIndex: number
  selectedKey: string | null
  showExplanation: boolean
  answers: Map<string, { key: string; isCorrect: boolean }>
  sessionComplete: boolean
}
```

Sub-components in `_components/`:
- `QuestionCard.tsx` — question text + 4 option buttons
- `OptionButton.tsx` — states: default / selected / correct / incorrect
- `ExplanationPanel.tsx` — hidden until answer confirmed; shows rationale + page ref
- `ProgressBar.tsx` — "Question X of N"

Flow:
1. Click option → SELECT_ANSWER (optimistic highlight)
2. Click "Confirm" → POST `/api/quiz/[sessionId]/answer`
3. Response reveals correct/incorrect + explanation
4. Click "Next" → advance; if last question → POST `/api/quiz/[sessionId]/end`

### Session 5 — API Route Handlers

`app/api/quiz/[sessionId]/answer/route.ts`:
- Auth check
- Zod validate body: `{ questionId, selectedKey, timeSpentSec? }`
- Call `quiz/service.submitAnswer()`
- Return result

`app/api/quiz/[sessionId]/end/route.ts`:
- Auth check
- Call `quiz/service.endSession()`
- Return `{ score, totalCount }`

### Session 6 — Review Page

File: `app/quiz/[sessionId]/review/page.tsx` (RSC)

Shows:
- Overall score (X/N, %)
- Each question with: user's answer, correct answer, rationale
- "New Quiz" button → `/quiz/new`

## Done When

- [ ] Complete a 10-question quiz start to finish
- [ ] Correct/incorrect clearly shown after each answer
- [ ] Explanation visible after confirming answer
- [ ] Review page shows full breakdown
- [ ] Score saved in `quiz_sessions` table
- [ ] `user_question_progress` rows created/updated
