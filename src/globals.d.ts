declare const process: {
  argv: string[];
  cwd(): string;
  env: Record<string, string | undefined>;
  platform: string;
  stdout: { write(message: string): void; isTTY?: boolean };
  stderr: { write(message: string): void };
  stdin: unknown;
  exitCode?: number;
};
