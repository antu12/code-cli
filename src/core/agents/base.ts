import type { SharedContext } from '../orchestrator.js';

export type AgentRoleName = 'researcher' | 'architect' | 'executor' | 'reviewer';

export interface AgentRole {
  role: AgentRoleName;
  run(context: SharedContext): Promise<SharedContext>;
}
