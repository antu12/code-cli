import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Command } from 'commander';
import { intro, outro, text, select, confirm, isCancel, cancel } from '@clack/prompts';
import type { PlanningAnswers } from '../ui/prompts.js';
import { executeRunCommand } from './run.js';
import { buildPlanMarkdown, createPlanner } from '../core/planner.js';

async function askText(message: string, required = true): Promise<string> {
  const value = await text({
    message,
    validate: required ? (input) => (input.trim() ? undefined : 'This field is required.') : undefined
  });
  if (isCancel(value)) {
    cancel('Planning cancelled.');
    throw new Error('cancelled');
  }
  return String(value);
}

export async function executePlanCommand(): Promise<void> {
  intro('code-cli planning wizard');
  const answers: PlanningAnswers = {
    projectName: await askText('Project name'),
    projectDir: '',
    description: await askText('Project description'),
    language: await askText('Tech stack — language'),
    framework: await askText('Tech stack — framework'),
    database: await askText('Tech stack — database'),
    features: (await askText('Main features to build (comma-separated)')).split(',').map((item) => item.trim()).filter(Boolean),
    constraints: await askText('Any constraints or code style rules (optional)', false),
    agent: 'claude-code',
    teamMode: 'full',
    confirmationMode: 'per-step'
  };
  const agent = await select({ message: 'Agent backend', options: [{ value: 'claude-code', label: 'claude-code' }, { value: 'codex', label: 'codex' }] });
  const teamMode = await select({ message: 'Team mode', options: [{ value: 'full', label: 'full' }, { value: 'lean', label: 'lean' }, { value: 'solo', label: 'solo' }, { value: 'research', label: 'research' }] });
  const confirmationMode = await select({ message: 'Confirmation mode', options: [{ value: 'per-step', label: 'per-step' }, { value: 'per-agent', label: 'per-agent' }, { value: 'auto', label: 'auto' }] });
  if (isCancel(agent) || isCancel(teamMode) || isCancel(confirmationMode)) {
    cancel('Planning cancelled.');
    return;
  }
  answers.agent = agent as 'claude-code' | 'codex';
  answers.teamMode = teamMode as 'full' | 'lean' | 'solo' | 'research';
  answers.confirmationMode = confirmationMode as 'per-step' | 'per-agent' | 'auto';
  answers.projectDir = resolve((await askText('Project directory (optional, defaults to current directory)', false)).trim() || process.cwd());

  await mkdir(answers.projectDir, { recursive: true });

  const planner = createPlanner({ backend: answers.agent });
  const planDraft = await planner.generatePlan(answers);
  await writeFile('PLAN.md', buildPlanMarkdown(answers, planDraft.steps), 'utf8');
  const shouldRun = await confirm({ message: 'Run the plan now?', initialValue: true });
  if (isCancel(shouldRun)) {
    cancel('Planning cancelled.');
    return;
  }
  if (shouldRun) {
    await executeRunCommand();
  } else {
    outro(`Plan saved to PLAN.md using ${planDraft.source === 'ai' ? 'AI-generated' : 'fallback'} step planning. Run with: code-cli run`);
  }
}

export function registerPlanCommand(program: Command): void {
  program
    .command('plan')
    .description('Launch the interactive planning workflow and generate PLAN.md.')
    .action(async () => {
      await executePlanCommand();
    });
}
