import type { ParsedStep } from '../parser.js';
import type { SharedContext } from '../orchestrator.js';
import type { AgentDependencies, AgentRole } from './base.js';

function defaultPrompt(context: SharedContext): string {
  return [
    '## Your Role: Executor',
    '## Step Goal',
    context.stepGoal,
    '',
    '## Architecture Plan',
    context.architectOutput ?? 'No architect output provided.',
    '',
    '## Reviewer Notes (if retry)',
    context.attempt > 1 ? context.reviewerNotes ?? 'None' : 'None',
    '',
    '## Your Task',
    'Implement exactly what the Architect designed.',
    'Write all necessary files. Run any required commands.',
    'At the end, output a brief summary of what was created or changed.',
    '',
    '## Skills & Guidelines',
    context.skills.join('\n\n') || 'None'
  ].join('\n');
}

function buildPrompt(context: SharedContext, step: ParsedStep): string {
  return step.agentPrompts.executor?.trim() || defaultPrompt(context);
}

export function createExecutorAgent({ backend }: AgentDependencies): AgentRole {
  return {
    role: 'executor',
    async run(context: SharedContext, step: ParsedStep): Promise<SharedContext> {
      const output = await backend.run(buildPrompt(context, step), { cwd: context.workspaceDir });
      return { ...context, executorOutput: output };
    }
  };
}
