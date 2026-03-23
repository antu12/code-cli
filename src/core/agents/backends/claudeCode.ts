import { execFile } from 'node:child_process';
import { logDebug } from '../../../utils/logger.js';
import { getAvailabilityCommand, getClaudeGitBashPath, resolveExecutablePath } from './availability.js';

const BACKEND_TIMEOUT_MS = 5 * 60 * 1000;

export interface AIBackend {
  name: 'claude-code' | 'codex';
  isAvailable(): Promise<boolean>;
  run(prompt: string, options?: { cwd?: string }): Promise<string>;
}

export interface ClaudeCodeOptions {
  model: string;
  maxTokens: number;
}

function execCommand(file: string, args: string[], timeout: number, cwd?: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const gitBashPath = getClaudeGitBashPath(process.env);
    const env = {
      ...process.env,
      ...(gitBashPath ? { CLAUDE_CODE_GIT_BASH_PATH: gitBashPath } : {})
    };
    execFile(file, args, { cwd, timeout, maxBuffer: 10 * 1024 * 1024, env }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

function formatBackendError(prefix: string, error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  const stderr = typeof error === 'object' && error !== null && 'stderr' in error ? String(error.stderr ?? '').trim() : '';
  if (message.includes('timed out')) {
    return new Error(`${prefix} timed out after 5 minutes.`);
  }
  if (stderr) {
    return new Error(`${prefix} failed: ${stderr}`);
  }
  return new Error(`${prefix} failed: ${message}`);
}

export function createClaudeCodeBackend(): AIBackend {
  return {
    name: 'claude-code',
    async isAvailable(): Promise<boolean> {
      try {
        const command = getAvailabilityCommand('claude');
        await execCommand(command.file, command.args, 10_000);
        return true;
      } catch {
        return false;
      }
    },
    async run(prompt: string, options?: { cwd?: string }): Promise<string> {
      try {
        const executable = await resolveExecutablePath('claude');
        const result = await execCommand(executable, ['--print', prompt], BACKEND_TIMEOUT_MS, options?.cwd);
        if (process.env.DEBUG === '1') {
          logDebug(`claude stdout:\n${result.stdout}`);
          if (result.stderr) {
            logDebug(`claude stderr:\n${result.stderr}`);
          }
        }
        return result.stdout.trim();
      } catch (error) {
        throw formatBackendError('Claude Code backend', error);
      }
    }
  };
}
