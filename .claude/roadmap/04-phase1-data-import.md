# Phase 1 — Data Import

**Goal**: All 916 questions imported. Admin can browse them.
**Time estimate**: Week 2

## Data Reality

- **916 questions** across 30 JSON files in `data/`
- Files follow naming: `{Type} - {N}. {Section Name}.json`
- Field name is `section_number` (not `section_id`) — values like `"01"`
- `section` field holds the full section name string
- `correct_answer` is always "X) Full text..." format — extract first char

## Sections Reference

| section_number | section name |
|---|---|
| 01 | Introduction to Lifestyle Medicine |
| 02 | Fundamentals of Health Behavior Change |
| 03 | Key Clinical Processes in Lifestyle Medicine |
| 04 | The Role of The Practitioners Health and Community Advocacy |
| 05 | Nutrition Science Assessment and Prescription Guidelines |
| 06 | Physical Activity Science and Prescription |
| 07 | Emotional and Mental Health Assessment and Interventions |
| 08 | Sleep Health Science and Interventions |
| 09 | Managing Tobacco Cessation and other Toxic Exposures |
| 10 | The Role of Connectedness and Positive Psychology |

## Migration

```bash
# Add question tables to schema (see 01-database-schema.md)
npx prisma migrate dev --name add-questions
```

## Seed Script

The seed script reads the consolidated, tagged JSON files from `data/consolidated/`.
Each question in those files has a `tags` array of slug strings (e.g. `["diabetes", "clinical-evidence"]`).

```typescript
// scripts/seed-questions.ts
import { PrismaClient, QuestionType } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

const TYPE_MAP: Record<string, QuestionType> = {
  'General': QuestionType.GENERAL,
  'Supplementary': QuestionType.SUPPLEMENTARY,
  'Study-Tool Based': QuestionType.STUDY_TOOL_BASED,
}

function parseOptions(options: string[], correctAnswer: string) {
  const correctKey = correctAnswer.trim()[0].toUpperCase()
  return options.map((opt: string) => ({
    key: opt.trim()[0].toUpperCase(),
    text: opt.replace(/^[A-D]\)\s*/, '').trim(),
    isCorrect: opt.trim()[0].toUpperCase() === correctKey,
  }))
}

async function main() {
  const dataDir = path.join(process.cwd(), 'data', 'consolidated')
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'))

  // Pass 1 — collect all unique sections and tags
  const sections = new Map<string, string>()
  const allTags = new Map<string, string>() // slug → label

  for (const file of files) {
    const questions = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8'))
    for (const q of questions) {
      sections.set(q.section_number, q.section)
      for (const slug of (q.tags ?? [])) {
        if (!allTags.has(slug)) {
          // Convert slug to display label: "planetary-health" → "Planetary Health"
          allTags.set(slug, slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
        }
      }
    }
  }

  // Upsert sections
  for (const [id, name] of sections) {
    await prisma.section.upsert({ where: { id }, create: { id, name }, update: {} })
  }
  console.log(`Sections: ${sections.size}`)

  // Upsert tags
  for (const [slug, label] of allTags) {
    await prisma.tag.upsert({ where: { slug }, create: { slug, label }, update: {} })
  }
  console.log(`Tags: ${allTags.size}`)

  // Pass 2 — import questions
  let imported = 0, skipped = 0

  for (const file of files) {
    const questions = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8'))

    for (const q of questions) {
      const questionType = TYPE_MAP[q.question_type]
      if (!questionType) {
        console.warn(`Unknown type "${q.question_type}" — skipping ${q.question_id}`)
        skipped++
        continue
      }

      const tagRecords = await prisma.tag.findMany({
        where: { slug: { in: q.tags ?? [] } },
        select: { id: true },
      })

      await prisma.question.upsert({
        where: { id: q.question_id },
        create: {
          id: q.question_id,
          questionText: q.question_text,
          rationale: q.rationale,
          pageReference: q.page_reference ?? null,
          questionType,
          sectionId: q.section_number,
          options: parseOptions(q.options, q.correct_answer),
          sourceFile: file,
          tags: {
            create: tagRecords.map(t => ({ tagId: t.id })),
          },
        },
        update: {},
      })
      imported++
    }
  }

  console.log(`Done — imported: ${imported}, skipped: ${skipped}`)
}

main().finally(() => prisma.$disconnect())
```

Run with:
```bash
npx tsx scripts/seed-questions.ts
```

## Admin Browse Page

`app/admin/questions/page.tsx` — RSC, protected, shows:
- Table: question_id, section, type, first 80 chars of question text
- Filter by section_number and question_type
- Shows correct answer highlighted green

## Done When

- [ ] `npx prisma studio` shows 916 questions
- [ ] All 10 sections present
- [ ] `/admin/questions` loads and filters work
- [ ] No duplicate IDs in DB
