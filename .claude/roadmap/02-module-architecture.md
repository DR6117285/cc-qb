# Module Architecture

## Folder Structure

```
src/
└── modules/
    ├── questions/
    │   ├── service.ts      ← getQuestions(), getQuestionById()
    │   ├── queries.ts      ← Prisma queries isolated here
    │   └── types.ts        ← QuestionWithOptions, QuestionFilter
    ├── quiz/
    │   ├── service.ts      ← createSession(), submitAnswer(), endSession()
    │   ├── selection.ts    ← selectQuestions() — pure function, no DB
    │   └── types.ts        ← CreateSessionInput, SubmitAnswerInput
    ├── progress/
    │   ├── service.ts      ← recordAnswer(), getQuestionProgress()
    │   └── aggregator.ts   ← rolling accuracy calculations
    └── analytics/
        ├── service.ts      ← getWeakAreas(), getPerformanceTrend()
        └── types.ts        ← WeakArea, PerformanceTrend, SectionScore
```

## Key Types (write these first before any service)

```typescript
// modules/questions/types.ts
export type QuestionFilter = {
  sectionId?: string;
  questionType?: 'General' | 'Supplementary' | 'StudyToolBased';
  excludeIds?: string[];
  limit?: number;
}

export type QuestionWithOptions = {
  id: string;
  questionText: string;
  options: { id: string; key: string; text: string }[];
  sectionId: string;
  questionType: string;
  pageReference: string;
  rationale: string;
}
```

## Dependency Direction (MANDATORY)

```
route handler / server action
        ↓
    service.ts
        ↓
    queries.ts (or aggregator.ts)
        ↓
    Prisma client
```

Rules:
- Services call queries, never Prisma directly
- No cross-module DB access
- Analytics only reads — never writes
- Progress only writes — never reads from Analytics

## Data Flow: Quiz → Progress → Analytics

```
quiz/service.submitAnswer()
  → progress/service.recordAnswer()   [WRITE: upsert user_question_progress]

analytics/service.getWeakAreas()
  → reads user_question_progress      [READ only]
```

## App Router Pages

| Route | Type | What |
|-------|------|------|
| `/dashboard` | RSC | Analytics + progress summary |
| `/quiz/new` | RSC + Server Action | Quiz config form |
| `/quiz/[sessionId]` | Client Component | Quiz engine |
| `/quiz/[sessionId]/review` | RSC | Post-quiz breakdown |
| `/progress` | RSC | Full analytics, charts |
| `/admin/questions` | RSC | Browse all 916 questions |

## API Routes

```
app/api/
├── quiz/[sessionId]/answer/route.ts   ← POST: submit answer
└── quiz/[sessionId]/end/route.ts      ← POST: end session
```

Server Actions handle: quiz config form submission (createSession + redirect).
Route Handlers handle: answer submission (needs validated transaction).
