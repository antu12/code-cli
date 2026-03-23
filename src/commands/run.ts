import { Command } from 'commander';

export function registerRunCommand(program: Command): void {
  program
    .command('run')
    .description('Execute PLAN.md step-by-step with the configured AI team.')
    .action(() => {
      process.stdout.write('Run mode scaffolded. Execution workflow arrives in a later phase.\n');
    });
}
