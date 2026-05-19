# Mock Exam — Candidate Types, Scaled Weights & Timed Sessions

**Date:** 2026-05-19

## Goal

Extend the mock exam feature to support three IBLM candidate types, each with a different question count drawn from proportionally scaled section weights, and a 4-hour timed session with a snapshot-and-continue UX at expiry.

---

## Candidate Types

| Type | Questions | Time |
|---|---|---|
| Physician (MD/DO) | 150 | 4 hours |
| Professional (Masters/PhD) | 120 | 4 hours |
| Practitioner (Degree level) | 120 | 4 hours |

---

## Data Model Changes

### `User`

Add a new nullable enum field. Nullable so existing users are not broken.

```prisma
enum CandidateType {
  Physician
  Professional
  Practitioner
}

model User {
  ...
  candidateType  CandidateType?
}
```

Default behaviour when `candidateType` is null: treat as Physician (150 questions).

### `QuizSession`

Add three nullable fields. Only populated for mock exam sessions.

```prisma
model QuizSession {
  ...
  timeLimitSec  Int?
  timedScore    Int?
  timedAt       DateTime?
}
```

- `timeLimitSec` — set at session creation (14400 = 4 hours). Stored on the session so it is immune to future profile changes.
- `timedScore` — count of correct answers at the moment the timer expired.
- `timedAt` — timestamp when the snapshot was taken.

---

## Question Selection

### Canonical weights

`MOCK_EXAM_WEIGHTS` remains the source of truth, summing to 200 across 10 sections.

### Scaling

A pure helper `scaleWeights(weights: Record<string, number>, target: number): Record<string, number>` proportionally scales the weights to `target` (150 or 120). Rounding is handled so the output sums exactly to `target` (largest-remainder method).

`selectWeightedQuestions` is unchanged.

### `createSession` (mock-exam branch)

1. Fetch `candidateType` from User record.
2. Derive `target`: Physician → 150, Professional/Practitioner → 120.
3. Call `scaleWeights(MOCK_EXAM_WEIGHTS, target)`.
4. Call `selectWeightedQuestions(candidates, scaledWeights)`.
5. Create session with `timeLimitSec: 14400`.

---

## Timer & Snapshot

### Client-side countdown

On the quiz page, when `session.timeLimitSec` is present:

- Compute `expiresAt = new Date(session.createdAt).getTime() + session.timeLimitSec * 1000`.
- Run a `useEffect` interval (every second) counting down.
- Display a visible countdown in the quiz header (e.g. `3:47:22 remaining`).
- When countdown reaches zero, call the `snapshotTimedScore` server action.

### `snapshotTimedScore` server action

- Counts correct answers for the session so far.
- Writes `timedScore` and `timedAt` to the session.
- Does NOT end the session or change its status.
- Returns `{ timedScore, totalAnswered, totalCount }`.

### Time-up modal

After snapshot, a modal is shown:

> **Time's up.**
> You answered X of Y questions and scored Z correctly.
> Would you like to continue and finish the remaining questions? (No timer)

- **Continue** → modal closes, timer UI hidden, session continues normally.
- **End exam** → calls `endSession`, redirects to results.

### Results page

When `timedScore` is present on the session, show two score rows:

- Timed score: Z / N (answers within 4 hours)
- Final score: F / N (all answers)

---

## Profile — Candidate Type

A profile/settings page where users can view and update their `candidateType`.

- Dropdown: Physician (MD/DO) / Professional (Masters/PhD) / Practitioner (Degree level)
- Saved via a server action.
- Displayed on the mock exam button as a reminder: *"Start Mock Exam (150 questions · 4 hours)"*

---

## Layers Affected

| Layer | Change |
|---|---|
| `schema.prisma` | Add `CandidateType` enum, `candidateType` on User, three fields on QuizSession |
| `modules/quiz/selection.ts` | Add `scaleWeights` helper |
| `modules/quiz/service.ts` | Update `createSession` mock-exam branch; add `snapshotTimedScore` |
| `modules/quiz/repository.ts` | Add `snapshotTimedScore` write; `findSession` must return new fields |
| `modules/quiz/types.ts` | Add `timeLimitSec`, `timedScore`, `timedAt` to session types |
| `app/quiz/new/page.tsx` | Show question count + time on mock exam button based on user's candidate type |
| `app/quiz/[sessionId]/page.tsx` | Add countdown timer, time-up modal |
| `app/quiz/[sessionId]/actions.ts` | Add `snapshotTimedScore` server action |
| `app/profile/page.tsx` | New page — candidate type selector |
| `app/profile/actions.ts` | New file — `updateCandidateType` server action |

---

## Out of Scope

- Per-section timer breakdown
- Server-side timer enforcement (client timer is sufficient for a study tool)
- Notifications or emails on expiry
