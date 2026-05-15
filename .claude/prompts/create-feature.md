You are working under `claude.md`. Follow it strictly.

## TASK

Create a new backend feature using a vertical slice.

## INPUT (FILL THIS IN BEFORE RUNNING)

* Module: [questions / quiz / users / analytics]
* Feature: [e.g. "submit quiz answer"]
* Inputs: [GraphQL inputs]
* Outputs: [GraphQL outputs]
* Rules/constraints: [optional]

---

## STEP 1 — THINKING PROTOCOL (MANDATORY)

Before writing code:

1. State the module
2. State the use case in ONE sentence
3. List required service functions
4. List required repository functions
5. Confirm dependency direction is respected

STOP if unclear and ask questions.

---

## STEP 2 — DESIGN (NO CODE YET)

Design:

* GraphQL schema changes
* Service API (function names + responsibilities)
* Repository API (minimal required functions)

Keep everything minimal and aligned with claude.md.

---

## STEP 3 — IMPLEMENTATION (CONTROLLED)

Implement in this order:

1. model.ts (if needed)
2. repository.ts
3. service.ts
4. resolver.ts
5. schema.ts

Rules:

* Max 2–3 files per response
* Do NOT implement everything at once
* Wait for confirmation before continuing if large

---

## STEP 4 — VALIDATION

Check:

* No business logic in resolvers
* No Prisma outside repositories
* Services are small and focused
* No duplication
* Dependency direction is correct

---

## OUTPUT FORMAT

* Step 1: Thinking
* Step 2: Design
* Step 3: Code (limited scope)

Do NOT skip steps.
