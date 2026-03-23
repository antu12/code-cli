import { execFile } from 'node:child_process';
import { logDebug } from '../../../utils/logger.js';
import type { AIBackend } from './claudeCode.js';
import { createClaudeCodeBackend } from './claudeCode.js';

const BACKEND_TIMEOUT_MS = 5 * 60 * 1000;

export interface CodexOptions {
  model: string;
  approvalMode: 'never' | 'on-request' | 'untrusted';
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

export function createCodexBackend(): AIBackend {
  return {
    name: 'codex',
    async isAvailable(): Promise<boolean> {
      try {
        await execCommand('which', ['codex'], 10_000);
        return true;
      } catch {
        return false;
      }
    },
    async run(prompt: string): Promise<string> {
      try {
        const result = await execCommand('codex', [prompt], BACKEND_TIMEOUT_MS);
        if (process.env.DEBUG === '1') {
          logDebug(`codex stdout:\n${result.stdout}`);
          if (result.stderr) {
            logDebug(`codex stderr:\n${result.stderr}`);
          }
        }
        return result.stdout.trim();
      } catch (error) {
        throw formatBackendError('Codex backend', error);
      }
    }
  };
}

export function getBackend(name: 'claude-code' | 'codex'): AIBackend {
  return name === 'claude-code' ? createClaudeCodeBackend() : createCodexBackend();
}
