import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { readPlan, updateAgentPrompt } from '../src/core/parser.ts';

const samplePlan = `# Project Plan: Sample

## Overview
Test plan

## Tech Stack
- Language: TypeScript

## Team Config
- Mode: full
- Agent Backend: claude-code
- Confirmation: per-step

## Build Steps

### Step 1: Example
**Goal**: Verify prompt editing
**Skills**: [typescript]
**Agent Team**:
- 🔍 Researcher: "Original research prompt"
- 🏗 Architect: "Original architect prompt"
- ⚙️ Executor: "Original executor prompt"
- 🔎 Reviewer: "Original reviewer prompt"

**Tasks**:
- [ ] 1.1 Verify prompt persistence
`;

test('updateAgentPrompt persists prompt changes that are parsed back correctly', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'code-cli-parser-'));
  const planFile = join(dir, 'PLAN.md');
  const updatedPrompt = 'Review "quoted" cases and keep original casing';

  await writeFile(planFile, samplePlan, 'utf8');
  await updateAgentPrompt(1, 'researcher', updatedPrompt, planFile);

  const plan = await readPlan(planFile);
  assert.equal(plan.steps[0]?.agentPrompts.researcher, 'Review "quoted" cases and keep original casing');

  const markdown = await readFile(planFile, 'utf8');
  assert.match(markdown, /- 🔍 Researcher: "Review \\"quoted\\" cases and keep original casing"/);
});
