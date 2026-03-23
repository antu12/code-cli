import type { AgentRole } from './base.js';
import type { SharedContext } from '../orchestrator.js';

export const executorAgent: AgentRole = {
  role: 'executor',
  async run(context: SharedContext): Promise<SharedContext> {
    return {
      ...context,
      executorOutput: 'Executor scaffold pending implementation.'
    };
  }
};
