/**
 * Stitch AI MCP Client
 * Integration with Stitch AI's decentralized knowledge hub
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import {
  buildMcpHeaders,
  fetchWithTimeout,
  resolveStitchConfig,
  safeJsonParse,
} from '@/lib/mcp/config';

type StitchConnectionState = 'idle' | 'connecting' | 'connected' | 'degraded';

class StitchAIClient {
  private client: Client | null = null;
  private connected = false;
  private connectPromise: Promise<boolean> | null = null;
  private status: StitchConnectionState = 'idle';
  private lastError: string | null = null;
  private readonly config = resolveStitchConfig();

  getStatus() {
    return {
      connected: this.connected,
      state: this.status,
      lastError: this.lastError,
      baseUrl: this.config.baseUrl,
    };
  }

  private getLocalSpaces(): any[] {
    if (typeof window === 'undefined') return [];
    return safeJsonParse(localStorage.getItem('shothik-presentation-spaces'), []);
  }

  private getLocalMemories(space: string): any[] {
    if (typeof window === 'undefined') return [];
    return safeJsonParse(localStorage.getItem(`shothik-memories-${space}`), []);
  }

  private async callTool<T>(name: string, args: Record<string, unknown>): Promise<T> {
    if (!this.client) {
      const connected = await this.connect();
      if (!connected || !this.client) {
        throw new Error('Stitch client is not connected');
      }
    }

    if (!this.client) {
      throw new Error('Stitch client is not connected');
    }
    const response = await this.client.callTool({
      name,
      arguments: args,
    });
    const typed = response as { structuredContent?: T; content?: unknown };
    if (typed.structuredContent) {
      return typed.structuredContent;
    }
    return (typed.content ?? {}) as T;
  }

  async connect(): Promise<boolean> {
    if (this.connected && this.client) {
      return true;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.status = 'connecting';
    const headers = buildMcpHeaders(this.config.apiKey);

    this.connectPromise = (async () => {
      try {
        this.client = new Client({
          name: 'shothik-slide-generation',
          version: '1.0.0',
        });

        const transport = new SSEClientTransport(new URL(`${this.config.baseUrl}/mcp`), {
          eventSourceInit: {
            fetch: (url, init) =>
              fetchWithTimeout(
                url,
                {
                  ...init,
                  headers: {
                    ...(init?.headers ?? {}),
                    ...headers,
                  },
                },
                this.config.timeoutMs,
              ),
          },
          requestInit: {
            headers,
          },
        });

        await Promise.race([
          this.client.connect(transport),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Stitch connection timed out')), this.config.timeoutMs);
          }),
        ]);

        this.connected = true;
        this.status = 'connected';
        this.lastError = null;
        console.log('[StitchAI] Connected successfully');
        return true;
      } catch (error) {
        console.error('[StitchAI] Connection failed:', error);
        this.connected = false;
        this.status = 'degraded';
        this.lastError = error instanceof Error ? error.message : 'Unknown Stitch connection error';
        this.client = null;
        return false;
      } finally {
        this.connectPromise = null;
      }
    })();

    return this.connectPromise;
  }

  async createSpace(spaceName: string, type: string = 'presentation'): Promise<string | null> {
    if (!(await this.connect()) || !this.client) {
      // Fallback: return local ID
      return `local-${Date.now()}`;
    }

    try {
      const result = await this.callTool<{ space_id?: string }>('create_space', {
        space_name: spaceName,
        type,
      });
      return result.space_id ?? `local-${Date.now()}`;
    } catch (error) {
      console.error('[StitchAI] create_space failed:', error);
      return `local-${Date.now()}`;
    }
  }

  async getAllSpaces(): Promise<any[]> {
    if (!(await this.connect()) || !this.client) {
      // Fallback: return from localStorage
      return this.getLocalSpaces();
    }

    try {
      const result = await this.callTool<{ spaces?: any[] }>('get_all_spaces', {});
      return result.spaces || [];
    } catch (error) {
      console.error('[StitchAI] get_all_spaces failed:', error);
      return this.getLocalSpaces();
    }
  }

  async uploadMemory(
    space: string,
    message: string,
    memory: Record<string, any>
  ): Promise<boolean> {
    if (!(await this.connect()) || !this.client) {
      // Fallback: save to localStorage
      return this.saveLocalMemory(space, message, memory);
    }

    try {
      await this.callTool('upload_memory', {
        space,
        message,
        memory: JSON.stringify(memory),
      });
      return true;
    } catch (error) {
      console.error('[StitchAI] upload_memory failed:', error);
      return this.saveLocalMemory(space, message, memory);
    }
  }

  async getAllMemories(space: string, limit: number = 50): Promise<any[]> {
    if (!(await this.connect()) || !this.client) {
      return this.getLocalMemories(space);
    }

    try {
      const result = await this.callTool<{ memories?: any[] }>('get_all_memories', {
        space,
        limit,
      });
      return result.memories || [];
    } catch (error) {
      console.error('[StitchAI] get_all_memories failed:', error);
      return this.getLocalMemories(space);
    }
  }

  private saveLocalMemory(
    space: string,
    message: string,
    memory: Record<string, any>
  ): boolean {
    if (typeof window === 'undefined') return false;
    
    const memories = this.getLocalMemories(space);
    memories.push({
      id: `local-${Date.now()}`,
      space,
      message,
      memory,
      createdAt: new Date().toISOString(),
    });
    
    localStorage.setItem(
      `shothik-memories-${space}`,
      JSON.stringify(memories)
    );
    return true;
  }
}

// Singleton instance
let stitchClient: StitchAIClient | null = null;

export function getStitchClient(): StitchAIClient {
  if (!stitchClient) {
    stitchClient = new StitchAIClient();
  }
  return stitchClient;
}

export default StitchAIClient;
