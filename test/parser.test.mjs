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

test('readPlan parses team config correctly from CRLF PLAN.md files', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'code-cli-parser-crlf-'));
  const planFile = join(dir, 'PLAN.md');
  const crlfPlan = samplePlan.replace(/\n/g, '\r\n').replace('- Agent Backend: claude-code', '- Agent Backend: codex').replace('- Confirmation: per-step', '- Confirmation: auto');

  await writeFile(planFile, crlfPlan, 'utf8');

  const plan = await readPlan(planFile);
  assert.equal(plan.teamConfig.agent, 'codex');
  assert.equal(plan.teamConfig.confirmationMode, 'auto');
  assert.equal(plan.teamConfig.mode, 'full');
});
