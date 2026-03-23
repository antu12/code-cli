import { Command } from 'commander';

export function registerPlanCommand(program: Command): void {
  program
    .command('plan')
    .description('Launch the interactive planning workflow and generate PLAN.md.')
    .action(() => {
      process.stdout.write('Plan mode is scaffolded and will be implemented in the next phase.\n');
    });
}
