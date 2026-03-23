declare module 'commander' {
  export class Command {
    constructor(name?: string);
    name(value: string): this;
    description(value: string): this;
    version(value: string): this;
    command(name: string): Command;
    action(fn: () => void | Promise<void>): this;
    parseAsync(argv: string[]): Promise<this>;
  }
}

declare module '@clack/prompts' {
  export function intro(message: string): void;
}
