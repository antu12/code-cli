import type { AgentRole } from './base.js';
import type { SharedContext } from '../orchestrator.js';

export const reviewerAgent: AgentRole = {
  role: 'reviewer',
  async run(context: SharedContext): Promise<SharedContext> {
    return {
      ...context,
      reviewerVerdict: 'pass',
      reviewerNotes: 'Reviewer scaffold pending implementation.'
    };
  }
};
