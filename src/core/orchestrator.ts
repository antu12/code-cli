export interface AgentMessage {
  role: string;
  content: string;
}

export interface TechStack {
  language: string;
  framework: string;
  database: string;
}

export interface SharedContext {
  stepGoal: string;
  techStack: TechStack;
  skills: string[];
  researchOutput?: string;
  architectOutput?: string;
  executorOutput?: string;
  reviewerVerdict?: 'pass' | 'retry' | 'fail';
  reviewerNotes?: string;
  attempt: number;
  history: AgentMessage[];
}

export function createSharedContext(stepGoal: string): SharedContext {
  return {
    stepGoal,
    techStack: {
      language: 'TypeScript',
      framework: 'Node.js CLI',
      database: 'none'
    },
    skills: [],
    attempt: 1,
    history: []
  };
}
