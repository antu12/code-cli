import { existsSync, readdirSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { join } from 'node:path';

export function getAvailabilityCommand(binary: string, platform = process.platform): { file: string; args: string[] } {
  if (platform === 'win32') {
    return { file: 'where.exe', args: [binary] };
  }

  return { file: 'which', args: [binary] };
}

export function getClaudeGitBashPath(env = process.env): string | undefined {
  if (env.CLAUDE_CODE_GIT_BASH_PATH) {
    return env.CLAUDE_CODE_GIT_BASH_PATH;
  }

  if (process.platform !== 'win32') {
    return undefined;
  }

  const candidates = [
    'C:\\Program Files\\Git\\bin\\bash.exe',
    'C:\\Program Files\\Git\\usr\\bin\\bash.exe'
  ];

  return candidates.find((candidate) => existsSync(candidate));
}

export function getCodexCliPath(env = process.env): string | undefined {
  if (env.CODEX_CLI_PATH) {
    return env.CODEX_CLI_PATH;
  }

  if (process.platform !== 'win32') {
    return undefined;
  }

  const userProfile = env.USERPROFILE;
  if (!userProfile) {
    return undefined;
  }

  const extensionRoots = [
    join(userProfile, '.vscode', 'extensions'),
    join(userProfile, '.vscode-insiders', 'extensions')
  ];

  for (const root of extensionRoots) {
    if (!existsSync(root)) {
      continue;
    }

    for (const entry of readdirSync(root)) {
      if (!/^openai\.chatgpt-/i.test(entry)) {
        continue;
      }

      const candidate = join(root, entry, 'bin', 'windows-x86_64', 'codex.exe');
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return undefined;
}

function execCommand(file: string, args: string[], env = process.env): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(file, args, { timeout: 10_000, maxBuffer: 10 * 1024 * 1024, env }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

export async function resolveExecutablePath(binary: string, env = process.env): Promise<string> {
  const override = binary === 'codex' ? getCodexCliPath(env) : env.CLAUDE_CODE_CLI_PATH;
  if (override) {
    return override;
  }

  const command = getAvailabilityCommand(binary);
  try {
    const result = await execCommand(command.file, command.args, env);
    const match = result.stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean);

    if (match) {
      return match;
    }
  } catch {
    // Fall back to the bare command name below.
  }

  return binary;
}
