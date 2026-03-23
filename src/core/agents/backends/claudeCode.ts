import { execFile } from 'node:child_process';
import { logDebug } from '../../../utils/logger.js';
import { getAvailabilityCommand } from './availability.js';

const BACKEND_TIMEOUT_MS = 5 * 60 * 1000;

export interface AIBackend {
  name: 'claude-code' | 'codex';
  isAvailable(): Promise<boolean>;
  run(prompt: string): Promise<string>;
}

export interface ClaudeCodeOptions {
  model: string;
  maxTokens: number;
}

function execCommand(file: string, args: string[], timeout: number): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(file, args, { timeout, maxBuffer: 10 * 1024 * 1024, env: process.env }, (error, stdout, stderr) => {
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
  if (message.includes('timed out')) {
    return new Error(`${prefix} timed out after 5 minutes.`);
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
    async run(prompt: string): Promise<string> {
      try {
        const result = await execCommand('claude', ['--print', prompt], BACKEND_TIMEOUT_MS);
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
