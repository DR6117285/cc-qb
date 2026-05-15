# AI-Assisted Development Strategy

## The Six Rules

1. **One file, one responsibility.** Service files cap at 200 lines. Predictable filenames are LLM navigational affordances.
2. **Types as contracts, written first.** Write `types.ts` before the service. Paste it at the top of every implementation prompt.
3. **Prisma schema in every DB prompt.** Paste only the relevant tables — not the full schema.
4. **Small prompts, incremental commits.** Never ask Claude to "build the quiz module." Ask it to "implement `submitAnswer` in `src/modules/quiz/service.ts` given these types."
5. **Test skeletons as specifications.** A test file describing expected behaviour is more precise than prose.
6. **One module per session.** If shipping requires editing three modules, the boundary is wrong.

---

## Standard Prompt Template

Copy-paste this shape for every implementation task:

```
CONTEXT:
Building [feature] for a Lifestyle Medicine exam prep platform (Pastest-style).
Stack: Next.js 15, TypeScript strict, Prisma, PostgreSQL.
916 questions, 10 sections, 3 question types (General / Supplementary / Study-Tool Based).

SCHEMA (relevant tables only):
[paste 2–4 Prisma model blocks from 01-database-schema.md]

TYPES (paste types.ts for the module):
[paste the full types.ts]

EXISTING CODE (if modifying):
[paste the current function]

TASK:
Implement [specific function name] in src/modules/[module]/service.ts.

REQUIREMENTS (max 5):
1. ...
2. ...

CONSTRAINTS:
- Do NOT modify other files
- Do NOT import from modules except: [list]
- Use Prisma transactions for writes touching multiple tables
```

---

## Session-by-Session Build Log

| # | File(s) | Claude prompt focus | Done when |
|---|---------|--------------------|----|
| 1 | `prisma/schema.prisma` | Add Question + QuestionOption models | Migration runs clean |
| 2 | `scripts/seed-questions.ts` | Import 916 questions from `data/*.json` | 916 rows in DB, no duplicates |
| 3 | `src/modules/questions/service.ts` | Implement `getQuestions(filter)` | Returns filtered questions |
| 4 | `src/modules/quiz/selection.ts` | Implement `selectQuestions()` pure function | Unit test passes |
| 5 | `src/modules/quiz/service.ts` | Implement `createSession()` | Session row created |
| 6 | `app/quiz/new/page.tsx` + Server Action | Quiz config form | Redirects to session |
| 7 | `app/quiz/[sessionId]/page.tsx` | Quiz engine with `useReducer` | Answers selectable |
| 8 | `app/api/quiz/[sessionId]/answer/route.ts` | Answer submission + transaction | `isCorrect` returned |
| 9 | `src/modules/progress/service.ts` | `recordAnswer()` upsert | Progress table updates |
| 10 | `app/quiz/[sessionId]/review/page.tsx` | Post-quiz review RSC | Breakdown renders |
| 11 | `src/modules/analytics/service.ts` | `getWeakAreas()`, `getSectionBreakdown()` | Dashboard shows real data |
| 12 | `app/dashboard/page.tsx` | Dashboard with charts | Trend chart renders |

Each session: one commit, one manual test, one deploy check. Never start N+1 until N passes.

---

## What NOT to Add (Until Explicitly Needed)

| Feature | Trigger |
|---------|---------|
| Redis | Analytics queries exceed 500ms |
| React Query | Server Components insufficient for interactivity |
| WebSockets | Collaborative/multiplayer feature requested |
| DataLoader | N+1 queries measured in profiling |
| Background job queue | Email/cron needs reliability beyond Railway cron |
| Read replica | Analytics queries exceed 200ms at 10k+ users |
