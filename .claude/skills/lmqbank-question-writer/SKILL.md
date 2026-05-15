---
name: lmqbank-question-writer
description: >
  Generate NBME-standard, board-level multiple choice questions from scraped IBLM
  handbook JSON files for the LMQBank question bank. Use this skill whenever the user
  asks to generate questions from an IBLM section JSON, write new exam questions for
  the lifestyle medicine question bank, or produce MCQs from handbook content.
  Also trigger when the user says things like "generate questions from this section",
  "write MCQs from the handbook", or "add questions to LMQBank". Always use this skill
  for any LMQBank question generation task — even if the user phrases it casually.
---

# LMQBank Question Writer

Generates high-quality, NBME One-Best-Answer questions from scraped IBLM handbook
JSON files, outputs to the LMQBank question JSON array format.

## Quick Reference

- **Input**: A section JSON from the IBLM handbook scrape (e.g. `introduction_to_lifestyle_medicine.json`)
- **Tags source**: `.claude/roadmap/10-question-tags.md` in the project root
- **Output**: A new JSON file with an array of question objects matching the LMQBank schema
- **Question IDs**: Use placeholder IDs (e.g. `"NEW-001"`) — these will be reconciled when merged with the main question bank
- **Section numbers**: Derive from the source filename (see below)

---

## Step 1 — Gather inputs

Ask the user to provide:
1. **The section JSON file path** (required) — e.g. `Claude/lm/introduction_to_lifestyle_medicine.json`
2. **Number of questions** to generate (default: 10 if not specified)
3. **Difficulty target** (default: hard/board-level; ask if they want a mix)

Then:
- Read the section JSON file
- Read `.claude/roadmap/10-question-tags.md` to load the canonical tag list
- Read `references/nbme-rules.md` for the full item-writing rules
- Read `references/output-schema.md` for the exact JSON schema

---

## Step 2 — Analyse the source material

Before writing questions, scan the section JSON and identify:

- **Section name** and **section number** (see filename mapping below)
- **Testable objectives**: statements of fact, statistics, study names, clinical thresholds,
  definitions, mechanisms, treatment hierarchies — anything a board candidate must know
- **High-yield content**: statistics with specific numbers, named studies (DPP, INTERHEART,
  Framingham, etc.), clinical guidelines, percentage reductions, named programs
- **Application opportunities**: scenarios where a candidate must choose between plausible
  options based on evidence, not just recall a fact

Select topics that allow **application-level** questions first, then fill remaining slots with
interpretation-level questions. Avoid pure recall unless the fact is high-yield enough to justify it.

### Filename → Section mapping

| Filename | Section name | Section number |
|---|---|---|
| `pre_amble.json` | Preamble | 00 |
| `introduction_to_lifestyle_medicine.json` | Introduction to Lifestyle Medicine | 01 |
| `fundamentals_of_health_behavior_change.json` | Fundamentals of Health Behavior Change | 02 |
| `key_clinical_processes_in_lifstyle_medicine.json` | Key Clinical Processes in Lifestyle Medicine | 03 |
| `nutrition_science_assessment_and_prescription_guidelines.json` | Nutrition Science, Assessment and Prescription Guidelines | 04 |
| `physical_activity_science_and_prescription.json` | Physical Activity Science and Prescription | 05 |
| `sleep_health_science_and_interventions.json` | Sleep Health Science and Interventions | 06 |
| `emotional_and_mental_health_assessment_and_interventions.json` | Emotional and Mental Health Assessment and Interventions | 07 |
| `treating_tobacco_use_disorder_and_managing_other_toxic_exposures.json` | Treating Tobacco Use Disorder and Managing Other Toxic Exposures | 08 |
| `the_role_of_connectedness_and_postive_psychology.json` | The Role of Connectedness and Positive Psychology | 09 |
| `the_role_of_the_practitioners_personal_health_and_community_advocacy.json` | The Role of the Practitioner's Personal Health and Community Advocacy | 10 |

---

## Step 3 — Write the questions

Follow the NBME rules in `references/nbme-rules.md` exactly. Key requirements:

### Vignette
- Clinical scenario: patient age, context, relevant history, findings
- Every detail must be **clinically necessary** — no padding
- Must pass the **cover-the-options test**: a knowledgeable candidate can formulate the answer before seeing options
- Introduce a **complicating factor** for hard questions: comorbidity, atypical finding, competing priorities

### Lead-in
- Single, closed, specific question
- Typical stems: "Which of the following is the most appropriate next step?", "Which of the following best explains...?", "Which intervention has the strongest evidence for...?"
- Never compound. Never negative phrasing (no EXCEPT, NOT, LEAST)

### Answer options
- Exactly **4 options** (A–D) matching the LMQBank schema
- All **homogeneous** — same category (all dietary interventions, all diagnoses, all mechanisms, etc.)
- One clearly best answer; remaining three are **plausible distractors**
- Distractors must represent: common misconceptions, correct answers to a *slightly different* question, or evidence-based interventions that are correct but less effective/appropriate in this context
- All options similar length and grammatical structure
- No "all of the above", "none of the above", absolute terms ("always", "never")
- The correct answer must NOT stand out by length or detail

### Difficulty calibration
- **Hard (default)**: a competent but non-expert candidate should be genuinely uncertain between at least 2–3 options
- Requires application or clinical decision-making, not recall
- Numeric thresholds and study-specific statistics make good hard-question material

---

## Step 4 — Write rationale

For each question, write a rationale covering:
- **Correct answer explanation** (2–3 sentences, cite the evidence or guideline)
- **Each distractor explanation** — why it is wrong but plausible, in the format: "X is incorrect: [reason]. [Why a candidate might choose it]."

Format: `"[Correct option] is correct: [rationale]. [Distractor A] is incorrect: [reason]. [Distractor B] is incorrect: [reason]. [Distractor C] is incorrect: [reason]."`

---

## Step 5 — Tag each question

Use only tags from `.claude/roadmap/10-question-tags.md`. 

Select 2–5 tags per question. Tags should reflect:
- The IBLM pillar covered
- The clinical topic
- The competency tested (e.g. `clinical-evidence`, `clinical-application`)
- The disease/condition if applicable

---

## Step 6 — Identify page reference

Each page of the source JSON is prefixed `"Page N:"`. Identify the most relevant page number for the question's core content and format as `"Page N"`.

---

## Step 7 — Output

Write a JSON file with an **array** of question objects. Each object must match this schema exactly:

```json
[
  {
    "question_text": "...",
    "options": [
      "A) ...",
      "B) ...",
      "C) ...",
      "D) ..."
    ],
    "correct_answer": "A) ...",
    "page_reference": "Page N",
    "rationale": "...",
    "section": "...",
    "question_id": "NEW-001",
    "section_number": "01",
    "tags": ["tag1", "tag2"]
  }
]
```

**Important**:
- `question_id` uses placeholder format `"NEW-001"`, `"NEW-002"`, etc. — the user will reconcile these when merging with the main question bank
- `section_number` is zero-padded two digits (e.g. `"01"`, `"04"`)
- `correct_answer` must be an exact string match of one of the `options` entries
- `options` always has exactly 4 items, A through D

---

## Step 8 — Self-audit before output

Before writing the final JSON, check each question against this checklist:

- [ ] Cover-the-options test passes (answer derivable before seeing options)
- [ ] No negative phrasing in stem or lead-in
- [ ] All 4 options are homogeneous in category
- [ ] All options similar in length and grammatical structure
- [ ] Correct answer does not stand out by length or detail
- [ ] All distractors are plausible — not absurd
- [ ] At least 2 distractors represent common misconceptions or correct-but-suboptimal choices
- [ ] Rationale explains each distractor
- [ ] Tags are all from the canonical list
- [ ] page_reference matches actual source page

---

## Output file naming

Save the output as: `[source-filename-without-extension]-questions-new.json`

Example: `introduction_to_lifestyle_medicine-questions-new.json`

Place it in the same directory as the source JSON file, or ask the user where they want it.

---

## Reference files

- `references/nbme-rules.md` — Full NBME item-writing rules (read before generating)
- `references/output-schema.md` — JSON schema with annotated example (read if schema questions arise)
