declare module 'commander' {
  export type ActionHandler = (...args: string[]) => void | Promise<void>;

  export class Command {
    constructor(name?: string);
    name(value: string): this;
    description(value: string): this;
    version(value: string): this;
    command(name: string): Command;
    action(fn: ActionHandler): this;
    option(flags: string, description?: string): this;
    parseAsync(argv: string[]): Promise<this>;
  }
}

declare module '@clack/prompts' {
  export function intro(message: string): void;
  export function outro(message: string): void;
  export function text(options: {
    message: string;
    placeholder?: string;
    initialValue?: string;
    defaultValue?: string;
    validate?: (value: string) => string | undefined;
  }): Promise<string | symbol>;
  export function select<T extends string>(options: {
    message: string;
    options: Array<{ value: T; label: string; hint?: string }>;
    initialValue?: T;
  }): Promise<T | symbol>;
  export function confirm(options: {
    message: string;
    initialValue?: boolean;
  }): Promise<boolean | symbol>;
  export function isCancel(value: unknown): boolean;
  export function cancel(message: string): void;
}

declare module 'chalk' {
  interface ChalkFn {
    (text: string): string;
    bold: ChalkFn;
    dim: ChalkFn;
    gray: ChalkFn;
    green: ChalkFn;
    yellow: ChalkFn;
    red: ChalkFn;
    blue: ChalkFn;
    cyan: ChalkFn;
    magenta: ChalkFn;
    white: ChalkFn;
  }

  const chalk: ChalkFn;
  export default chalk;
}

declare module 'node:fs/promises' {
  export function readFile(path: string, encoding: string): Promise<string>;
  export function writeFile(path: string, data: string, encoding?: string): Promise<void>;
  export function access(path: string): Promise<void>;
}

declare module 'node:child_process' {
  export interface ExecFileException extends Error {
    code?: number | string;
    signal?: string;
    stdout?: string;
    stderr?: string;
  }

  export function execFile(
    file: string,
    args?: string[],
    options?: { timeout?: number; maxBuffer?: number; env?: Record<string, string | undefined> },
    callback?: (error: ExecFileException | null, stdout: string, stderr: string) => void
  ): void;
}

declare module 'node:util' {
  export function promisify<T>(fn: T): T;
}

declare module 'node:path' {
  export function join(...parts: string[]): string;
  export function resolve(...parts: string[]): string;
}

declare module 'node:readline/promises' {
  export class Interface {
    question(prompt: string): Promise<string>;
    close(): void;
  }

  export function createInterface(options: { input: unknown; output: unknown }): Interface;
}

declare module 'node:process' {
  const process: {
    argv: string[];
    cwd(): string;
    env: Record<string, string | undefined>;
    platform: string;
    stdout: { write(message: string): void; isTTY?: boolean };
    stderr: { write(message: string): void };
    stdin: unknown;
    exitCode?: number;
  };
  export default process;
}

declare module 'node:timers/promises' {
  export function setTimeout(delay: number): Promise<void>;
}

declare module 'node:url' {
  export function fileURLToPath(url: string | URL): string;
}

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
