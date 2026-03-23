import { writeFile } from 'node:fs/promises';
import { Command } from 'commander';
import readline from 'node:readline/promises';
import { readPlan, markTaskComplete, getStepProgress, updateAgentPrompt } from '../core/parser.js';
import { loadConfig } from '../utils/config.js';
import { loadSkills } from '../utils/skills.js';
import { Orchestrator } from '../core/orchestrator.js';
import { renderPlanProgress, renderTeamActivity, renderStepSummary, renderFinalSummary, type AgentStatus } from '../ui/progress.js';
import type { ParsedStep } from '../core/parser.js';
import type { AgentRoleName } from '../core/agents/base.js';
import { buildExecutionConfig } from '../core/planner.js';

function summarizeDetail(value: unknown): string {
  if (typeof value === 'string') {
    return value.replace(/\s+/g, ' ').trim();
  }

  if (value !== undefined && value !== null) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return '';
}

function buildNextStepLabel(plan: Awaited<ReturnType<typeof readPlan>>): string {
  const nextStep = plan.steps.find((step) => step.tasks.some((task) => !task.completed));
  return nextStep ? `Step ${nextStep.index}: ${nextStep.title}` : 'None';
}

async function writeRunStatus(
  plan: Awaited<ReturnType<typeof readPlan>>,
  workspaceDir: string,
  lastEvent: string,
  currentAgent?: string
): Promise<void> {
  const completedSteps = plan.steps.filter((step) => step.tasks.length > 0 && step.tasks.every((task) => task.completed)).length;
  const completedTasks = plan.steps.flatMap((step) => step.tasks).filter((task) => task.completed).length;
  const totalTasks = plan.steps.flatMap((step) => step.tasks).length;
  const content = [
    `# Run Status: ${plan.name}`,
    '',
    `- Workspace: ${workspaceDir}`,
    `- Current Agent: ${currentAgent ?? 'idle'}`,
    `- Completed Steps: ${completedSteps}/${plan.steps.length}`,
    `- Completed Tasks: ${completedTasks}/${totalTasks}`,
    `- Next Step: ${buildNextStepLabel(plan)}`,
    `- Last Event: ${lastEvent}`,
    `- Updated At: ${new Date().toISOString()}`
  ].join('\n');

  await writeFile('RUN_STATUS.md', content, 'utf8');
}

let runStatusWriteQueue: Promise<void> = Promise.resolve();

function queueRunStatus(
  plan: Awaited<ReturnType<typeof readPlan>>,
  workspaceDir: string,
  lastEvent: string,
  currentAgent?: string
): Promise<void> {
  runStatusWriteQueue = runStatusWriteQueue
    .catch(() => undefined)
    .then(() => writeRunStatus(plan, workspaceDir, lastEvent, currentAgent));

  return runStatusWriteQueue;
}

async function promptForAction(message: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(message);
  rl.close();
  return answer.trim().toLowerCase();
}

async function promptForText(message: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(message);
  rl.close();
  return answer.trim();
}

async function editAgentPrompt(step: ParsedStep): Promise<void> {
  const role = await promptForAction(`Select prompt to edit for Step ${step.index} [researcher|architect|executor|reviewer|q]: `);
  if (role === 'q') {
    return;
  }

  if (!['researcher', 'architect', 'executor', 'reviewer'].includes(role)) {
    process.stdout.write('Unknown role. Prompt edit skipped.\n');
    return;
  }

  const currentPrompt = step.agentPrompts[role as keyof ParsedStep['agentPrompts']] ?? '';
  process.stdout.write(`Current ${role} prompt:\n${currentPrompt || '(empty)'}\n`);
  const nextPrompt = await promptForText('Enter the replacement prompt on one line, or leave blank to cancel: ');
  if (!nextPrompt) {
    process.stdout.write('Prompt edit cancelled.\n');
    return;
  }

  await updateAgentPrompt(step.index, role as keyof ParsedStep['agentPrompts'], nextPrompt);
  process.stdout.write(`${role} prompt updated for Step ${step.index}.\n`);
}

async function confirmAgentRun(role: AgentRoleName, confirmationMode: string): Promise<'run' | 'skip' | 'quit'> {
  if (confirmationMode !== 'per-agent') {
    return 'run';
  }

  const action = await promptForAction(`[Enter] Run ${role}  [s] Skip ${role}  [q] Quit: `);
  if (action === 's') {
    return 'skip';
  }
  if (action === 'q') {
    return 'quit';
  }
  return 'run';
}

export async function executeRunCommand(): Promise<void> {
  const config = await loadConfig();
  let plan = await readPlan(config.planFile);
  let executionConfig = buildExecutionConfig(config, plan.teamConfig);
  executionConfig = {
    ...executionConfig,
    workspaceDir: plan.workspace.rootDir || config.workspaceDir
  };
  const stats = {
    stepsTotal: plan.steps.length,
    stepsCompleted: plan.steps.filter((step) => step.tasks.every((task) => task.completed)).length,
    tasksTotal: plan.steps.flatMap((step) => step.tasks).length,
    tasksCompleted: plan.steps.flatMap((step) => step.tasks).filter((task) => task.completed).length,
    skipped: 0,
    failed: 0
  };

  renderPlanProgress(plan, getStepProgress(plan).current);
  process.stdout.write(`Workspace: ${executionConfig.workspaceDir}\n`);
  process.stdout.write('Progress Hook: RUN_STATUS.md\n\n');
  await queueRunStatus(plan, executionConfig.workspaceDir, 'Run started');

  for (const step of plan.steps) {
    if (step.tasks.length > 0 && step.tasks.every((task) => task.completed)) {
      continue;
    }

    const skillsContent = await loadSkills(step.skills, config.skillsDir);
    const confirmationMode = executionConfig.confirmationMode;
    if (confirmationMode === 'per-step') {
      const action = await promptForAction(`[Enter] Run  [s] Skip  [e] Edit agent prompts  [q] Quit: `);
      if (action === 's') {
        stats.skipped += 1;
        continue;
      }
      if (action === 'e') {
        await editAgentPrompt(step);
        plan = await readPlan(config.planFile);
        executionConfig = buildExecutionConfig(config, plan.teamConfig);
        executionConfig = {
          ...executionConfig,
          workspaceDir: plan.workspace.rootDir || config.workspaceDir
        };
        continue;
      }
      if (action === 'q') {
        break;
      }
    }

    const agentStatuses: AgentStatus[] = ['researcher', 'architect', 'executor', 'reviewer'].map((role) => ({ role, state: 'waiting' }));
    const orchestrator = new Orchestrator(executionConfig, executionConfig.teamMode, {
      onBeforeAgentRun(role) {
        return confirmAgentRun(role, confirmationMode);
      },
      onAgentStart(role) {
        const target = agentStatuses.find((agent) => agent.role === role);
        if (target) {
          target.state = 'working';
          target.detail = 'working...';
        }
        renderTeamActivity(agentStatuses);
        void queueRunStatus(plan, executionConfig.workspaceDir, `${role} started for Step ${step.index}: ${step.title}`, role);
      },
      onAgentComplete(role, context) {
        const target = agentStatuses.find((agent) => agent.role === role);
        if (target) {
          target.state = 'done';
          target.detail = summarizeDetail(context.history.at(-1)?.content);
        }
        renderTeamActivity(agentStatuses);
        void queueRunStatus(plan, executionConfig.workspaceDir, `${role} completed for Step ${step.index}: ${step.title}`, role);
      }
    });

    let result;
    try {
      result = await orchestrator.runStep(step, plan, skillsContent);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      renderStepSummary(step, 'fail', message);
      await queueRunStatus(plan, executionConfig.workspaceDir, `Step ${step.index} failed: ${message}`);
      stats.failed += 1;
      const failAction = await promptForAction(`[r] Retry  [s] Skip  [q] Quit: `);
      if (failAction === 'r') {
        continue;
      }
      if (failAction === 'q') {
        break;
      }
      stats.skipped += 1;
      continue;
    }

    renderStepSummary(step, result.verdict, result.context.reviewerNotes);
    await queueRunStatus(plan, executionConfig.workspaceDir, `Step ${step.index} finished with verdict: ${result.verdict}`);

    if (result.verdict === 'pass') {
      for (const taskId of result.context.tasksCompleted ?? step.tasks.map((task) => task.id)) {
        await markTaskComplete(step.index, taskId, config.planFile);
      }
      plan = await readPlan(config.planFile);
      executionConfig = buildExecutionConfig(config, plan.teamConfig);
      executionConfig = {
        ...executionConfig,
        workspaceDir: plan.workspace.rootDir || config.workspaceDir
      };
      stats.stepsCompleted = plan.steps.filter((entry) => entry.tasks.every((task) => task.completed)).length;
      stats.tasksCompleted = plan.steps.flatMap((entry) => entry.tasks).filter((task) => task.completed).length;
      await queueRunStatus(plan, executionConfig.workspaceDir, `Step ${step.index} marked complete`);
      continue;
    }

    stats.failed += 1;
    const failAction = await promptForAction(`[r] Retry  [s] Skip  [q] Quit: `);
    if (failAction === 'r') {
      continue;
    }
    if (failAction === 'q') {
      break;
    }
    stats.skipped += 1;
  }

  await queueRunStatus(plan, executionConfig.workspaceDir, 'Run finished');
  renderFinalSummary(stats);
}

export function registerRunCommand(program: Command): void {
  program
    .command('run')
    .description('Execute PLAN.md step-by-step with the configured AI team.')
    .action(async () => {
      await executeRunCommand();
    });
}
