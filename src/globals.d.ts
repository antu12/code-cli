declare const process: {
  argv: string[];
  stdout: { write(message: string): void };
  stderr: { write(message: string): void };
  exitCode?: number;
};
