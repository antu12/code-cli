export interface AppConfig {
  agent: 'claude-code' | 'codex';
  teamMode: 'full' | 'lean' | 'solo' | 'research';
}

export const defaultConfig: AppConfig = {
  agent: 'claude-code',
  teamMode: 'full'
};
