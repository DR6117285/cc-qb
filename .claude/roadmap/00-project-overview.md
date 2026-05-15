# Project Overview — Lifestyle Medicine Exam Platform

## What We're Building

A PassMedicine/Pastest-style adaptive quiz platform for the ACLM lifestyle medicine board exam.
Core loop: user picks a section/type → takes a quiz → sees scored review → dashboard tracks weak areas.

## Real Data (Source of Truth)

| Fact | Value |
|------|-------|
| Total questions | **916** |
| Question types | `General`, `Supplementary` (Board Review Notes), `Study-Tool Based` |
| Sections | 10 (section_number "01"–"10") |
| Files | `data/*.json` — original 30 JSON files; consolidated tagged versions in `data/consolidated/` |
| Tagging | Each question carries a `tags[]` array of slugs (e.g. `diabetes`, `planetary-health`) assigned during data consolidation |

### Actual JSON Field Names (use these in seed script)

```json
{
  "question_id": "00001",
  "question_text": "...",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correct_answer": "C) Full text...",
  "rationale": "...",
  "page_reference": "Page 14",
  "section": "Introduction to Lifestyle Medicine",
  "section_number": "01",
  "question_type": "General",
  "tags": ["diabetes", "clinical-evidence", "dietary-patterns"],
  "source_file": "General - 1. Introduction to Lifestyle Medicine.json"
}
```

**Key difference from blueprint**: field is `section_number` (not `section_id`), and `section` holds the full name.

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 App Router |
| Language | TypeScript strict |
| Database | PostgreSQL (Railway) |
| ORM | Prisma 5 |
| Auth | Auth.js v5 (Google OAuth) |
| Validation | Zod |
| UI | Tailwind CSS v4 + shadcn/ui |
| Charts | Recharts |
| Email | Resend |
| Deploy | Railway |

## Build Phases

| Phase | Goal | Files |
|-------|------|-------|
| 0 | Auth + DB live on Railway | `03-phase0-foundation.md` |
| 1 | All 916 questions imported | `04-phase1-data-import.md` |
| 2 | Full quiz loop end-to-end | `05-phase2-quiz-engine.md` |
| 3 | Progress tracking + dashboard | `06-phase3-progress-analytics.md` |
| 4 | Stripe subscriptions | `07-phase4-subscriptions.md` |
| 5 | Polish (timer, revision mode, mobile) | `08-phase5-polish.md` |

## Design Principles

- **Predictable over clever.** One file = one responsibility.
- **No premature abstractions.** Build the thin version first.
- **AI-assisted development.** Every module boundary is small enough for one LLM session.
- See `09-ai-dev-strategy.md` for prompt templates.
