#!/usr/bin/env node
import { Command } from 'commander';
import { registerPlanCommand } from './commands/plan.js';
import { registerRunCommand } from './commands/run.js';
import { registerStatusCommand } from './commands/status.js';

const program = new Command();

program
  .name('code-cli')
  .description('Plan and orchestrate AI coding agents across structured project workflows.')
  .version('0.1.0');

registerPlanCommand(program);
registerRunCommand(program);
registerStatusCommand(program);

program.parseAsync(process.argv);
