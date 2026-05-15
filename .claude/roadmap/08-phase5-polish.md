# Phase 5 — Polish (v1.0)

**Goal**: Retention features. Mobile-responsive. Ship as v1.0.
**Time estimate**: Weeks 7–8

## Features

### Timed Mode
- Add `QuizTimer.tsx` client component to quiz engine
- Config option on `/quiz/new`: "Timed (90s per question)" toggle
- Timer state in `useReducer` — auto-advance or lock answer on expire
- Store `timeSpentSec` in `QuizAnswer` (already in schema)

### Revision Mode
- New quiz type: "Revise wrong answers"
- `selection.ts`: filter candidates to questions where `timesCorrect = 0` or last answer was wrong
- Surface as a button on dashboard: "Revise weak questions"

### Study-Tool Based Mode
- Dedicated quiz session filtered to `questionType = StudyToolBased`
- These cover named studies (PREDIMED, EPIC-Oxford, DPP etc.)
- Surface as "Study Recall" mode on `/quiz/new`

### Question Flag
- Add `flagged Boolean @default(false)` to `UserQuestionProgress`
- Flag button on quiz engine — POST to mark/unmark
- "Flagged questions" filter on `/quiz/new`

### Weekly Email Digest
- Resend integration
- Cron job (Vercel or Railway): runs Monday 08:00
- Email: questions answered this week, accuracy trend, top 3 weak areas
- Template: React Email component

### Mobile QA Checklist
- [ ] Quiz engine usable on 375px viewport
- [ ] OptionButton tap targets ≥ 44px
- [ ] ExplanationPanel scrollable on small screens
- [ ] Dashboard charts readable on mobile (consider hiding trend chart, keeping KPI row)
- [ ] `/quiz/new` form usable on mobile

## Done When

- [ ] Timed mode completes a quiz with timer visible
- [ ] Revision mode correctly serves only previously-wrong questions
- [ ] Study-Tool Based mode works as filtered quiz
- [ ] Weekly email sends in test mode
- [ ] All pages pass mobile viewport QA
- [ ] Lighthouse performance score ≥ 85 on dashboard and quiz pages
