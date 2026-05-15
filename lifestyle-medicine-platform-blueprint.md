# Lifestyle Medicine Exam Platform — Production Architecture Blueprint

> **Based on real question bank data**: Section 05 — Nutrition Science Assessment and Prescription Guidelines  
> **Data summary**: 259 questions · 3 question types · 4 options per question (SBA) · section_id "05"  
> **Stack**: Next.js 15 · TypeScript · Prisma · PostgreSQL · Auth.js · Railway  

---

## 1. 🧠 SYSTEM OVERVIEW

### What Kind of System This Is

This is not a website with a quiz bolted on. It is a **domain-specific adaptive assessment engine** — the core data model is a structured clinical question with rich metadata, and every user interaction feeds a progress graph that shapes future question selection. The system's primary job is to make users aware of their knowledge gaps and systematically close them before the ACLM board exam.

From the real question file, three distinct question types exist:

| Type | Count | Nature |
|------|-------|--------|
| `General` | 101 | Direct clinical application questions |
| `Supplementary` | 105 | Deeper vignette-based reasoning questions |
| `Study-Tool Based` | 53 | Research study recall (PREDIMED, EPIC-Oxford, etc.) |

These types are **not cosmetic** — they drive quiz configuration, difficulty weighting, and revision mode logic.

### Core Domains

| Domain | Core Responsibility |
|--------|-------------------|
| **Questions** | Storage, import, tagging, FTS retrieval, type-aware selection |
| **Quiz** | Session orchestration, question selection, answer capture, scoring |
| **Users** | Identity, subscription tier, preferences |
| **Progress** | Per-question, per-section, per-type performance tracking |
| **Analytics** | Weak areas, performance trends, study recommendations |

### Design Philosophy

**Predictable over clever.** Every module does one obvious thing. Every file boundary is a grep. The LLM working on this codebase next week must be able to open three files and understand the full data flow. Complexity is the enemy of AI-assisted solo development.

---

## 2. 🏗️ ARCHITECTURE — NEXT.JS FULL-STACK MODULAR MONOLITH

### The Decision

**Architecture: Next.js 15 App Router as a Full-Stack Modular Monolith.**

One deployment unit. Strict internal module boundaries enforced by folder structure. React Server Components collapse the traditional frontend/backend divide. No separate API server, no message queues, no microservices.

**Why this, specifically:**
- Claude Code has trained on more Next.js + Prisma codebases than any other full-stack combination — it produces correct, idiomatic code with minimal correction
- `src/modules/` boundaries keep each feature's context small enough for a single LLM session to hold in mind
- Railway gives you a PostgreSQL database as a first-class addon — one `git push` deploys both
- You can extract a module into a separate service later if scale demands it; you cannot easily collapse microservices back into a monolith

### System Diagram

```
┌───────────────────────────────────────────────────────────┐
│                        BROWSER                            │
│                                                           │
│   Server Components (dashboard, review, progress)         │
│   Client Components (quiz engine, timer, answer buttons)  │
└────────────────────────┬──────────────────────────────────┘
                         │  HTTP + Server Actions
┌────────────────────────▼──────────────────────────────────┐
│              NEXT.JS 15 APP ROUTER (Railway)               │
│                                                           │
│  app/                                                     │
│  ├── (auth)/login              ← Auth.js pages            │
│  ├── dashboard/                ← RSC: analytics view      │
│  ├── quiz/new/                 ← Quiz configuration       │
│  ├── quiz/[sessionId]/         ← Client: quiz engine      │
│  └── quiz/[sessionId]/review/  ← RSC: session breakdown   │
│                                                           │
│  src/modules/                                             │
│  ├── questions/   service.ts + queries.ts + types.ts      │
│  ├── quiz/        service.ts + selection.ts + types.ts    │
│  ├── progress/    service.ts + aggregator.ts + types.ts   │
│  └── analytics/   service.ts + types.ts                   │
│                                                           │
│  app/api/                                                 │
│  ├── quiz/[sessionId]/answer/  route.ts                   │
│  └── quiz/[sessionId]/end/     route.ts                   │
└────────────────────────┬──────────────────────────────────┘
                         │  Prisma Client
              ┌──────────▼──────────┐
              │    PostgreSQL        │
              │    (Railway addon)   │
              └─────────────────────┘
```

### Layer Explanation

| Layer | What Lives Here | Why |
|-------|----------------|-----|
| **React Server Components** | Dashboard, review pages, progress views | Direct DB access, zero client-side JS, fast initial load |
| **Client Components** | Quiz engine, timer, answer buttons | Requires interactivity and immediate state updates |
| **Route Handlers** | Answer submission, session end | Validated, transactional mutations — not suitable for Server Actions |
| **Service Modules** | Business logic, all DB queries | Single source of truth per domain; testable in isolation |
| **Prisma** | All database access | Never write raw SQL in route handlers or components |

---

## 3. 🧩 BACKEND MODULE ARCHITECTURE

### Module: `questions`

**Responsibilities**: Store and retrieve the 259 (and growing) questions from your JSON files. Filter by `section_id`, `question_type`, exclude seen questions, support full-text search.

```
src/modules/questions/
├── service.ts      ← getQuestions(), getQuestionById(), getQuestionsBySection()
├── queries.ts      ← fat Prisma queries isolated here
└── types.ts        ← QuestionWithOptions, QuestionFilter
```

**Key function signatures:**
```typescript
// types.ts
export type QuestionFilter = {
  sectionId?: string;
  questionType?: 'General' | 'Supplementary' | 'Study-Tool Based';
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
}

// service.ts — what route handlers call
export async function getQuestions(filter: QuestionFilter): Promise<QuestionWithOptions[]>
export async function getQuestionById(id: string): Promise<QuestionWithOptions | null>
```

---

### Module: `quiz`

**Responsibilities**: Create sessions, manage question sequencing, receive answer submissions, compute correctness, delegate to progress module.

```
src/modules/quiz/
├── service.ts      ← createSession(), submitAnswer(), endSession()
├── selection.ts    ← selectQuestions() algorithm — pure function, testable
└── types.ts        ← CreateSessionInput, SubmitAnswerInput, SessionResult
```

**Question selection algorithm** (in `selection.ts`):
```typescript
// Pure function — no DB access. Takes candidate questions, returns ordered selection.
export function selectQuestions(
  candidates: QuestionWithOptions[],
  config: { count: number; weighting: 'uniform' | 'weak-areas-first' },
  userProgress: Map<string, number> // questionId → accuracy (0-1)
): QuestionWithOptions[]
```

This separation means Claude Code can rewrite the selection algorithm without touching the session management logic.

---

### Module: `progress`

**Responsibilities**: Record every answer against the user+question pair. Maintain a running accuracy score per question and per section. Never compute analytics — only store raw facts.

```
src/modules/progress/
├── service.ts      ← recordAnswer(), getQuestionProgress(), getSectionProgress()
└── aggregator.ts   ← rolling accuracy calculations, streak logic
```

**Key rule**: `progress.recordAnswer()` is called inside the quiz transaction. It must never fail silently.

---

### Module: `analytics`

**Responsibilities**: Read-only queries that transform progress data into user-facing insights. Weak areas, trends over time, section breakdown.

```
src/modules/analytics/
├── service.ts  ← getWeakAreas(), getPerformanceTrend(), getSectionBreakdown()
└── types.ts    ← WeakArea, PerformanceTrend, SectionScore
```

**Data flow rule**: Analytics never writes. Progress never reads from Analytics. This is a hard dependency direction: `quiz → progress (write) → analytics (read)`.

---

## 4. 🧬 DATABASE DESIGN

### Real Schema — Derived From Your Question File

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────
// CONTENT DOMAIN
// ─────────────────────────────────────────────

model Section {
  id        String     @id          // "05"
  name      String                  // "Nutrition Science Assessment and Prescription Guidelines"
  questions Question[]

  @@map("sections")
}

model Question {
  id             String           @id          // "1099", "00613" — from JSON
  questionText   String
  rationale      String
  pageReference  String
  questionType   QuestionType
  sectionId      String
  section        Section          @relation(fields: [sectionId], references: [id])
  options        QuestionOption[]
  sessionAnswers QuizAnswer[]
  userProgress   UserQuestionProgress[]

  // Full-text search vector (populated by trigger or on import)
  searchVector   Unsupported("tsvector")?

  @@index([sectionId])
  @@index([questionType])
  @@map("questions")
}

enum QuestionType {
  General
  Supplementary
  StudyToolBased   // maps to "Study-Tool Based" in JSON
}

model QuestionOption {
  id          String    @id @default(cuid())
  questionId  String
  question    Question  @relation(fields: [questionId], references: [id])
  key         String    // "A", "B", "C", "D"
  text        String    // "Broiling meat at 225°C for 20 minutes"
  isCorrect   Boolean

  @@unique([questionId, key])
  @@map("question_options")
}

// ─────────────────────────────────────────────
// USER DOMAIN
// ─────────────────────────────────────────────

model User {
  id             String    @id @default(cuid())
  email          String    @unique
  name           String?
  image          String?
  createdAt      DateTime  @default(now())
  subscriptionTier SubscriptionTier @default(Free)
  quizSessions   QuizSession[]
  userProgress   UserQuestionProgress[]

  @@map("users")
}

enum SubscriptionTier {
  Free
  Premium
}

// ─────────────────────────────────────────────
// QUIZ DOMAIN
// ─────────────────────────────────────────────

model QuizSession {
  id          String      @id @default(cuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id])
  sectionId   String?     // null = mixed sections
  questionType QuestionType? // null = mixed types
  totalCount  Int
  score       Int?        // null until session ends
  completedAt DateTime?
  createdAt   DateTime    @default(now())
  answers     QuizAnswer[]

  @@index([userId])
  @@map("quiz_sessions")
}

model QuizAnswer {
  id            String      @id @default(cuid())
  sessionId     String
  session       QuizSession @relation(fields: [sessionId], references: [id])
  questionId    String
  question      Question    @relation(fields: [questionId], references: [id])
  selectedKey   String      // "A", "B", "C", "D"
  isCorrect     Boolean
  timeSpentSec  Int?        // optional timer tracking
  answeredAt    DateTime    @default(now())
  questionOrder Int         // position in this session

  @@unique([sessionId, questionId])
  @@index([questionId])
  @@map("quiz_answers")
}

// ─────────────────────────────────────────────
// PROGRESS DOMAIN (hot table — frequent upserts)
// ─────────────────────────────────────────────

model UserQuestionProgress {
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  questionId    String
  question      Question @relation(fields: [questionId], references: [id])
  timesAnswered Int      @default(0)
  timesCorrect  Int      @default(0)
  lastAnsweredAt DateTime @default(now())

  // accuracy = timesCorrect / timesAnswered (computed on read, not stored)
  
  @@id([userId, questionId])
  @@index([userId])
  @@map("user_question_progress")
}
```

### Stored vs. Computed — The Critical Decision Table

| Data | Decision | Reason |
|------|----------|--------|
| Raw answer (key + correctness) | ✅ Stored in `quiz_answers` | Audit trail, replay, analytics |
| Per-question accuracy | ✅ Stored as `timesAnswered` + `timesCorrect` counters | Fast upsert; accuracy computed on read |
| Session score | ✅ Stored on `quiz_sessions.score` at completion | Historical record |
| Per-section accuracy | ❌ Computed: `GROUP BY q.sectionId` on `user_question_progress` | Derived data; <10ms with index |
| Weak areas list | ❌ Computed: filter where `timesCorrect/timesAnswered < 0.6` | Fast enough at current scale |
| Performance trend | ❌ Computed: windowed query on `quiz_answers.answeredAt` | Cacheable in Phase 3 |

---

## 5. ⚙️ TECHNOLOGY STACK — FINAL DECISION

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Framework** | Next.js 15 (App Router) | RSC + Server Actions. Largest LLM training corpus. |
| **Language** | TypeScript (strict mode) | Prisma generates types from schema. End-to-end safety. |
| **API style** | REST Route Handlers + Server Actions | REST for async mutations (answer submission). Server Actions for forms (quiz config). No GraphQL — over-powered for this domain, harder to scaffold incrementally. |
| **Database** | PostgreSQL 16 | ACID, JSONB, `tsvector` FTS, excellent Prisma support. |
| **ORM** | Prisma 5 | Schema-first, auto-typed, excellent migrations, Claude Code fluent. |
| **Auth** | Auth.js v5 (NextAuth) | Google OAuth + magic link email. Drop-in Next.js integration. |
| **Validation** | Zod | Shared between frontend forms and Route Handler body parsing. |
| **UI Components** | Tailwind CSS v4 + shadcn/ui | Pre-built accessible components. No design system from scratch. |
| **Charts** | Recharts | React-native, simple, excellent for progress line charts. |
| **Caching** | None in Phase 1 | Premature optimisation. Add `unstable_cache` in Phase 3. |
| **Email** | Resend | Simple API, generous free tier, Auth.js integration. |
| **Deployment** | Railway | One-click PostgreSQL, Git-based deploy, affordable solo pricing. |

### What Is NOT in the Stack (Intentional)

- ❌ **Redis** — Add only when analytics queries exceed 500ms. That won't happen before 5,000 users.
- ❌ **tRPC** — Excellent but adds a layer LLMs navigate inconsistently. REST + Zod is more predictable.
- ❌ **Supabase** — RLS adds cognitive overhead and vendor DB lock-in.
- ❌ **React Query** — Deferred to Phase 3. Server Components handle most data fetching without it.

---

## 6. 🖥️ FRONTEND ARCHITECTURE

### Framework: Next.js App Router with RSC/Client Split

**The split rule:** If a page only displays data, it's a Server Component. If it requires user interaction before a server round-trip (answer buttons, timer, immediate feedback), it's a Client Component. Exactly one page requires heavy client state: `quiz/[sessionId]/page.tsx`.

### Key Pages

| Route | Component Type | What It Does |
|-------|---------------|--------------|
| `/dashboard` | RSC | Progress overview, weak areas, recent sessions. Direct Prisma query in page.tsx. |
| `/quiz/new` | RSC + Server Action | Quiz config form: section filter, question type, count. Server Action creates session and redirects. |
| `/quiz/[sessionId]` | Client Component | Full quiz engine: answer buttons, explanation reveal, question counter, optional timer. |
| `/quiz/[sessionId]/review` | RSC | Post-quiz breakdown by section and type. Server-rendered, no JS needed. |
| `/progress` | RSC | Full analytics: per-section table, performance trend chart, question-level drill-down. |
| `/admin/questions` | RSC + Client | Question CRUD and bulk JSON import. Protected route. |

### Quiz Engine Component Architecture

```typescript
// app/quiz/[sessionId]/page.tsx — the only heavy Client Component
// State is managed with useReducer — no global state library

type QuizState = {
  questions: QuestionWithOptions[];
  currentIndex: number;
  selectedKey: string | null;
  showExplanation: boolean;
  answers: Map<string, { key: string; isCorrect: boolean }>;
  sessionComplete: boolean;
}

type QuizAction =
  | { type: 'SELECT_ANSWER'; key: string }
  | { type: 'CONFIRM_ANSWER'; isCorrect: boolean }
  | { type: 'NEXT_QUESTION' }
  | { type: 'COMPLETE_SESSION' }
```

All answer submissions go through `POST /api/quiz/[sessionId]/answer`. The component never writes directly to the database.

### Component File Structure

```
app/quiz/[sessionId]/
├── page.tsx              ← 'use client' — quiz engine
├── _components/
│   ├── QuestionCard.tsx  ← Question text + options
│   ├── OptionButton.tsx  ← Single answer button with state variants
│   ├── ExplanationPanel.tsx  ← Rationale + page reference reveal
│   ├── ProgressBar.tsx   ← X of N indicator
│   └── QuizTimer.tsx     ← Optional countdown (Phase 3)
└── review/
    └── page.tsx          ← RSC — post-quiz review
```

---

## 7. 🔄 CORE USER FLOWS

### Flow 1: Data Import (Phase 0 — Critical)

Your JSON file has a **data quality note**: 37 of 259 questions have `correct_answer` strings that don't exactly match any option text (e.g., truncated text, or just a bare letter like `"C"`). The import script must handle this by extracting the **answer key letter** from `correct_answer[0]` (which is always A, B, C, or D), not by string-matching the full text.

```typescript
// scripts/seed-questions.ts

function parseAnswerKey(correctAnswer: string): string {
  // Handles both "C) Full option text..." and bare "C"
  const key = correctAnswer.trim()[0].toUpperCase();
  if (!['A', 'B', 'C', 'D'].includes(key)) {
    throw new Error(`Cannot parse answer key from: "${correctAnswer}"`);
  }
  return key;
}

function parseOptionKey(optionText: string): string {
  // "A) Steaming vegetables..." → "A"
  return optionText.trim()[0].toUpperCase();
}

// Map JSON question_type to Prisma enum
const typeMap: Record<string, QuestionType> = {
  'General': 'General',
  'Supplementary': 'Supplementary',
  'Study-Tool Based': 'StudyToolBased',
}
```

---

### Flow 2: Starting a Quiz

```
User visits /quiz/new
  → Selects section: "05 — Nutrition Science"
  → Selects question type: "All" | "General" | "Supplementary" | "Study-Tool Based"
  → Selects count: 10 / 20 / 40
  → Clicks "Start Quiz"

Server Action: createQuizSession(userId, config)
  → quiz/service.createSession()
      ├── quiz/selection.selectQuestions(candidates, config, userProgress)
      │       Fetches questions from questions module
      │       If user has progress data: weights toward weak questions
      │       Returns ordered array of questionIds
      ├── INSERT quiz_sessions (userId, sectionId, questionType, totalCount)
      └── Returns sessionId
  → redirect(`/quiz/${sessionId}?q=0`)
```

---

### Flow 3: Answer Submission (Hot Path — Must Be Fast)

```
User clicks answer button (OptionButton component)
  → dispatch({ type: 'SELECT_ANSWER', key: 'C' })
  → Component shows selected state (instant, optimistic)
  → User clicks "Confirm"

POST /api/quiz/[sessionId]/answer
  Body: { questionId, selectedKey, timeSpentSec? }

Route Handler:
  1. Auth check (getServerSession)
  2. Zod validation of body
  3. quiz/service.submitAnswer(sessionId, userId, input)
       BEGIN TRANSACTION
         a. Verify question belongs to session
         b. Verify answer not already submitted
         c. Get correct option key from question_options
         d. isCorrect = (selectedKey === correctOptionKey)
         e. INSERT quiz_answers (sessionId, questionId, selectedKey, isCorrect, ...)
         f. progress/service.recordAnswer(userId, questionId, isCorrect)
                UPSERT user_question_progress
                  SET timesAnswered += 1
                  SET timesCorrect += (isCorrect ? 1 : 0)
                  SET lastAnsweredAt = NOW()
         g. Check if this was the last question
       COMMIT
  4. Return { isCorrect, correctKey, rationale, pageReference, isLastQuestion }

Client receives response:
  → dispatch({ type: 'CONFIRM_ANSWER', isCorrect })
  → ExplanationPanel appears with rationale and page reference
  → "Next Question" button becomes visible
```

---

### Flow 4: Session Completion

```
User clicks "Next" on final question:
  → Client detects isLastQuestion = true
  → POST /api/quiz/[sessionId]/end

Route Handler:
  quiz/service.endSession(sessionId, userId)
    ├── COUNT correct answers for session
    ├── UPDATE quiz_sessions SET score, completedAt
    └── Return { score, totalCount, sectionBreakdown }

Client:
  → dispatch({ type: 'COMPLETE_SESSION' })
  → Shows score summary screen
  → "Review Answers" → /quiz/[sessionId]/review
  → "New Quiz" → /quiz/new
```

---

## 8. 🧱 BUILD ORDER

### Phase 0 — Foundation (Week 1)

**Goal**: Auth + DB deployed. You can log in at your Railway URL.

```
1. npx create-next-app@latest lm-platform --typescript --tailwind --app
2. npm install prisma @prisma/client auth.js zod
3. Create prisma/schema.prisma (just User + Account tables)
4. railway login && railway new && railway add postgres
5. prisma migrate dev --name init
6. Set up Auth.js with Google provider
7. Create /dashboard page (protected, shows "Welcome [name]")
8. Deploy: git push → Railway auto-deploys
```

**Done when**: You can log in at your live Railway URL and see your name.

---

### Phase 1 — Question Data (Week 2)

**Goal**: All 259 questions imported. Admin can browse them.

```
1. Finalize questions + question_options + sections tables in schema
2. prisma migrate dev --name add-questions
3. Write scripts/seed-questions.ts using the parseAnswerKey() logic above
4. Run seed: npx tsx scripts/seed-questions.ts
5. Create questions/service.ts: getQuestions(), getQuestionById()
6. Create /admin/questions page: table of all questions
7. Verify all 259 questions display correctly, correct answers marked
```

**Done when**: Admin browses all 259 questions, correct answers are green.

---

### Phase 2 — Quiz Engine (Weeks 3–4)

**Goal**: Full quiz loop working end-to-end.

```
1. Add QuizSession + QuizAnswer tables to schema
2. prisma migrate dev --name add-quiz
3. Create quiz/selection.ts (uniform selection first — no weighting yet)
4. Create quiz/service.ts: createSession(), submitAnswer(), endSession()
5. Create /quiz/new page with Server Action
6. Build QuizEngine client component:
   a. QuestionCard
   b. OptionButton (normal → selected → correct/incorrect states)
   c. ExplanationPanel (hidden → reveal on confirmation)
   d. ProgressBar
7. Create POST /api/quiz/[sessionId]/answer route handler
8. Create POST /api/quiz/[sessionId]/end route handler
9. Create /quiz/[sessionId]/review RSC page
```

**Done when**: User completes a 10-question quiz and sees a scored review.

---

### Phase 3 — Progress & Analytics (Week 5)

**Goal**: Dashboard shows real data. Weak areas identified.

```
1. Add UserQuestionProgress table to schema
2. Wire progress/service.recordAnswer() into the answer submission transaction
3. Create analytics/service.ts:
   a. getWeakAreas() — questions with accuracy < 60%
   b. getPerformanceTrend() — correct% by session over last 10 sessions
   c. getSectionBreakdown() — accuracy per section
4. Build /dashboard with three panels:
   a. KPI row: total questions answered, overall accuracy, sessions this week
   b. Performance trend line chart (Recharts)
   c. Weak areas list (lowest accuracy questions)
5. Update quiz/selection.ts to weight toward weak areas
```

**Done when**: Returning user sees personalised weak areas and performance chart.

---

### Phase 4 — Subscriptions (Week 6)

**Goal**: Stripe integration. Free tier capped at 20 questions/day.

```
1. npm install @stripe/stripe-js stripe
2. Add subscriptionTier to User model
3. Create /api/stripe/webhook route handler
4. Create /pricing page
5. Gate /quiz/new: check daily question count for Free users
6. Add upgrade prompt in UI when free limit reached
```

**Done when**: A real payment unlocks Premium access.

---

### Phase 5 — Polish (Weeks 7–8)

**Goal**: Retention features that make the platform feel complete.

```
1. Timed mode: add timer to quiz engine (QuizTimer component)
2. Revision mode: quiz only previously-answered-wrong questions
3. Study-Tool Based mode: dedicated revision sessions for key studies
4. Question flag: users can mark questions for review
5. Email digest: weekly progress email via Resend
6. Mobile responsive QA across all pages
```

**Done when**: These features pass manual testing. Ship as v1.0.

---

## 9. ⚖️ TRADE-OFFS

### Intentionally NOT Included

| Excluded | Reason | When to Add |
|----------|--------|-------------|
| Spaced repetition (SM-2) | Adds state complexity, deferred | Phase 6, after validating user engagement |
| Leaderboards | Multiplies user perception concerns | Phase 6 |
| AI-generated explanations | Question content is fixed/authoritative | Never — exam prep needs source-backed rationale |
| Native mobile app | Web is sufficient; Capacitor possible later | Post-10k users |
| WebSockets (real-time quiz) | Not needed for solo exam prep | Only if collaborative features added |
| Redis | PostgreSQL handles current scale | Add at 5k+ concurrent users |
| Read replica | Not needed under 10k users | Add when analytics queries exceed 200ms |

### What Changes at Scale

| Threshold | What to Add |
|-----------|------------|
| 1k users | `unstable_cache` on analytics queries |
| 5k users | PgBouncer connection pooling |
| 10k users | Materialised views for analytics, Redis for session caching |
| 50k users | Read replica, background job queue (BullMQ) |

None of these changes require rewriting the application. They are localised additions to the module that needs them.

---

## 10. 🤖 AI-ASSISTED DEVELOPMENT STRATEGY

### The Six Rules

**Rule 1: One file, one responsibility.** Service files cap at 200 lines. When they grow beyond that, split into `service.ts` + `queries.ts` or create a sub-service. Predictable filenames are LLM navigational affordances.

**Rule 2: Types as contracts, written first.** Write `types.ts` before the service. Paste it at the top of every implementation prompt. Claude Code conforms to your contracts rather than inventing its own.

**Rule 3: Prisma schema in every DB prompt.** Paste the relevant schema tables at the top of every prompt that touches the database. Paste only the tables needed — not the full schema. Claude Code generates accurate, non-hallucinated queries when it can see the schema.

**Rule 4: Small prompts, incremental commits.** Never ask Claude Code to "build the quiz module." Ask it to "implement `submitAnswer` in `src/modules/quiz/service.ts` given these types." Commit after every working function.

**Rule 5: Test skeletons as specifications.** A test file describing `submitAnswer` behaviour, pasted alongside the types, is a more precise spec than prose. Claude Code targets the tests.

**Rule 6: One module per session.** If shipping a feature requires editing three modules at once, the module boundary is wrong. Fix the boundary first. If it genuinely requires cross-module work, paste all three `types.ts` files as context.

---

### The Standard Prompt Template

Use this shape for every implementation task with Claude Code:

```
CONTEXT:
Building [feature] for a Lifestyle Medicine exam prep platform.
Stack: Next.js 15, TypeScript strict, Prisma, PostgreSQL.

SCHEMA (relevant tables only):
[paste 2-4 Prisma model blocks]

TYPES (paste types.ts):
[paste the full types.ts for the module]

EXISTING CODE (if modifying):
[paste the current service.ts function]

TASK:
Implement [specific function name] in src/modules/[module]/service.ts.

REQUIREMENTS (numbered, max 5):
1. ...
2. ...
3. ...

CONSTRAINTS:
- Do NOT modify other files
- Do NOT import from other modules except: [list allowed]
- Use Prisma transactions for writes that touch multiple tables
```

This keeps Claude Code's context window focused, prevents scope creep, and produces a reviewable, committable output in every session.

---

### Managing the Question Data Import

The most complex early task is the seed script. Below is the complete logic:

```typescript
// scripts/seed-questions.ts
import { PrismaClient, QuestionType } from '@prisma/client'
import data from '../05.-Nutrition-Science-Assessment-and-Prescription-Guidelines.json'

const prisma = new PrismaClient()

const QUESTION_TYPE_MAP: Record<string, QuestionType> = {
  'General': QuestionType.General,
  'Supplementary': QuestionType.Supplementary,
  'Study-Tool Based': QuestionType.StudyToolBased,
}

function parseAnswerKey(correctAnswer: string): string {
  // Handles: "C) Full text..." and bare "C"
  // 37 of 259 questions have bare letters — this covers both cases
  const key = correctAnswer.trim()[0].toUpperCase()
  if (!['A', 'B', 'C', 'D'].includes(key)) {
    throw new Error(`Unparseable answer key: "${correctAnswer}"`)
  }
  return key
}

async function main() {
  // Upsert section
  await prisma.section.upsert({
    where: { id: '05' },
    create: { id: '05', name: 'Nutrition Science Assessment and Prescription Guidelines' },
    update: {},
  })

  let imported = 0, skipped = 0

  for (const q of data) {
    const correctKey = parseAnswerKey(q.correct_answer)
    const questionType = QUESTION_TYPE_MAP[q.question_type]

    if (!questionType) {
      console.warn(`Unknown type "${q.question_type}" for ID ${q.question_id}`)
      skipped++
      continue
    }

    await prisma.question.upsert({
      where: { id: q.question_id },
      create: {
        id: q.question_id,
        questionText: q.question_text,
        rationale: q.rationale,
        pageReference: q.page_reference,
        questionType,
        sectionId: q.section_id,
        options: {
          create: q.options.map(opt => ({
            key: opt.trim()[0].toUpperCase(),  // "A", "B", "C", "D"
            text: opt.replace(/^[A-D]\)\s*/, '').trim(), // strip "A) " prefix
            isCorrect: opt.trim()[0].toUpperCase() === correctKey,
          }))
        }
      },
      update: {}, // Don't overwrite existing questions
    })
    imported++
  }

  console.log(`✅ Imported: ${imported}, Skipped: ${skipped}`)
}

main().finally(() => prisma.$disconnect())
```

Run with: `npx tsx scripts/seed-questions.ts`

---

### Session-by-Session Build Log

Use this as your living checklist. Each row is one Claude Code session:

| Session | File(s) to touch | Input to Claude | Done when |
|---------|-----------------|-----------------|-----------|
| 1 | `prisma/schema.prisma` | "Add Question + QuestionOption models per these types" | Migration runs clean |
| 2 | `scripts/seed-questions.ts` | Paste the template above | 259 questions in DB |
| 3 | `src/modules/questions/service.ts` | "Implement getQuestions(filter)" | Returns filtered questions |
| 4 | `src/modules/quiz/service.ts` | "Implement createSession()" | Session row created |
| 5 | `app/quiz/[sessionId]/page.tsx` | "Build quiz engine with useReducer" | Answers can be selected |
| 6 | `app/api/quiz/[sessionId]/answer/route.ts` | "Implement answer submission" | isCorrect returned |
| 7 | `src/modules/progress/service.ts` | "Implement recordAnswer() upsert" | Progress table updates |
| 8 | `src/modules/analytics/service.ts` | "Implement getWeakAreas()" | Dashboard shows weak Qs |

Each session: one commit, one deployed test, one check. Never start session N+1 until session N passes manual testing.

---

*This blueprint is grounded in your real question data (259 questions, Section 05, three question types). Every schema field maps to an actual JSON key. Every import edge case (the 37 truncated correct_answer values) is handled explicitly. Build it phase by phase — Phase 0 to Phase 2 delivers a working, deployable product.*
