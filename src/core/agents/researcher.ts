import type { AgentRole } from './base.js';
import type { SharedContext } from '../orchestrator.js';

export const researcherAgent: AgentRole = {
  role: 'researcher',
  async run(context: SharedContext): Promise<SharedContext> {
    return {
      ...context,
      researchOutput: 'Research scaffold pending implementation.'
    };
  }
};
