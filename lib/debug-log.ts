'use client';

export type LogLevel = 'info' | 'warn' | 'error' | 'api';

export interface DebugLogEntry {
  id: number;
  timestamp: number;
  level: LogLevel;
  source: string;
  message: string;
  meta?: Record<string, any>;
}

type LogListener = (entry: DebugLogEntry) => void;

const MAX_ENTRIES = 500;

function sanitizeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl, window.location.origin);
    return parsed.pathname;
  } catch {
    return rawUrl.split('?')[0].split('#')[0];
  }
}

function isSameOriginApi(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl, window.location.origin);
    if (parsed.origin !== window.location.origin) return false;
    return parsed.pathname.startsWith('/api/');
  } catch {
    return rawUrl.startsWith('/api/');
  }
}

class DebugLogStore {
  private entries: DebugLogEntry[] = [];
  private nextId = 1;
  private listeners: Set<LogListener> = new Set();
  private originalFetch: typeof fetch | null = null;
  private interceptorInstalled = false;
  private handlersInstalled = false;
  private errorHandler: ((event: ErrorEvent) => void) | null = null;
  private rejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null;

  private add(level: LogLevel, source: string, message: string, meta?: Record<string, any>) {
    const entry: DebugLogEntry = {
      id: this.nextId++,
      timestamp: Date.now(),
      level,
      source,
      message,
      meta,
    };

    this.entries.push(entry);
    if (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(-MAX_ENTRIES);
    }

    this.listeners.forEach(fn => {
      try { fn(entry); } catch {}
    });
  }

  info(source: string, message: string, meta?: Record<string, any>) {
    this.add('info', source, message, meta);
  }

  warn(source: string, message: string, meta?: Record<string, any>) {
    this.add('warn', source, message, meta);
  }

  error(source: string, message: string, meta?: Record<string, any>) {
    this.add('error', source, message, meta);
  }

  api(source: string, message: string, meta?: Record<string, any>) {
    this.add('api', source, message, meta);
  }

  getAll(): DebugLogEntry[] {
    return [...this.entries];
  }

  clear() {
    this.entries = [];
    this.nextId = 1;
  }

  subscribe(fn: LogListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  export(): string {
    const lines = this.entries.map(e => {
      const time = new Date(e.timestamp).toISOString();
      const level = e.level.toUpperCase().padEnd(5);
      const metaStr = e.meta ? ` | ${JSON.stringify(e.meta)}` : '';
      return `[${time}] ${level} [${e.source}] ${e.message}${metaStr}`;
    });
    return [
      `=== Shothik Debug Log ===`,
      `Exported: ${new Date().toISOString()}`,
      `Entries: ${this.entries.length}`,
      `User-Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}`,
      `URL: ${typeof window !== 'undefined' ? window.location.pathname : 'N/A'}`,
      `---`,
      ...lines,
    ].join('\n');
  }

  installFetchInterceptor() {
    if (this.interceptorInstalled || typeof window === 'undefined') return;
    this.interceptorInstalled = true;
    this.originalFetch = window.fetch.bind(window);

    const self = this;
    window.fetch = async function interceptedFetch(input: RequestInfo | URL, init?: RequestInit) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;

      if (!isSameOriginApi(url)) {
        return self.originalFetch!(input, init);
      }

      const method = init?.method?.toUpperCase()
        || (input instanceof Request ? input.method.toUpperCase() : 'GET');
      const start = performance.now();
      const safePath = sanitizeUrl(url);

      try {
        const response = await self.originalFetch!(input, init);
        const duration = Math.round(performance.now() - start);

        if (response.ok) {
          self.api('fetch', `${method} ${safePath} → ${response.status}`, {
            duration: `${duration}ms`,
            status: response.status,
          });
        } else {
          self.warn('fetch', `${method} ${safePath} → ${response.status}`, {
            duration: `${duration}ms`,
            status: response.status,
          });
        }
        return response;
      } catch (err: any) {
        const duration = Math.round(performance.now() - start);
        self.error('fetch', `${method} ${safePath} FAILED: ${err.message}`, {
          duration: `${duration}ms`,
          error: err.message,
        });
        throw err;
      }
    };
  }

  installGlobalErrorHandlers() {
    if (this.handlersInstalled || typeof window === 'undefined') return;
    this.handlersInstalled = true;

    this.errorHandler = (event: ErrorEvent) => {
      this.error('window', `Uncaught: ${event.message}`, {
        filename: event.filename,
        line: event.lineno,
        col: event.colno,
      });
    };

    this.rejectionHandler = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || event.reason?.toString() || 'Unknown rejection';
      this.error('promise', `Unhandled rejection: ${reason}`);
    };

    window.addEventListener('error', this.errorHandler);
    window.addEventListener('unhandledrejection', this.rejectionHandler);
  }

  removeGlobalErrorHandlers() {
    if (!this.handlersInstalled || typeof window === 'undefined') return;
    if (this.errorHandler) window.removeEventListener('error', this.errorHandler);
    if (this.rejectionHandler) window.removeEventListener('unhandledrejection', this.rejectionHandler);
    this.handlersInstalled = false;
    this.errorHandler = null;
    this.rejectionHandler = null;
  }
}

export const debugLog = new DebugLogStore();
