import type { AgentRole } from './base.js';
import type { SharedContext } from '../orchestrator.js';

export const architectAgent: AgentRole = {
  role: 'architect',
  async run(context: SharedContext): Promise<SharedContext> {
    return {
      ...context,
      architectOutput: 'Architecture scaffold pending implementation.'
    };
  }
};
