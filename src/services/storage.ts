/** Minimal key-value contract the app needs. Keeps persistence testable. */
export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** In-memory implementation used by tests and as a safe fallback. */
export function createMemoryStorage(
  initial: Record<string, string> = {},
): KeyValueStorage & { dump(): Record<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    getItem: async key => data.get(key) ?? null,
    setItem: async (key, value) => {
      data.set(key, value);
    },
    removeItem: async key => {
      data.delete(key);
    },
    dump: () => Object.fromEntries(data),
  };
}
