import { writeFile } from 'node:fs/promises';
import { Command } from 'commander';
import { intro, outro, text, select, confirm, isCancel, cancel } from '@clack/prompts';
import type { PlanningAnswers } from '../ui/prompts.js';
import { executeRunCommand } from './run.js';

function deriveSubtasks(feature: string, language: string, framework: string): string[] {
  return [
    `Define ${feature} flow in ${framework || language}`,
    `Implement ${feature} logic and integrations`,
    `Validate ${feature} behavior and edge cases`
  ];
}

function buildPlanMarkdown(answers: PlanningAnswers): string {
  const steps = answers.features.map((feature, index) => {
    const stepNumber = index + 2;
    const subtasks = deriveSubtasks(feature, answers.language, answers.framework);
    return `### Step ${stepNumber}: ${feature}\n**Goal**: Implement ${feature}\n**Skills**: [typescript]\n**Agent Team**:\n- 🔍 Researcher: \"Review existing code relevant to ${feature}. Summarize patterns, types, and integration points.\"\n- 🏗 Architect: \"Design the implementation for ${feature} based on research. List files and interfaces.\"\n- ⚙️ Executor: \"Implement ${feature} per the Architect's design.\"\n- 🔎 Reviewer: \"Validate ${feature} is complete and correct. Respond with JSON: { verdict, notes, tasks_completed }\"\n\n**Tasks**:\n- [ ] ${stepNumber}.1 ${subtasks[0]}\n- [ ] ${stepNumber}.2 ${subtasks[1]}\n- [ ] ${stepNumber}.3 ${subtasks[2]}\n`;
  }).join('\n');

  return `# Project Plan: ${answers.projectName}\n\n## Overview\n${answers.description}\n\n## Tech Stack\n- Language: ${answers.language}\n- Framework: ${answers.framework}\n- Database: ${answers.database}\n\n## Team Config\n- Mode: ${answers.teamMode}\n- Agent Backend: ${answers.agent}\n- Confirmation: ${answers.confirmationMode}\n\n## Constraints & Guidelines\n${answers.constraints?.trim() || 'None specified'}\n\n## Build Steps\n\n### Step 1: Project Setup\n**Goal**: Scaffold the initial project structure and install dependencies\n**Skills**: [scaffolding, typescript]\n**Agent Team**:\n- 🔍 Researcher: \"Survey the target directory for existing files, package.json, tsconfig, .git. Output a concise summary of what already exists.\"\n- 🏗 Architect: \"Given the research summary, design the folder structure and list all files to create with their purpose. Do not write code yet.\"\n- ⚙️ Executor: \"Implement the structure from the Architect's plan. Initialize the package manager, create all files, install dependencies.\"\n- 🔎 Reviewer: \"Verify the folder matches the plan. Run the build command and confirm it compiles. Respond with JSON: { verdict, notes, tasks_completed }\"\n\n**Tasks**:\n- [ ] 1.1 Initialize repo and package.json\n- [ ] 1.2 Install dependencies\n- [ ] 1.3 Set up tsconfig and build pipeline\n\n${steps}`;
}

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

  await writeFile('PLAN.md', buildPlanMarkdown(answers), 'utf8');
  const shouldRun = await confirm({ message: 'Run the plan now?', initialValue: true });
  if (isCancel(shouldRun)) {
    cancel('Planning cancelled.');
    return;
  }
  if (shouldRun) {
    await executeRunCommand();
  } else {
    outro('Plan saved to PLAN.md. Run with: code-cli run');
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
