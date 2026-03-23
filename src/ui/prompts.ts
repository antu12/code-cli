export interface PlanningAnswers {
  projectName: string;
  description: string;
  language: string;
  framework: string;
  database: string;
  features: string[];
  constraints?: string;
  agent: 'claude-code' | 'codex';
  teamMode: 'full' | 'lean' | 'solo' | 'research';
  confirmationMode: 'per-step' | 'per-agent' | 'auto';
}
