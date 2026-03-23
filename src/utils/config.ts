import { readFile } from 'node:fs/promises';

export type BackendName = 'claude-code' | 'codex';
export type TeamMode = 'full' | 'lean' | 'solo' | 'research';
export type ConfirmationMode = 'per-step' | 'per-agent' | 'auto';

export interface AIOConfig {
  agent: BackendName;
  teamMode: TeamMode;
  confirmationMode: ConfirmationMode;
  planFile: string;
  skillsDir: string;
  maxAttempts: number;
}

export const defaultConfig: AIOConfig = {
  agent: 'claude-code',
  teamMode: 'full',
  confirmationMode: 'per-step',
  planFile: 'PLAN.md',
  skillsDir: './skills',
  maxAttempts: 2
};

export async function loadConfig(configFile = '.aiorc.json'): Promise<AIOConfig> {
  try {
    const raw = await readFile(configFile, 'utf8');
    const parsed = JSON.parse(raw) as Partial<AIOConfig>;
    return {
      ...defaultConfig,
      ...parsed
    };
  } catch {
    return { ...defaultConfig };
  }
}
