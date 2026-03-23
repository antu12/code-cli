import { Command } from 'commander';
import { readPlan, getStepProgress } from '../core/parser.js';
import { renderPlanProgress } from '../ui/progress.js';

export async function executeStatusCommand(): Promise<void> {
  const plan = await readPlan();
  const progress = getStepProgress(plan);
  renderPlanProgress(plan, progress.current);
}

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Show current project plan progress and team state.')
    .action(async () => {
      await executeStatusCommand();
    });
}
