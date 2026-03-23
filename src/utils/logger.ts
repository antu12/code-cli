export function logInfo(message: string): void {
  process.stdout.write(`[code-cli] ${message}\n`);
}

export function logError(message: string): void {
  process.stderr.write(`[code-cli:error] ${message}\n`);
}

export function logDebug(message: string): void {
  if (process.env.DEBUG === '1') {
    process.stdout.write(`[code-cli:debug] ${message}\n`);
  }
}
