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

### What this means

The repository already supports:

- generating a `PLAN.md` file from an interactive wizard,
- parsing and updating plan progress,
- loading skills from `skills/*.md`,
- running agent pipelines in `full`, `lean`, `solo`, or `research` mode,
- shelling out to `claude` or `codex` backends,
- rendering progress for `plan`, `run`, and `status` flows.

So, to answer the README question directly: **Phase 2 is already done, not next**.

### Milestone tracking

Current milestone: **Planning and orchestration foundation complete**.

Milestone log:

- **Milestone 1**: CLI scaffold and Phase 1 setup completed.
- **Milestone 2**: Interactive planning, parser, orchestrator, agent roles, backends, run/status flows, and progress UI completed.
- **Milestone 3**: Next work should focus on polish, diagnostics, tests, and UX refinements rather than rebuilding the completed phases.

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
│   │           ├── claudeCode.ts
│   │           └── codex.ts
│   ├── ui/
│   │   ├── prompts.ts
│   │   └── progress.ts
│   └── utils/
│       ├── config.ts
│       ├── logger.ts
│       └── skills.ts
├── skills/
├── PLAN.md
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

This repository still declares real package dependencies in `package.json`, and that is the preferred setup in a normal environment.

In restricted environments where registry access is blocked, the repository also includes lightweight runtime shims for:

- `commander`
- `@clack/prompts`
- `chalk`

That fallback allows the CLI to compile and run basic flows in environments where package installation is unavailable.

## Development Workflow

### Build the CLI

```bash
npx tsc -p tsconfig.json
```

### Run the compiled CLI

```bash
node dist/cli.js --help
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
- collects project metadata, features, constraints, backend, team mode, and confirmation mode,
- writes a structured `PLAN.md`,
- optionally starts execution immediately.

### `code-cli run`

Current behavior:

- reads and parses `PLAN.md`,
- loads step skills,
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
- constraints and coding guidelines.

The parser is designed to ignore extra sections it does not understand so the document can be extended safely.

## Skills

The `skills/` directory holds reusable markdown prompt fragments that can be injected into agent prompts during planning and execution.

Current examples:

- `skills/typescript.md`
- `skills/rest-api.md`
- `skills/testing.md`

## Example Local Session

```bash
# compile
npx tsc -p tsconfig.json

# inspect commands
node dist/cli.js --help

# create or update a plan
node dist/cli.js plan

# inspect current progress
node dist/cli.js status

# execute remaining steps
node dist/cli.js run
```

## Roadmap

Major orchestration phases through Phase 10 are implemented.

Reasonable next improvements now are:

1. richer prompt editing in `run`,
2. better retry/skip UX,
3. more robust backend availability checks and diagnostics,
4. stronger plan generation heuristics and subtasks,
5. automated tests for parser, orchestrator, and command flows.

## Contributing Notes

If you continue work on this repository, treat the planning/orchestration foundation as present and focus on refinement, testing, and UX improvements rather than redoing Phase 2.

Keep `README.md` current after each completed task or milestone so contributors can trust the documented status without checking git history first.
