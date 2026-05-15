You are working under `claude.md`. Follow it strictly.

## TASK

Extend an existing feature without breaking architecture.

## INPUT

* Module:
* Existing feature:
* Change required:

---

## STEP 1 — UNDERSTAND CURRENT STATE

Ask for or analyse:

* service.ts
* repository.ts
* resolver.ts (if relevant)

Summarise current flow in 3–5 lines.

---

## STEP 2 — IMPACT ANALYSIS

Identify:

* Which layer(s) change
* New service functions needed
* Whether repository changes are required

DO NOT modify layers unnecessarily.

---

## STEP 3 — DESIGN CHANGE

Describe:

* Updated service logic
* New or updated repository functions
* Any schema changes

---

## STEP 4 — IMPLEMENT (CONTROLLED)

* Modify only necessary files
* Max 2–3 files per response
* Keep changes minimal

---

## STEP 5 — VALIDATION

Check:

* No architecture violations
* No duplication introduced
* Backward compatibility maintained

---

If the request would break architecture:
→ REFUSE and propose a compliant alternative
