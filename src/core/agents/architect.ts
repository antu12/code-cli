import type { ParsedStep } from '../parser.js';
import type { SharedContext } from '../orchestrator.js';
import type { AgentDependencies, AgentRole } from './base.js';

function defaultPrompt(context: SharedContext): string {
  return [
    '## Your Role: Architect',
    '## Step Goal',
    context.stepGoal,
    '',
    '## Research Summary',
    context.researchOutput ?? 'None',
    '',
    '## Your Task',
    'Design the implementation. Output exactly:',
    '1. FILES: List each file to create or modify with its purpose',
    '2. INTERFACES: Key TypeScript types or interfaces (if any)',
    '3. APPROACH: Implementation strategy in pseudocode or bullet points',
    '',
    'Do NOT write actual implementation code. Design only.'
  ].join('\n');
}

function buildPrompt(context: SharedContext, step: ParsedStep): string {
  return step.agentPrompts.architect?.trim() || defaultPrompt(context);
}

export function createArchitectAgent({ backend }: AgentDependencies): AgentRole {
  return {
    role: 'architect',
    async run(context: SharedContext, step: ParsedStep): Promise<SharedContext> {
      const output = await backend.run(buildPrompt(context, step), { cwd: context.workspaceDir });
      return { ...context, architectOutput: output };
    }
  };
}
