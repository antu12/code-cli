export interface MemoryEntry {
  timestamp: string;
  message: string;
}

export interface RuntimeContext {
  entries: MemoryEntry[];
}

export function createRuntimeContext(): RuntimeContext {
  return { entries: [] };
}
