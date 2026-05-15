# Database Schema — Prisma

Full `prisma/schema.prisma`. Deploy incrementally: content tables first, then quiz, then progress.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────
// CONTENT DOMAIN
// ─────────────────────────────

model Section {
  id        String     @id          // "01"–"10"
  name      String                  // "Introduction to Lifestyle Medicine"
  questions Question[]

  @@map("sections")
}

model Tag {
  id        Int           @id @default(autoincrement())
  slug      String        @unique    // "diabetes", "planetary-health"
  label     String                   // "Diabetes" (human-readable display name)
  questions QuestionTag[]

  @@map("tags")
}

model QuestionTag {
  questionId  String
  tagId       Int
  question    Question  @relation(fields: [questionId], references: [id])
  tag         Tag       @relation(fields: [tagId], references: [id])

  @@id([questionId, tagId])
  @@map("question_tags")
}

model Question {
  id             String           @id          // "00001" — from JSON question_id
  questionText   String
  rationale      String
  pageReference  String?                       // nullable — not all questions have one
  questionType   QuestionType
  sectionId      String
  section        Section          @relation(fields: [sectionId], references: [id])
  options        Json                          // [{"key":"A","text":"...","isCorrect":false}, ...]
  tags           QuestionTag[]
  sourceFile     String                        // e.g. "General - 1. Introduction to Lifestyle Medicine.json"
  sessionAnswers QuizAnswer[]
  userProgress   UserQuestionProgress[]

  @@index([sectionId])
  @@index([questionType])
  @@map("questions")
}

enum QuestionType {
  GENERAL
  SUPPLEMENTARY       // "From Board Review Notes" files
  STUDY_TOOL_BASED
}


// ─────────────────────────────
// USER DOMAIN
// ─────────────────────────────

model User {
  id               String           @id @default(cuid())
  email            String           @unique
  name             String?
  image            String?
  createdAt        DateTime         @default(now())
  subscriptionTier SubscriptionTier @default(Free)
  quizSessions     QuizSession[]
  userProgress     UserQuestionProgress[]

  @@map("users")
}

enum SubscriptionTier {
  Free
  Premium
}

// ─────────────────────────────
// QUIZ DOMAIN
// ─────────────────────────────

model QuizSession {
  id           String        @id @default(cuid())
  userId       String
  user         User          @relation(fields: [userId], references: [id])
  sectionId    String?       // null = mixed sections
  questionType QuestionType? // null = mixed types
  totalCount   Int
  score        Int?          // null until session ends
  completedAt  DateTime?
  createdAt    DateTime      @default(now())
  answers      QuizAnswer[]

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
  timeSpentSec  Int?
  answeredAt    DateTime    @default(now())
  questionOrder Int

  @@unique([sessionId, questionId])
  @@index([questionId])
  @@map("quiz_answers")
}

// ─────────────────────────────
// PROGRESS DOMAIN
// ─────────────────────────────

model UserQuestionProgress {
  userId         String
  user           User     @relation(fields: [userId], references: [id])
  questionId     String
  question       Question @relation(fields: [questionId], references: [id])
  timesAnswered  Int      @default(0)
  timesCorrect   Int      @default(0)
  lastAnsweredAt DateTime @default(now())

  // accuracy = timesCorrect / timesAnswered — computed on read, not stored

  @@id([userId, questionId])
  @@index([userId])
  @@map("user_question_progress")
}
```

## Migration Strategy

Build in 3 migrations:

1. `init` — User + Account (Auth.js needs these)
2. `add-questions` — Section + Question + Tag + QuestionTag
3. `add-quiz` — QuizSession + QuizAnswer + UserQuestionProgress

Never mix content and quiz tables in the same migration.

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| `Tag` as a proper table (not `String[]`) | Enables atomic renames, tag browsing with counts, tag descriptions — `String[]` can't do this cleanly |
| `options` as `Json` (not `QuestionOption` rows) | Options are always read together, never queried individually — a join table adds overhead with no benefit |
| `pageReference` nullable | Not all questions have a page reference; nullable is honest |
| `sourceFile` on Question | Audit trail — tracks which JSON file each question was seeded from |
| `QuestionType` enum values `GENERAL` / `STUDY_TOOL_BASED` | DB-level enforcement; original JSON values map to these at seed time |
| `QuizSession.questionType` removed | Sessions should filter by tags going forward, not question type |
