# code-cli

`code-cli` is an AI orchestration CLI for software projects. It is designed to help a developer move from an idea to an executable implementation plan, then run that plan with a team of specialized AI agents.

The project is being built in phases. The current scaffold establishes the TypeScript ESM CLI foundation, the planned command surface, and the core interfaces that later phases will extend.

## Vision

`code-cli` aims to support a full development workflow:

1. **Plan** a project with a guided interactive wizard.
2. **Persist** the result as a structured `PLAN.md` document.
3. **Assign** specialized AI agents to each implementation step.
4. **Run** the plan with agent collaboration and shared context.
5. **Track** progress, retries, and completion state from the CLI.
6. **Support** multiple AI backends such as Claude Code and Codex.

## Agent Team Model

Each build step is intended to run through a configurable team of agents.

| Role | Responsibility | Expected Output |
| --- | --- | --- |
| 🔍 Researcher | Surveys the codebase, dependencies, docs, and patterns before implementation. | Research summary for the next agent. |
| 🏗 Architect | Translates research into file changes, interfaces, and implementation strategy. | Structured implementation plan. |
| ⚙️ Executor | Writes code, runs commands, and applies the planned changes. | Change summary and execution notes. |
| 🔎 Reviewer | Validates correctness and completeness, then decides pass, retry, or fail. | Review verdict and completion notes. |

Planned team configurations:

- `full`: Researcher → Architect → Executor → Reviewer
- `lean`: Architect → Executor → Reviewer
- `solo`: Executor only
- `research`: Researcher → Architect

## Current Status

Phase 1 is scaffolded with the following pieces in place:

- TypeScript + ESM project setup.
- CLI entrypoint at `src/cli.ts`.
- Placeholder commands: `plan`, `run`, and `status`.
- Core interfaces for planning, orchestration, and agent execution.
- Skill markdown files under `skills/`.
- Initial `PLAN.md` documenting the first build step.

The commands are currently placeholders. They exist so the command surface can be verified before moving into the interactive planning and orchestration phases.

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
│       └── logger.ts
├── skills/
├── PLAN.md
├── package.json
├── tsconfig.json
└── README.md
```

## Prerequisites

- Node.js 22 or newer is recommended.
- `pnpm` is the intended package manager for this project.
- A POSIX-like shell is recommended for local development commands shown below.

## Installation

### Standard installation

If you have normal access to the npm registry:

```bash
pnpm install
```

### Restricted or offline environments

This repository may be evaluated in environments where external package installation is blocked. In those cases:

- `package.json` still declares the intended dependencies.
- The repository currently includes lightweight local stubs for `commander` and `@clack/prompts` so the scaffold can compile and basic help output can run without registry access.

When you are working in a normal development environment, you should prefer real package installation with `pnpm install`.

## Development Workflow

### Build the CLI

```bash
tsc -p tsconfig.json
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

### Use the development entrypoint

Once dependencies are installed in a normal environment, you can use:

```bash
pnpm dev --help
```

## CLI Commands

### `code-cli --help`

Displays the top-level help text and the currently available commands.

### `code-cli plan`

Planned purpose:

- Ask guided questions about the project.
- Generate a structured `PLAN.md`.
- Capture team mode, backend choice, constraints, and implementation steps.

Current behavior:

- Prints a placeholder message indicating that plan mode is scaffolded.

### `code-cli run`

Planned purpose:

- Read `PLAN.md`.
- Execute each step with the selected AI team.
- Pass shared context between agents.
- Handle retries and task completion updates.

Current behavior:

- Prints a placeholder message indicating that run mode is scaffolded.

### `code-cli status`

Planned purpose:

- Show plan progress without executing work.
- Display step state, tasks, and team activity.

Current behavior:

- Prints a placeholder message indicating that status mode is scaffolded.

## PLAN.md

`PLAN.md` is intended to be the central project execution document.

It will eventually contain:

- Project overview and technical stack.
- Team configuration and backend settings.
- Build steps and task checklists.
- Per-agent prompts for each step.
- Constraints and coding guidelines.

The repository already includes an initial `PLAN.md` with the first scaffold step marked complete.

## Skills

The `skills/` directory is meant to hold reusable markdown prompt fragments that can be injected into agent prompts during planning and execution.

Current examples:

- `skills/typescript.md`
- `skills/rest-api.md`
- `skills/testing.md`

Later phases will load these files automatically based on the skills declared in each plan step.

## Architecture Notes

The scaffold already defines several core building blocks:

- `SharedContext` in `src/core/orchestrator.ts` for agent handoff state.
- `AgentRole` in `src/core/agents/base.ts` for role-specific execution.
- Placeholder backend types for Claude Code and Codex.
- Minimal planner, parser, executor, context, and UI modules to anchor future work.

The project standard is:

- TypeScript strict mode.
- ESM modules.
- Async/await rather than callbacks.
- Plain, readable prompt strings and explicit types.
- Functional style where practical.

## Example Local Session

```bash
# install dependencies in a normal environment
pnpm install

# compile the project
pnpm build

# inspect available commands
node dist/cli.js --help

# run the placeholder planning command
node dist/cli.js plan
```

## Roadmap

Build order for the project:

1. Scaffold project + `code-cli --help` working.
2. Implement `code-cli plan` with interactive Q&A and `PLAN.md` generation.
3. Add a `PLAN.md` parser that can read and update task status.
4. Build the shared context model and orchestrator skeleton.
5. Add backend abstractions for Claude Code and Codex.
6. Implement Researcher, Architect, Executor, and Reviewer roles.
7. Add retry logic and full `code-cli run` execution.
8. Add skill injection and `code-cli status` progress reporting.
9. Polish the UX, help text, and error handling.

## Contributing Notes

If you continue work on this repository, a good next milestone is Phase 2: implement the interactive planning wizard and generate a richer `PLAN.md` document from user input.

Before submitting changes, it is helpful to run:

```bash
tsc -p tsconfig.json
node dist/cli.js --help
```

## License

This scaffold currently uses the MIT license declaration in `package.json`.
