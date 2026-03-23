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

function formatDetail(detail: unknown, maxLength = 72): string {
  if (detail === undefined || detail === null) {
    return '';
  }

  const raw = typeof detail === 'string' ? detail : JSON.stringify(detail);
  const normalized = raw.replace(/\s+/g, ' ').trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3)}...` : normalized;
}

export function renderPlanProgress(plan: ParsedPlan, currentStep?: number): void {
  const completedSteps = plan.steps.filter(stepCompleted).length;
  process.stdout.write(`Project Plan: ${plan.name}                     [${completedSteps}/${plan.steps.length} steps complete]\n`);
  process.stdout.write('──────────────────────────────────────────────────────────────\n');
  for (const step of plan.steps) {
    const prefix = stepCompleted(step) ? '[x]' : currentStep === step.index ? ' > ' : '[ ]';
    const suffix = currentStep === step.index ? '                           [current]' : '';
    process.stdout.write(`${prefix} Step ${step.index}: ${step.title}${suffix}\n`);
    for (const task of step.tasks) {
      const taskPrefix = task.completed ? '   [x]' : '   [ ]';
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
    researcher: '[R]',
    architect: '[A]',
    executor: '[E]',
    reviewer: '[V]'
  };
  const barMap: Record<AgentStatus['state'], string> = {
    waiting: '░░░░░░░░░░',
    working: '█████░░░░░',
    done: '██████████'
  };
  for (const agent of agents) {
    process.stdout.write(`${iconMap[agent.role] ?? '[?]'} ${agent.role.padEnd(11)} ${barMap[agent.state]} ${agent.state.padEnd(8)} ${formatDetail(agent.detail)}\n`);
  }
}

export function renderStepSummary(step: ParsedStep, verdict: string, notes?: string): void {
  const color = verdict === 'pass' ? chalk.green : verdict === 'fail' ? chalk.red : chalk.yellow;
  process.stdout.write(`${color(`Step ${step.index}: ${step.title} → ${verdict}`)}\n`);
  if (notes) {
    process.stdout.write(`Reason: ${formatDetail(notes, 160)}\n`);
  }
}

export function renderFinalSummary(stats: RunStats): void {
  process.stdout.write('Plan Complete\n');
  process.stdout.write('─────────────────\n');
  process.stdout.write(`Steps:  ${stats.stepsCompleted}/${stats.stepsTotal} complete\n`);
  process.stdout.write(`Tasks:  ${stats.tasksCompleted}/${stats.tasksTotal} done\n`);
  process.stdout.write(`Skipped: ${stats.skipped}\n`);
  process.stdout.write(`Failed:  ${stats.failed}\n`);
}
