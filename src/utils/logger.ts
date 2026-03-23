export function logInfo(message: string): void {
  process.stdout.write(`[code-cli] ${message}\n`);
}
