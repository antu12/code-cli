import type { ParsedStep } from '../parser.js';
import type { SharedContext } from '../orchestrator.js';
import type { AgentDependencies, AgentRole } from './base.js';

function coerceText(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const entries = value
      .map((item) => (typeof item === 'string' ? item.trim() : JSON.stringify(item)))
      .filter(Boolean);

    return entries.length > 0 ? entries.join(' | ') : fallback;
  }

  if (value !== undefined && value !== null) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return fallback;
}

function normalizeTaskIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item).trim()).filter(Boolean);
}

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
      const output = await backend.run(buildPrompt(context, step), { cwd: context.workspaceDir });
      let verdict: 'pass' | 'retry' | 'fail' = 'fail';
      let notes = 'Reviewer returned invalid JSON.';
      let tasksCompleted: string[] = [];
      try {
        const parsed = JSON.parse(output) as { verdict?: unknown; notes?: unknown; tasks_completed?: unknown };
        if (parsed.verdict === 'pass' || parsed.verdict === 'retry' || parsed.verdict === 'fail') {
          verdict = parsed.verdict;
        }
        notes = coerceText(parsed.notes, notes);
        tasksCompleted = normalizeTaskIds(parsed.tasks_completed);
      } catch {
        notes = coerceText(output, notes);
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
