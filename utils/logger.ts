
export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'req' | 'res' | 'err' | 'info' | 'warn';
  title: string;
  data?: any;
}

type Listener = (logs: LogEntry[]) => void;

let logs: LogEntry[] = [];
const listeners = new Set<Listener>();

export const logger = {
  add: (type: LogEntry['type'], title: string, data?: any) => {
    const entry: LogEntry = {
      id: Math.random().toString(36).slice(2),
      timestamp: Date.now(),
      type,
      title,
      data
    };
    // Keep last 100 logs
    logs = [entry, ...logs].slice(0, 100);
    listeners.forEach(l => l(logs));
    
    // Also log to console for backup
    if (type === 'err') console.error(`[${title}]`, data);
    else if (type === 'warn') console.warn(`[${title}]`, data);
    else console.log(`[${type.toUpperCase()}][${title}]`, data);
  },

  req: (title: string, data?: any) => logger.add('req', title, data),
  res: (title: string, data?: any) => logger.add('res', title, data),
  err: (title: string, data?: any) => logger.add('err', title, data),
  info: (title: string, data?: any) => logger.add('info', title, data),
  warn: (title: string, data?: any) => logger.add('warn', title, data),

  subscribe: (fn: Listener) => {
    listeners.add(fn);
    fn(logs);
    return () => listeners.delete(fn);
  },

  clear: () => {
    logs = [];
    listeners.forEach(l => l(logs));
  }
};