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
Each question has a `tags` array of slug strings (e.g. `["diabetes", "clinical-evidence"]`).

See `lm-platform/scripts/seed-questions.ts` for the implementation.

Run with:
```bash
npx tsx scripts/seed-questions.ts
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
