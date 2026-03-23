# Project Plan: code-cli

## Overview
Bring the task document back in sync with the current orchestration CLI and close the remaining execution gaps uncovered during review.

## Tech Stack
- Language: TypeScript
- Framework: Node.js CLI
- Database: none

## Team Config
- Mode: full
- Agent Backend: claude-code
- Confirmation: per-step

## Constraints & Guidelines
Keep the project cross-platform, prefer built-in Node capabilities for verification, and keep README plus PLAN.md aligned with the real milestone state.

## Build Steps

### Step 1: Planning And Docs Alignment
**Goal**: Update the project task file so it reflects the implemented orchestration foundation and the next meaningful work.
**Skills**: [typescript]
**Agent Team**:
- 🔍 Researcher: "Review the repo status and summarize the mismatch between the old plan and the implemented project."
- 🏗 Architect: "Design a revised PLAN.md that captures the current milestone and the remaining execution gaps."
- ⚙️ Executor: "Rewrite PLAN.md so it tracks the current milestone and concrete follow-up work."
- 🔎 Reviewer: "Confirm PLAN.md now matches the implemented project state."

**Tasks**:
- [x] 1.1 Replace the stale Phase 1-only description
- [x] 1.2 Document the current orchestration milestone
- [x] 1.3 List the remaining runtime and verification work

### Step 2: Runtime Prompt Integration
**Goal**: Ensure prompts stored in PLAN.md are actually used during execution and can be updated from the CLI.
**Skills**: [typescript]
**Agent Team**:
- 🔍 Researcher: "Inspect plan parsing, agent prompt construction, and run command behavior for prompt editing gaps."
- 🏗 Architect: "Define how parsed prompts should flow into the runtime and how CLI editing should persist them."
- ⚙️ Executor: "Implement prompt override usage and a CLI path to edit persisted agent prompts."
- 🔎 Reviewer: "Verify the runtime uses parsed prompts and the edit flow updates PLAN.md."

**Tasks**:
- [x] 2.1 Pass parsed agent prompts into runtime agent execution
- [x] 2.2 Add CLI support to edit step agent prompts
- [x] 2.3 Persist prompt edits back to PLAN.md

### Step 3: Execution UX And Backend Diagnostics
**Goal**: Close the remaining run-mode and environment gaps so the CLI behaves consistently across supported modes.
**Skills**: [typescript]
**Agent Team**:
- 🔍 Researcher: "Review confirmation modes and backend availability checks for platform-specific issues."
- 🏗 Architect: "Specify the missing run-flow behavior for per-agent confirmation and safe backend detection."
- ⚙️ Executor: "Implement the missing confirmation handling and make backend availability checks work on Windows and POSIX."
- 🔎 Reviewer: "Validate the CLI behavior matches the exposed options and environment expectations."

**Tasks**:
- [x] 3.1 Implement per-agent confirmation behavior in run
- [x] 3.2 Preserve auto and per-step behavior without regressions
- [x] 3.3 Make backend availability checks cross-platform

### Step 4: Verification
**Goal**: Add lightweight regression coverage for the updated planning and execution behavior.
**Skills**: [testing, typescript]
**Agent Team**:
- 🔍 Researcher: "Identify the smallest useful test surface for parser updates and backend detection behavior."
- 🏗 Architect: "Choose a lightweight test approach using built-in Node tooling."
- ⚙️ Executor: "Add focused regression tests and any package script updates needed to run them."
- 🔎 Reviewer: "Confirm the new tests cover the intended behavior and document any remaining environment limitations."

**Tasks**:
- [x] 4.1 Add regression tests for PLAN.md prompt persistence helpers
- [x] 4.2 Add regression tests for cross-platform backend availability command selection
- [x] 4.3 Run the available verification commands and record limitations

## Verification Notes
- `npm test` passes with `node --test --test-isolation=none`.
- Prompt persistence was smoke-tested by updating a temporary `PLAN.md` and reading the edited prompt back through the parser.
- TypeScript build verification is still blocked in this workspace because `tsc` is not installed locally.
