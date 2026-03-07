import { create } from 'zustand';

/** Restricts log severity to four levels so the debug console can color-code and filter entries consistently. */
export type LogLevel = 'info' | 'warn' | 'error' | 'success';

/** Represents a single debug log entry captured from API interceptors, surfaced in the built-in debug console for troubleshooting without devtools. */
export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
  data?: unknown;
}

interface LogStore {
  logs: LogEntry[];
  addLog: (level: LogLevel, category: string, message: string, data?: unknown) => void;
  clear: () => void;
}

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (_key: string, value: unknown) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) return "[Circular]";
      seen.add(value);
    }
    return value;
  };
};

/** In-memory ring buffer (200 entries max) of API calls and errors, powering the built-in debug console without persisting sensitive data to disk. */
export const useLogStore = create<LogStore>((set) => ({
  logs: [],
  addLog: (level, category, message, data) => set((state) => {
    // Data sanitization to prevent crashes
    let safeData = undefined;
    if (data) {
      try {
        safeData = JSON.parse(JSON.stringify(data, getCircularReplacer()));
      } catch (e) {
        safeData = "[Data Error]";
      }
    }

    const newLog: LogEntry = {
      id: Math.random().toString(36).slice(2),
      timestamp: Date.now(),
      level,
      category,
      message,
      data: safeData
    };
    
    // Keep the last 200 logs
    return { logs: [newLog, ...state.logs].slice(0, 200) };
  }),
  clear: () => set({ logs: [] }),
}));
