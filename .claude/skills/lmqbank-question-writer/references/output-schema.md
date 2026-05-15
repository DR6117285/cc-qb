# LMQBank Output JSON Schema

The output must be a **JSON array** of question objects. Even if generating a single question,
wrap it in an array.

---

## Schema (annotated)

```json
[
  {
    // The full question vignette + lead-in, as a single string.
    // No line breaks needed — the app handles rendering.
    "question_text": "A 52-year-old man with a BMI of 29 and a family history of type 2 diabetes presents for a well-man check. His fasting glucose is 6.0 mmol/L. He asks what intervention would most reduce his risk of progressing to type 2 diabetes. Which of the following interventions has the strongest evidence for diabetes prevention in high-risk individuals?",

    // Exactly 4 options. Format: "A) [text]", "B) [text]", etc.
    // All options homogeneous, similar length, plausible.
    "options": [
      "A) Metformin 500mg twice daily",
      "B) Intensive lifestyle intervention including dietary change and physical activity",
      "C) Low-carbohydrate, high-fat dietary pattern",
      "D) Chromium supplementation 200mcg daily"
    ],

    // Exact string match of one of the options entries above.
    "correct_answer": "B) Intensive lifestyle intervention including dietary change and physical activity",

    // The page number(s) in the source JSON where the core content lives.
    // Format: "Page N". Use the page number from the source JSON prefix "Page N:".
    "page_reference": "Page 14",

    // Full rationale string. Explain correct answer with evidence.
    // Then explain each distractor: why wrong, why plausible.
    "rationale": "B is correct: The Diabetes Prevention Program (DPP) demonstrated that intensive lifestyle intervention reduced diabetes incidence by 58% in high-risk individuals, significantly outperforming both placebo and metformin (31% reduction). This represents the highest level of evidence for diabetes prevention. A is incorrect: Metformin was effective in the DPP (31% reduction) but was nearly half as effective as lifestyle intervention; it is not the most evidence-based first-line recommendation for prevention in non-diabetic high-risk individuals. C is incorrect: Low-carbohydrate, high-fat dietary patterns lack large-scale RCT evidence for diabetes prevention in high-risk individuals and were not studied in the DPP; a candidate familiar with popular dietary trends may be tempted by this option. D is incorrect: Chromium supplementation lacks robust RCT evidence for diabetes prevention and is not recommended in major clinical guidelines; it may attract candidates aware of micronutrient roles in glucose metabolism.",

    // Section name as a string — match the section name from the filename mapping in SKILL.md.
    "section": "Introduction to Lifestyle Medicine",

    // Placeholder ID. Use format "NEW-001", "NEW-002", etc.
    // Will be reconciled when merged with the main question bank.
    "question_id": "NEW-001",

    // Two-digit zero-padded section number matching SKILL.md filename mapping.
    "section_number": "01",

    // 2–5 tags from the canonical list in .claude/roadmap/10-question-tags.md only.
    // Never invent tags.
    "tags": [
      "diabetes",
      "clinical-evidence",
      "physical-activity",
      "dietary-patterns"
    ]
  }
]
```

---

## Validation checklist

Before outputting the JSON, verify each question object:

- [ ] `question_text` contains both vignette and lead-in
- [ ] `options` has exactly 4 items, all starting with "A) ", "B) ", "C) ", "D) "
- [ ] `correct_answer` is an exact character-for-character match of one of the `options` strings
- [ ] `page_reference` is in format "Page N" and corresponds to an actual page in the source JSON
- [ ] `rationale` addresses the correct answer AND all 3 distractors
- [ ] `section` matches the section name from SKILL.md filename mapping
- [ ] `question_id` uses "NEW-NNN" placeholder format
- [ ] `section_number` is two-digit zero-padded and matches SKILL.md mapping
- [ ] `tags` contains only tags from the canonical tag file, 2–5 per question
- [ ] JSON is valid (no trailing commas, proper string escaping)

---

## Notes on merging

The `question_id` and numbering will be updated by the user when merging with the main
question bank. Do not attempt to compute or infer the correct sequential ID — use placeholders.
