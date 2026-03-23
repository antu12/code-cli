export interface ExecutorConfig {
  backend: 'claude-code' | 'codex';
}

export function createExecutor(config: ExecutorConfig): ExecutorConfig {
  return config;
}
