import type { ParsedStep } from '../parser.js';
import type { SharedContext } from '../orchestrator.js';
import type { AgentDependencies, AgentRole } from './base.js';

function summarizeHistory(context: SharedContext): string {
  if (context.attempt <= 1 || context.history.length === 0) {
    return 'None';
  }
  return context.history.map((entry) => `- ${entry.role}: ${entry.content}`).join('\n');
}

function buildPrompt(context: SharedContext): string {
  return [
    '## Your Role: Researcher',
    '## Step Goal',
    context.stepGoal,
    '',
    '## Existing Research Context',
    summarizeHistory(context),
    '',
    '## Your Task',
    'Survey the codebase and gather all context needed before implementation.',
    'Look for: existing files, patterns, imported libraries, naming conventions, related modules.',
    'Output a concise research summary (max 400 words) that the Architect will use.',
    'Focus only on what is relevant to the step goal.',
    '',
    '## Skills & Guidelines',
    context.skills.join('\n\n') || 'None'
  ].join('\n');
}

export function createResearcherAgent({ backend }: AgentDependencies): AgentRole {
  return {
    role: 'researcher',
    async run(context: SharedContext, _step: ParsedStep): Promise<SharedContext> {
      const output = await backend.run(buildPrompt(context));
      return { ...context, researchOutput: output };
    }
  };
}
