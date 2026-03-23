import { Command } from 'commander';
import readline from 'node:readline/promises';
import { readPlan, markTaskComplete, getStepProgress } from '../core/parser.js';
import { loadConfig } from '../utils/config.js';
import { loadSkills } from '../utils/skills.js';
import { Orchestrator } from '../core/orchestrator.js';
import { renderPlanProgress, renderTeamActivity, renderStepSummary, renderFinalSummary, type AgentStatus } from '../ui/progress.js';

async function promptForAction(message: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(message);
  rl.close();
  return answer.trim().toLowerCase();
}

export async function executeRunCommand(): Promise<void> {
  let plan = await readPlan();
  const config = await loadConfig();
  const stats = {
    stepsTotal: plan.steps.length,
    stepsCompleted: plan.steps.filter((step) => step.tasks.every((task) => task.completed)).length,
    tasksTotal: plan.steps.flatMap((step) => step.tasks).length,
    tasksCompleted: plan.steps.flatMap((step) => step.tasks).filter((task) => task.completed).length,
    skipped: 0,
    failed: 0
  };

  renderPlanProgress(plan, getStepProgress(plan).current);

  for (const step of plan.steps) {
    if (step.tasks.length > 0 && step.tasks.every((task) => task.completed)) {
      continue;
    }

    const skillsContent = await loadSkills(step.skills, config.skillsDir);
    if (plan.teamConfig.confirmationMode === 'per-step') {
      const action = await promptForAction(`[Enter] Run  [s] Skip  [e] Edit agent prompts  [q] Quit: `);
      if (action === 's') {
        stats.skipped += 1;
        continue;
      }
      if (action === 'q') {
        break;
      }
    }

    const agentStatuses: AgentStatus[] = ['researcher', 'architect', 'executor', 'reviewer'].map((role) => ({ role, state: 'waiting' }));
    const orchestrator = new Orchestrator(config, plan.teamConfig.mode as typeof config.teamMode, {
      onAgentStart(role) {
        const target = agentStatuses.find((agent) => agent.role === role);
        if (target) {
          target.state = 'working';
          target.detail = 'working...';
        }
        renderTeamActivity(agentStatuses);
      },
      onAgentComplete(role, context) {
        const target = agentStatuses.find((agent) => agent.role === role);
        if (target) {
          target.state = 'done';
          target.detail = (context.history.at(-1)?.content ?? '').slice(0, 40);
        }
        renderTeamActivity(agentStatuses);
      }
    });

    const result = await orchestrator.runStep(step, plan, skillsContent);
    renderStepSummary(step, result.verdict);

    if (result.verdict === 'pass') {
      for (const taskId of result.context.tasksCompleted ?? step.tasks.map((task) => task.id)) {
        await markTaskComplete(step.index, taskId);
      }
      plan = await readPlan();
      stats.stepsCompleted = plan.steps.filter((entry) => entry.tasks.every((task) => task.completed)).length;
      stats.tasksCompleted = plan.steps.flatMap((entry) => entry.tasks).filter((task) => task.completed).length;
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
