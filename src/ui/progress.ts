import chalk from 'chalk';
import type { ParsedPlan, ParsedStep } from '../core/parser.js';

export interface AgentStatus {
  role: string;
  state: 'waiting' | 'working' | 'done';
  detail?: string;
}

export interface RunStats {
  stepsTotal: number;
  stepsCompleted: number;
  tasksTotal: number;
  tasksCompleted: number;
  skipped: number;
  failed: number;
}

function stepCompleted(step: ParsedStep): boolean {
  return step.tasks.length > 0 && step.tasks.every((task) => task.completed);
}

export function renderPlanProgress(plan: ParsedPlan, currentStep?: number): void {
  const completedSteps = plan.steps.filter(stepCompleted).length;
  process.stdout.write(`📋 Project Plan: ${plan.name}                     [${completedSteps}/${plan.steps.length} steps complete]\n`);
  process.stdout.write('──────────────────────────────────────────────────────────────\n');
  for (const step of plan.steps) {
    const prefix = stepCompleted(step) ? '✅' : currentStep === step.index ? '▶ ' : '⬜';
    const suffix = currentStep === step.index ? '                           [current]' : '';
    process.stdout.write(`${prefix} Step ${step.index}: ${step.title}${suffix}\n`);
    for (const task of step.tasks) {
      const taskPrefix = task.completed ? '   ✅' : '   ⬜';
      process.stdout.write(`${taskPrefix} ${task.id} ${task.label}\n`);
    }
    if (step.tasks.length === 0) {
      process.stdout.write('\n');
    }
  }
  process.stdout.write(`\nTeam Config: ${plan.teamConfig.mode} mode · ${plan.teamConfig.agent} backend · ${plan.teamConfig.confirmationMode} confirmation\n`);
}

export function renderTeamActivity(agents: AgentStatus[]): void {
  const iconMap: Record<string, string> = {
    researcher: '🔍',
    architect: '🏗 ',
    executor: '⚙️',
    reviewer: '🔎'
  };
  const barMap: Record<AgentStatus['state'], string> = {
    waiting: '░░░░░░░░░░',
    working: '█████░░░░░',
    done: '██████████'
  };
  for (const agent of agents) {
    process.stdout.write(`${iconMap[agent.role] ?? '•'} ${agent.role.padEnd(11)} ${barMap[agent.state]} ${agent.state.padEnd(8)} ${agent.detail ?? ''}\n`);
  }
}

export function renderStepSummary(step: ParsedStep, verdict: string): void {
  const color = verdict === 'pass' ? chalk.green : verdict === 'fail' ? chalk.red : chalk.yellow;
  process.stdout.write(`${color(`Step ${step.index}: ${step.title} → ${verdict}`)}\n`);
}

export function renderFinalSummary(stats: RunStats): void {
  process.stdout.write('✅ Plan Complete\n');
  process.stdout.write('─────────────────\n');
  process.stdout.write(`Steps:  ${stats.stepsCompleted}/${stats.stepsTotal} complete\n`);
  process.stdout.write(`Tasks:  ${stats.tasksCompleted}/${stats.tasksTotal} done\n`);
  process.stdout.write(`Skipped: ${stats.skipped}\n`);
  process.stdout.write(`Failed:  ${stats.failed}\n`);
}
