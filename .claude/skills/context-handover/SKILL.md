---
name: context-handover
description: >
  Use this skill to manage context window size in Claude Code. Trigger it when the context
  is getting large, when a long task is nearly complete, or when the user says things like
  "handover", "save progress", "context is getting big", "wrap up this session",
  "continue in new session", "pick up where we left off", or "start fresh". 
  Also trigger Part 2 at the START of a new session when the user says "resume", 
  "load handover", "continue from last session", or "what were we doing".
  This skill has two parts: PART 1 creates a handover document and ends the session cleanly.
  PART 2 reads the latest handover and resumes work efficiently.
---

# Context Handover Skill

Two-part skill for lean context management in Claude Code on Windows (PowerShell native).

---

## PART 1 — Create Handover & End Session

**Trigger phrases:** "handover", "save progress", "context getting big", "wrap up", "start fresh", "new session"

### Step 1: Establish handover store

Run in PowerShell:

```powershell
$gitRoot = git rev-parse --show-toplevel 2>$null
if ($gitRoot) {
    $store = Join-Path $gitRoot ".handover"
} else {
    $store = Join-Path $HOME ".claude-handovers" (Split-Path -Leaf (Get-Location))
}
New-Item -ItemType Directory -Force -Path $store | Out-Null
Write-Host "STORE=$store"
```

### Step 2: Add .gitignore entry if in a git repo

```powershell
$gitRoot = git rev-parse --show-toplevel 2>$null
if ($gitRoot) {
    $ignore = Join-Path $gitRoot ".gitignore"
    $entry = ".handover/"
    if (-not (Test-Path $ignore) -or -not (Select-String -Path $ignore -Pattern "^\.handover/" -Quiet)) {
        Add-Content -Path $ignore -Value $entry
        Write-Host "Added .handover/ to .gitignore"
    }
}
```

### Step 3: Write the handover document

Filename format: `YYYY-MM-DD_HHMM.md`

```powershell
$gitRoot = git rev-parse --show-toplevel 2>$null
if ($gitRoot) {
    $store = Join-Path $gitRoot ".handover"
} else {
    $store = Join-Path $HOME ".claude-handovers" (Split-Path -Leaf (Get-Location))
}
$timestamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$filepath = Join-Path $store "$timestamp.md"
```

Write the file with this exact structure — be ruthlessly concise, no padding:

```markdown
# Handover — {DATE TIME}

## Project
{One line: what this codebase/project is}

## Goal
{What we are trying to achieve in this work stream — the "why"}

## Status
{One sentence: where things stand right now}

## Next Action
{The single most important next step. Be specific — file, function, command.}

## Active Files
{List only files touched or relevant to current work}
- `path\to\file` — {what it does / why it matters right now}

## Key Decisions
{Decisions made this session that aren't obvious from the code}
- {decision}: {why}

## Blockers / Watch Out For
{Known issues, gotchas, things that went wrong}
- {item}

## Environment / Commands
{Only non-obvious setup — e.g. env vars, run commands, ports}
- {item}
```

**Omit any section that has nothing to say. Never pad.**

Write using:
```powershell
Set-Content -Path $filepath -Value $content -Encoding UTF8
```

### Step 4: Confirm and instruct

Tell the user:
- The full handover file path
- "Start a new Claude Code session in this directory and say: **load handover**"
- Do NOT delete or clear anything. The new session is the clean slate.

---

## PART 2 — Load Handover & Resume

**Trigger phrases:** "load handover", "resume", "continue from last session", "what were we doing", "pick up where we left off"

### Step 1: Find the latest handover

```powershell
$gitRoot = git rev-parse --show-toplevel 2>$null
$projectStore = if ($gitRoot) { Join-Path $gitRoot ".handover" } else { $null }
$globalStore = Join-Path $HOME ".claude-handovers" (Split-Path -Leaf (Get-Location))

$store = $null
if ($projectStore -and (Test-Path $projectStore)) {
    $store = $projectStore
} elseif (Test-Path $globalStore) {
    $store = $globalStore
}

if (-not $store) {
    Write-Host "No handover store found for this directory."
    exit 1
}

$latest = Get-ChildItem -Path $store -Filter "*.md" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
Write-Host "Latest handover: $($latest.FullName)"
Get-Content $latest.FullName
```

### Step 2: Orient and resume

After reading the file:
1. State **Goal** and **Next Action** — one line each
2. Quick existence check on active files: `Test-Path` each one, flag any missing
3. Note blockers
4. Ask: *"Shall I start on [Next Action]?"* — one question, nothing else

**Do not re-read the entire codebase. Do not summarise the handover back at length. Trust the document. Get to work.**

### Step 3: Clean up old handovers (optional, ask first)

If more than 5 handover files exist, offer to remove older ones:
```powershell
Get-ChildItem -Path $store -Filter "*.md" | Sort-Object LastWriteTime -Descending | Select-Object -Skip 5
```
Only delete with explicit user confirmation.

---

## Principles

- **The handover is a launch pad for what's next — not a summary of what happened.**
- Only include what Claude cannot recover by reading the codebase.
- Shorter is better. If in doubt, leave it out.
- Part 1 ends the session. Part 2 starts the next one. Nothing else.
