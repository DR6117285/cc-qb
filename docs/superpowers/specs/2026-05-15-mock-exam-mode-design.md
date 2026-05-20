# Mock Exam Mode — Design Spec

**Date:** 2026-05-15  
**Status:** Approved for implementation

---

## Goal

Add a "Mock Exam" option to the quiz flow that generates a 200-question session weighted by the real IBLM board exam's section distribution — without touching the existing quiz path.

---

## Section Weight Map

Static constant. Keyed by `sectionId` (the DB `sections.id` values, which are zero-padded strings `"01"`–`"10"`).

| sectionId | Section | % | Questions |
|-----------|---------|---|-----------|
| `"01"` | Introduction to Lifestyle Medicine | 4% | 8 |
| `"02"` | Fundamentals of Health Behavior Change | 10% | 20 |
| `"03"` | Key Clinical Processes in Lifestyle Medicine | 8% | 16 |
| `"04"` | The Role of the Practitioner's Health and Community Advocacy | 4% | 8 |
| `"05"` | Nutrition Science Assessment and Prescription Guidelines | 26% | 52 |
| `"06"` | Physical Activity Science and Prescription | 14% | 28 |
| `"07"` | Emotional and Mental Health Assessment and Interventions | 10% | 20 |
| `"08"` | Sleep Health Science and Interventions | 8% | 16 |
| `"09"` | Managing Tobacco Cessation and other Toxic Exposures | 8% | 16 |
| `"10"` | The Role of Connectedness and Positive Psychology | 8% | 16 |

Total: 200 questions.

This constant lives in `modules/quiz/selection.ts` alongside the selection logic.

---

## New Pure Function: `selectWeightedQuestions`

Added to `modules/quiz/selection.ts`.

```ts
export function selectWeightedQuestions(
  candidates: QuestionWithOptions[],
  weights: Record<string, number>,  // sectionId → count
): QuestionWithOptions[]
```

**Behaviour:**
1. Group `candidates` by `sectionId`.
2. For each entry in `weights`, shuffle that section's pool and take the required count.
3. Throw if a section has fewer candidates than required (guards against future data issues).
4. Concatenate all picked questions, shuffle the combined array (so questions aren't grouped by section during the quiz).
5. Return the shuffled 200-question array.

The existing `selectQuestions` (uniform random) is untouched.

---

## Service Layer

`modules/quiz/service.ts` — `CreateSessionInput` gains an optional field:

```ts
export type CreateSessionInput = {
  userId: string
  sectionId?: string
  count: number
  mode?: 'mock-exam'   // new
}
```

In `createSession`, before the existing uniform path:

```ts
if (input.mode === 'mock-exam') {
  const rawQuestions = await prisma.question.findMany({ select: { ... } })
  const candidates = rawQuestions.map(...)
  const selected = selectWeightedQuestions(candidates, MOCK_EXAM_WEIGHTS)
  const session = await repo.createSession({ userId, questionIds: selected.map(q => q.id) })
  return { sessionId: session.id }
}
```

When `mode === 'mock-exam'`: `sectionId` and `count` from input are ignored. Always produces 200 questions. The existing path (uniform selection) runs unchanged when `mode` is absent.

---

## Server Action

`app/quiz/new/actions.ts` — reads `mode` from `formData`:

```ts
const mode = formData.get('mode') === 'mock-exam' ? 'mock-exam' : undefined
const { sessionId } = await createSession({ userId, sectionId, count, mode })
```

---

## UI

`app/quiz/new/page.tsx` — adds a "Start Mock Exam" button below the existing form:

- Renders as a separate `<form action={startQuizAction}>` (or same form with conditional hidden inputs).
- Contains a hidden `<input name="mode" value="mock-exam" />`.
- No section/count inputs needed for mock exam — the button is self-contained.
- Existing "Start Quiz" form and its inputs are unchanged.

---

## Files Changed

| File | Change |
|------|--------|
| `modules/quiz/selection.ts` | Add `MOCK_EXAM_WEIGHTS` constant + `selectWeightedQuestions` function |
| `modules/quiz/service.ts` | Add `mode?` to `CreateSessionInput`; add mock-exam branch in `createSession` |
| `app/quiz/new/actions.ts` | Read `mode` from `formData`, pass to `createSession` |
| `app/quiz/new/page.tsx` | Add "Start Mock Exam" button with hidden `mode` input |

No schema changes. No new routes. No new DB models.

---

## Error Handling

- If a section pool is smaller than required: throw `Error('Not enough questions in section ${sectionId}: need ${required}, have ${available}')`. This protects against future data drift.
- Invalid `mode` values from the form are treated as `undefined` (falls through to existing path).

---

## Out of Scope

- Timed exam mode
- Per-section score breakdown on the results page (Phase 3)
- Editing the weight percentages via admin UI
