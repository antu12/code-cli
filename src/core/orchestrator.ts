import { getBackend } from './agents/backends/codex.js';
import type { AgentRoleName } from './agents/base.js';
import { createResearcherAgent } from './agents/researcher.js';
import { createArchitectAgent } from './agents/architect.js';
import { createExecutorAgent } from './agents/executor.js';
import { createReviewerAgent } from './agents/reviewer.js';
import type { ParsedPlan, ParsedStep } from './parser.js';
import type { AIOConfig, TeamMode } from '../utils/config.js';

export interface AgentMessage {
  role: string;
  content: string;
  timestamp: string;
}

export interface SharedContext {
  stepGoal: string;
  techStack: Record<string, string>;
  skills: string[];
  researchOutput?: string;
  architectOutput?: string;
  executorOutput?: string;
  reviewerVerdict?: 'pass' | 'retry' | 'fail';
  reviewerNotes?: string;
  tasksCompleted?: string[];
  attempt: number;
  maxAttempts: number;
  history: AgentMessage[];
}

export interface StepResult {
  verdict: 'pass' | 'retry' | 'fail';
  context: SharedContext;
}

export interface OrchestratorEvents {
  onAgentStart?: (role: AgentRoleName, context: SharedContext) => void;
  onAgentComplete?: (role: AgentRoleName, context: SharedContext) => void;
  onStepComplete?: (step: ParsedStep, result: StepResult) => void;
  onStepFail?: (step: ParsedStep, result: StepResult) => void;
  onBeforeAgentRun?: (role: AgentRoleName, context: SharedContext, step: ParsedStep) => Promise<'run' | 'skip' | 'quit'>;
}

function historyEntry(role: string, content: string): AgentMessage {
  return { role, content, timestamp: new Date().toISOString() };
}

function createSharedContext(step: ParsedStep, plan: ParsedPlan, config: AIOConfig, skillsContent: string): SharedContext {
  return {
    stepGoal: step.goal,
    techStack: plan.techStack,
    skills: skillsContent ? [skillsContent] : [],
    attempt: 1,
    maxAttempts: config.maxAttempts,
    history: []
  };
}

function parseReviewerJson(raw: string): { verdict: 'pass' | 'retry' | 'fail'; notes: string; tasks_completed: string[] } {
  const parsed = JSON.parse(raw) as { verdict: 'pass' | 'retry' | 'fail'; notes?: string; tasks_completed?: string[] };
  return {
    verdict: parsed.verdict,
    notes: parsed.notes ?? '',
    tasks_completed: parsed.tasks_completed ?? []
  };
}

export class Orchestrator {
  private readonly config: AIOConfig;
  private readonly teamMode: TeamMode;
  private readonly events: OrchestratorEvents;

  constructor(config: AIOConfig, teamMode: TeamMode, events: OrchestratorEvents = {}) {
    this.config = config;
    this.teamMode = teamMode;
    this.events = events;
  }

  async runStep(step: ParsedStep, plan: ParsedPlan, skillsContent = ''): Promise<StepResult> {
    const backend = getBackend(this.config.agent);
    const context = createSharedContext(step, plan, this.config, skillsContent);
    const researcher = createResearcherAgent({ backend });
    const architect = createArchitectAgent({ backend });
    const executor = createExecutorAgent({ backend });
    const reviewer = createReviewerAgent({ backend });
    const sequenceMap: Record<TeamMode, Array<'researcher' | 'architect' | 'executor' | 'reviewer'>> = {
      full: ['researcher', 'architect', 'executor', 'reviewer'],
      lean: ['architect', 'executor', 'reviewer'],
      solo: ['executor'],
      research: ['researcher', 'architect']
    };

    let current = context;
    const runAgent = async (role: 'researcher' | 'architect' | 'executor' | 'reviewer'): Promise<void> => {
      const action = await this.events.onBeforeAgentRun?.(role, current, step);
      if (action === 'quit') {
        throw new Error('run-aborted');
      }
      if (action === 'skip') {
        current.history = [...current.history, historyEntry(role, 'Skipped by user.')];
        return;
      }

      this.events.onAgentStart?.(role, current);
      if (role === 'researcher') current = await researcher.run(current, step);
      if (role === 'architect') current = await architect.run(current, step);
      if (role === 'executor') current = await executor.run(current, step);
      if (role === 'reviewer') current = await reviewer.run(current, step);
      const content = current.reviewerNotes ?? current.executorOutput ?? current.architectOutput ?? current.researchOutput ?? '';
      current.history = [...current.history, historyEntry(role, content)];
      this.events.onAgentComplete?.(role, current);
    };

    while (current.attempt <= current.maxAttempts) {
      try {
        for (const role of sequenceMap[this.teamMode]) {
          await runAgent(role);
        }
      } catch (error) {
        if (error instanceof Error && error.message === 'run-aborted') {
          const result = { verdict: 'fail', context: { ...current, reviewerVerdict: 'fail', reviewerNotes: 'Run aborted by user.' } } as StepResult;
          this.events.onStepFail?.(step, result);
          return result;
        }
        throw error;
      }

      if (this.teamMode === 'solo') {
        current.reviewerVerdict = 'pass';
        current.tasksCompleted = step.tasks.map((task) => task.id);
      }
      if (this.teamMode === 'research') {
        current.reviewerVerdict = 'pass';
        current.tasksCompleted = [];
      }

      if (current.reviewerVerdict !== 'retry') {
        const result = { verdict: current.reviewerVerdict ?? 'pass', context: current } as StepResult;
        if (result.verdict === 'pass') {
          this.events.onStepComplete?.(step, result);
        } else {
          this.events.onStepFail?.(step, result);
        }
        return result;
      }

      if (current.attempt >= current.maxAttempts) {
        const result = { verdict: 'fail', context: { ...current, reviewerVerdict: 'fail' } } as StepResult;
        this.events.onStepFail?.(step, result);
        return result;
      }

      current = {
        ...current,
        attempt: current.attempt + 1
      };
      try {
        await runAgent('executor');
        await runAgent('reviewer');
      } catch (error) {
        if (error instanceof Error && error.message === 'run-aborted') {
          const result = { verdict: 'fail', context: { ...current, reviewerVerdict: 'fail', reviewerNotes: 'Run aborted by user.' } } as StepResult;
          this.events.onStepFail?.(step, result);
          return result;
        }
        throw error;
      }
      if (current.reviewerVerdict !== 'retry') {
        const verdict = current.reviewerVerdict ?? 'pass';
        const result = { verdict, context: current } as StepResult;
        if (verdict === 'pass') {
          this.events.onStepComplete?.(step, result);
        } else {
          this.events.onStepFail?.(step, result);
        }
        return result;
      }
    }

    const fallback = { verdict: 'fail', context: current } as StepResult;
    this.events.onStepFail?.(step, fallback);
    return fallback;
  }
}

export { createSharedContext, parseReviewerJson };
