import type { ParsedStep } from '../parser.js';
import type { SharedContext } from '../orchestrator.js';
import type { AIBackend } from './backends/claudeCode.js';

export type AgentRoleName = 'researcher' | 'architect' | 'executor' | 'reviewer';

export interface AgentRole {
  role: AgentRoleName;
  run(context: SharedContext, step: ParsedStep): Promise<SharedContext>;
}

export interface AgentDependencies {
  backend: AIBackend;
}
