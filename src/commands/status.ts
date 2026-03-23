import { Command } from 'commander';

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Show current project plan progress and team state.')
    .action(() => {
      process.stdout.write('Status mode scaffolded. Progress reporting arrives in a later phase.\n');
    });
}
