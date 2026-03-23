# code-cli

`code-cli` is an AI orchestration CLI for software projects. It helps a developer move from an idea to a structured `PLAN.md`, then execute that plan with a configurable team of AI agents.

## Current Status

The project is no longer at the Phase 1 scaffold stage.

### Implemented phases

- **Phase 1**: TypeScript + ESM CLI scaffold.
- **Phase 2**: Interactive `plan` wizard that writes `PLAN.md`.
- **Phase 3**: `PLAN.md` parser and task mutation helpers.
- **Phase 4**: Shared context and orchestrator pipeline.
- **Phase 5**: Claude Code and Codex backend adapters.
- **Phase 6**: Researcher, Architect, Executor, and Reviewer agent roles.
- **Phase 7**: Skills loader for markdown prompt fragments.
- **Phase 8**: `run` command that executes incomplete plan steps.
- **Phase 9**: `status` command that renders current plan progress.
- **Phase 10**: Terminal progress UI helpers.
- **Phase 11**: Prompt persistence, confirmation-mode polish, cross-platform backend detection, and lightweight regression tests.

### What this means

The repository already supports:

- generating a `PLAN.md` file from an interactive wizard,
- generating descriptive delivery phases from requirements using AI-assisted planning with a structured fallback,
- parsing and updating plan progress,
- loading skills from `skills/*.md`,
- editing and persisting per-agent prompts in `PLAN.md`,
- running agent pipelines in `full`, `lean`, `solo`, or `research` mode,
- honoring `per-step`, `per-agent`, and `auto` confirmation modes during execution,
- checking backend availability in a cross-platform way,
- shelling out to `claude` or `codex` backends,
- rendering progress for `plan`, `run`, and `status` flows,
- running focused regression tests with the built-in Node test runner.

So, to answer the README question directly: **Phase 2 is already done, not next**.

### Milestone tracking

Current milestone: **Planning and orchestration foundation plus prompt and verification polish complete**.

Milestone log:

- **Milestone 1**: CLI scaffold and Phase 1 setup completed.
- **Milestone 2**: Interactive planning, parser, orchestrator, agent roles, backends, run/status flows, and progress UI completed.
- **Milestone 3**: Prompt persistence, confirmation-mode support, cross-platform backend detection, and regression coverage completed.
- **Milestone 4**: Next work should focus on UX depth, diagnostics, and broader test coverage rather than rebuilding the completed phases.

Documentation rule for follow-up work: **after each meaningful task or milestone update, refresh `README.md` so the documented project state stays accurate**.

## Vision

`code-cli` aims to support a full development workflow:

1. **Plan** a project with a guided interactive wizard.
2. **Persist** the result as a structured `PLAN.md` document.
3. **Assign** specialized AI agents to each implementation step.
4. **Run** the plan with agent collaboration and shared context.
5. **Track** progress, retries, and completion state from the CLI.
6. **Support** multiple AI backends such as Claude Code and Codex.

## Agent Team Model

Each build step can run through a configurable team of agents.

| Role | Responsibility | Expected Output |
| --- | --- | --- |
| 🔍 Researcher | Surveys the codebase, dependencies, docs, and patterns before implementation. | Research summary for the next agent. |
| 🏗 Architect | Translates research into file changes, interfaces, and implementation strategy. | Structured implementation plan. |
| ⚙️ Executor | Writes code, runs commands, and applies the planned changes. | Change summary and execution notes. |
| 🔎 Reviewer | Validates correctness and completeness, then decides pass, retry, or fail. | Review verdict and completion notes. |

Supported team configurations:

- `full`: Researcher → Architect → Executor → Reviewer
- `lean`: Architect → Executor → Reviewer
- `solo`: Executor only
- `research`: Researcher → Architect

## Project Structure

```text
code-cli/
├── src/
│   ├── cli.ts
│   ├── commands/
│   │   ├── plan.ts
│   │   ├── run.ts
│   │   └── status.ts
│   ├── core/
│   │   ├── planner.ts
│   │   ├── executor.ts
│   │   ├── parser.ts
│   │   ├── orchestrator.ts
│   │   ├── context.ts
│   │   └── agents/
│   │       ├── base.ts
│   │       ├── researcher.ts
│   │       ├── architect.ts
│   │       ├── executor.ts
│   │       ├── reviewer.ts
│   │       └── backends/
│   │           ├── availability.ts
│   │           ├── claudeCode.ts
│   │           └── codex.ts
│   ├── ui/
│   │   ├── prompts.ts
│   │   └── progress.ts
│   └── utils/
│       ├── config.ts
│       ├── logger.ts
│       └── skills.ts
├── test/
│   ├── availability.test.mjs
│   ├── parser.test.mjs
│   └── planner.test.mjs
├── skills/
├── PLAN.md
├── .aiorc.json
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

### Standard installation

If you have normal access to the npm registry:

```bash
pnpm install
```

### Restricted or offline environments

This repository declares real package dependencies in `package.json`, and normal development still expects `pnpm install`.

The source tree includes lightweight ambient type declarations in `src/types.d.ts` so the codebase remains easier to inspect in constrained environments, but building and running the full CLI still depends on the declared packages and a local TypeScript installation.

## Development Workflow

### Build the CLI

```bash
npm run build
```

### Run tests

```bash
npm test
```

This uses `node --test --test-isolation=none`, which avoids subprocess isolation and works better in restricted sandboxes.

### Run in development

```bash
npm run dev
```

### Run the compiled CLI

```bash
npm start -- --help
```

### Run commands

```bash
node dist/cli.js plan
node dist/cli.js run
node dist/cli.js status
```

## CLI Commands

### `code-cli plan`

Current behavior:

- launches an interactive wizard,
- asks where the target project should be developed,
- collects project metadata, features, constraints, backend, team mode, and confirmation mode,
- uses the selected backend to expand requirements into descriptive software-delivery steps when available,
- falls back to heuristic step generation that still groups work into clearer phases,
- writes a structured `PLAN.md`,
- optionally starts execution immediately.

### `code-cli run`

Current behavior:

- reads and parses `PLAN.md`,
- shows the active workspace directory before execution,
- writes a lightweight `RUN_STATUS.md` progress hook with the latest completed work and next step,
- loads step skills,
- uses per-step prompt overrides stored in `PLAN.md`,
- supports editing persisted step prompts before execution,
- respects `per-step`, `per-agent`, and `auto` confirmation modes,
- reads the plan file path from config,
- executes incomplete steps through the orchestrator,
- tracks task completion and updates `PLAN.md`,
- renders team activity and a final summary.

### `code-cli status`

Current behavior:

- reads `PLAN.md`,
- calculates plan progress,
- renders a terminal summary of steps, tasks, and team configuration.

## PLAN.md

`PLAN.md` is the central execution document for the CLI.

It contains:

- project overview and technical stack,
- team configuration and backend settings,
- build steps and task checklists,
- per-agent prompts for each step,
- constraints and coding guidelines,
- verification notes and milestone updates.

The parser is designed to ignore extra sections it does not understand so the document can be extended safely.

The planning flow now aims to produce implementation phases such as project foundation, API/services, authentication, reporting, UI delivery, and release readiness instead of mirroring each raw feature string as its own step.

Runtime defaults can be overridden with `.aiorc.json`, including the backend, team mode, confirmation mode, plan file path, skills directory, and retry count.

## Skills

The `skills/` directory holds reusable markdown prompt fragments that can be injected into agent prompts during planning and execution.

Current examples:

- `skills/typescript.md`
- `skills/rest-api.md`
- `skills/testing.md`

## Example Local Session

```bash
# compile
npm run build

# run regression checks
npm test

# run from source during development
npm run dev -- --help

# inspect commands
npm start -- --help

# create or update a plan
npm start -- plan

# inspect current progress
npm start -- status

# execute remaining steps
npm start -- run
```

## Roadmap

Major orchestration phases through Phase 10 are implemented.

Reasonable next improvements now are:

1. richer multi-line prompt editing in `run`,
2. better retry/skip UX and clearer abort handling,
3. explicit backend preflight diagnostics surfaced from CLI commands,
4. stronger plan generation heuristics, better requirement clustering, and richer task detail,
5. broader end-to-end and orchestrator command coverage.

## Contributing Notes

If you continue work on this repository, treat the planning/orchestration foundation and prompt persistence flow as present and focus on refinement, diagnostics, broader testing, and UX improvements rather than redoing earlier phases.

Keep `README.md` current after each completed task or milestone so contributors can trust the documented status without checking git history first.
