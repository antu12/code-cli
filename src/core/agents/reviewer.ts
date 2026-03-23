import type { ParsedStep } from '../parser.js';
import type { SharedContext } from '../orchestrator.js';
import type { AgentDependencies, AgentRole } from './base.js';

function defaultPrompt(context: SharedContext, step: ParsedStep): string {
  return [
    '## Your Role: Reviewer',
    '## Step Goal',
    context.stepGoal,
    '',
    '## What Was Built',
    context.executorOutput ?? 'None',
    '',
    '## Tasks to Verify',
    step.tasks.map((task) => `- ${task.id} ${task.label}`).join('\n') || 'None',
    '',
    '## Your Task',
    'Review the output against the step goal and task list.',
    'Check: correctness, completeness, code quality, missing edge cases.',
    '',
    'Respond with ONLY valid JSON, no markdown:',
    '{',
    '  "verdict": "pass" | "retry" | "fail",',
    '  "notes": "brief explanation of decision",',
    '  "tasks_completed": ["1.1", "1.2"]',
    '}'
  ].join('\n');
}

function buildPrompt(context: SharedContext, step: ParsedStep): string {
  return step.agentPrompts.reviewer?.trim() || defaultPrompt(context, step);
}

export function createReviewerAgent({ backend }: AgentDependencies): AgentRole {
  return {
    role: 'reviewer',
    async run(context: SharedContext, step: ParsedStep): Promise<SharedContext> {
      const output = await backend.run(buildPrompt(context, step));
      let verdict: 'pass' | 'retry' | 'fail' = 'fail';
      let notes = 'Reviewer returned invalid JSON.';
      let tasksCompleted: string[] = [];
      try {
        const parsed = JSON.parse(output) as { verdict: 'pass' | 'retry' | 'fail'; notes?: string; tasks_completed?: string[] };
        verdict = parsed.verdict;
        notes = parsed.notes ?? '';
        tasksCompleted = parsed.tasks_completed ?? [];
      } catch {
        // keep defaults
      }
      return {
        ...context,
        reviewerVerdict: verdict,
        reviewerNotes: notes,
        tasksCompleted
      };
    }
  };
}
