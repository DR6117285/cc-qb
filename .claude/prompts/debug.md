You are working under `claude.md`. Follow it strictly.

## TASK

Debug an issue without guessing.

## INPUT

* Module:
* Error:
* Relevant code:

---

## STEP 1 — UNDERSTAND

Explain:

* What the system is supposed to do
* What is actually happening

---

## STEP 2 — TRACE FLOW

Trace:

resolver → service → repository → DB

Identify where failure occurs.

---

## STEP 3 — ROOT CAUSE

List possible causes, then narrow to most likely.

DO NOT guess. Use code evidence.

---

## STEP 4 — FIX

Provide:

* Minimal fix
* Correct layer (respect architecture)

---

## STEP 5 — PREVENTION

Suggest:

* small improvement to avoid recurrence
* optional test

---

Rules:

* No random changes
* No large rewrites
* No architecture violations
