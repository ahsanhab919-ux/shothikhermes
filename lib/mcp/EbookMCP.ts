/**
 * MCP E-book Integration Service
 * Integrates with Ebook-MCP server for EPUB/PDF processing
 * https://github.com/onebirdrocks/ebook-mcp
 */

import {
  fetchWithTimeout,
  resolvePublicMcpServerUrl,
} from '@/lib/mcp/config';

export interface MCPTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface MCPResource {
  uri: string;
  mimeType: string;
  text?: string;
  blob?: string;
}

/**
 * Ebook-MCP Server Tools
 * Based on: https://github.com/onebirdrocks/ebook-mcp
 */
export const EbookMCP = {
  // Server Info
  name: 'ebook-mcp',
  version: '1.0.0',
  
  // Available Tools
  tools: {
    /**
     * List all EPUB/PDF files in a directory
     */
    listBooks: {
      name: 'list_books',
      description: 'List all EPUB and PDF files in a specified directory',
      parameters: {
        directory: {
          type: 'string',
          description: 'Path to directory containing books',
          required: true
        },
        recursive: {
          type: 'boolean',
          description: 'Search subdirectories',
          default: false
        }
      }
    },

    /**
     * Extract metadata from EPUB/PDF
     */
    extractMetadata: {
      name: 'extract_metadata',
      description: 'Extract metadata (title, author, etc.) from an e-book',
      parameters: {
        filePath: {
          type: 'string',
          description: 'Path to EPUB or PDF file',
          required: true
        }
      }
    },

    /**
     * Extract table of contents
     */
    extractTOC: {
      name: 'extract_toc',
      description: 'Extract table of contents from an e-book',
      parameters: {
        filePath: {
          type: 'string',
          description: 'Path to EPUB or PDF file',
          required: true
        }
      }
    },

    /**
     * Extract specific chapter/content
     */
    extractChapter: {
      name: 'extract_chapter',
      description: 'Extract content from a specific chapter',
      parameters: {
        filePath: {
          type: 'string',
          description: 'Path to EPUB or PDF file',
          required: true
        },
        chapterId: {
          type: 'string',
          description: 'Chapter ID or number',
          required: true
        },
        format: {
          type: 'string',
          description: 'Output format',
          enum: ['markdown', 'text', 'html'],
          default: 'markdown'
        }
      }
    },

    /**
     * Search within book
     */
    searchBook: {
      name: 'search_book',
      description: 'Search for text within an e-book',
      parameters: {
        filePath: {
          type: 'string',
          description: 'Path to EPUB or PDF file',
          required: true
        },
        query: {
          type: 'string',
          description: 'Search query',
          required: true
        },
        context: {
          type: 'number',
          description: 'Number of surrounding characters',
          default: 200
        }
      }
    },

    /**
     * Get book summary
     */
    summarizeBook: {
      name: 'summarize_book',
      description: 'Generate a summary of the book',
      parameters: {
        filePath: {
          type: 'string',
          description: 'Path to EPUB or PDF file',
          required: true
        },
        maxLength: {
          type: 'number',
          description: 'Maximum summary length in words',
          default: 500
        }
      }
    },

    /**
     * Extract specific pages (PDF only)
     */
    extractPages: {
      name: 'extract_pages',
      description: 'Extract specific pages from a PDF',
      parameters: {
        filePath: {
          type: 'string',
          description: 'Path to PDF file',
          required: true
        },
        startPage: {
          type: 'number',
          description: 'Start page number',
          required: true
        },
        endPage: {
          type: 'number',
          description: 'End page number',
          required: true
        }
      }
    },

    /**
     * Convert book format
     */
    convertBook: {
      name: 'convert_book',
      description: 'Convert between EPUB and PDF formats',
      parameters: {
        inputPath: {
          type: 'string',
          description: 'Path to input file',
          required: true
        },
        outputPath: {
          type: 'string',
          description: 'Path for output file',
          required: true
        },
        outputFormat: {
          type: 'string',
          description: 'Output format',
          enum: ['epub', 'pdf', 'markdown', 'txt'],
          required: true
        }
      }
    }
  },

  /**
   * Example usage for Shothik integration
   */
  examples: {
    // User asks: "What books do I have?"
    listUserBooks: {
      tool: 'list_books',
      params: { directory: '~/Books', recursive: true }
    },

    // User asks: "Tell me about this book"
    getBookInfo: {
      tool: 'extract_metadata',
      params: { filePath: '~/Books/novel.epub' }
    },

    // User asks: "What's in Chapter 3?"
    getChapter: {
      tool: 'extract_chapter',
      params: { 
        filePath: '~/Books/novel.epub', 
        chapterId: 'chapter-3',
        format: 'markdown'
      }
    },

    // User asks: "Find sections about love"
    searchContent: {
      tool: 'search_book',
      params: { 
        filePath: '~/Books/novel.epub', 
        query: 'love',
        context: 300
      }
    },

    // User asks: "Summarize this book"
    getSummary: {
      tool: 'summarize_book',
      params: { 
        filePath: '~/Books/novel.epub',
        maxLength: 1000
      }
    }
  }
};

/**
 * MCP Client for Shothik
 * Handles communication with Ebook-MCP server
 */
export class MCPClient {
  private serverUrl: string;
  private timeoutMs = 10000;

  constructor(serverUrl: string = resolvePublicMcpServerUrl()) {
    this.serverUrl = serverUrl;
  }

  /**
   * Call an MCP tool
   */
  async callTool(toolName: string, params: Record<string, any>): Promise<any> {
    const response = await fetchWithTimeout(`${this.serverUrl}/mcp/tool`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: toolName,
        parameters: params
      })
    }, this.timeoutMs);

    if (!response.ok) {
      throw new Error(`MCP tool call failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * List available tools
   */
  async listTools(): Promise<MCPTool[]> {
    const response = await fetchWithTimeout(`${this.serverUrl}/mcp/tools`, {}, this.timeoutMs);
    return response.json();
  }

  /**
   * Read an MCP resource
   */
  async readResource(uri: string): Promise<MCPResource> {
    const response = await fetchWithTimeout(`${this.serverUrl}/mcp/resource`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri })
    }, this.timeoutMs);

    return response.json();
  }

  // Convenience methods for Ebook-MCP

  async listBooks(directory: string): Promise<any> {
    return this.callTool('list_books', { directory, recursive: true });
  }

  async extractMetadata(filePath: string): Promise<any> {
    return this.callTool('extract_metadata', { filePath });
  }

  async extractTOC(filePath: string): Promise<any> {
    return this.callTool('extract_toc', { filePath });
  }

  async extractChapter(filePath: string, chapterId: string): Promise<any> {
    return this.callTool('extract_chapter', { 
      filePath, 
      chapterId,
      format: 'markdown'
    });
  }

  async searchBook(filePath: string, query: string): Promise<any> {
    return this.callTool('search_book', { 
      filePath, 
      query,
      context: 300
    });
  }

  async summarizeBook(filePath: string, maxLength: number = 500): Promise<any> {
    return this.callTool('summarize_book', { filePath, maxLength });
  }
}

/**
 * LLM-Ready Context Builder
 * Converts MCP responses to LLM-friendly format
 */
export class LLMContextBuilder {
  /**
   * Build context from book metadata
   */
  static fromMetadata(metadata: any): string {
    return `
Book Information:
- Title: ${metadata.title || 'Unknown'}
- Author: ${metadata.author || 'Unknown'}
- Publisher: ${metadata.publisher || 'Unknown'}
- Published: ${metadata.pubDate || 'Unknown'}
- Language: ${metadata.language || 'Unknown'}
- Description: ${metadata.description || 'No description available'}
`.trim();
  }

  /**
   * Build context from table of contents
   */
  static fromTOC(toc: any[]): string {
    const chapters = toc.map((item, idx) => 
      `${idx + 1}. ${item.title}`
    ).join('\n');

    return `Table of Contents:\n${chapters}`;
  }

  /**
   * Build context from chapter content
   */
  static fromChapter(chapter: any): string {
    return `
Chapter: ${chapter.title}

${chapter.content}
`.trim();
  }

  /**
   * Build context from search results
   */
  static fromSearchResults(results: any[]): string {
    return results.map((result, idx) => `
Result ${idx + 1} (Chapter: ${result.chapter}):
"${result.text}"
`).join('\n---\n');
  }

  /**
   * Build complete context for LLM
   */
  static buildCompleteContext(
    metadata: any,
    toc?: any[],
    chapters?: any[],
    searchResults?: any[]
  ): string {
    const parts: string[] = [];

    if (metadata) {
      parts.push(this.fromMetadata(metadata));
    }

    if (toc) {
      parts.push(this.fromTOC(toc));
    }

    if (chapters) {
      chapters.forEach(ch => parts.push(this.fromChapter(ch)));
    }

    if (searchResults) {
      parts.push(this.fromSearchResults(searchResults));
    }

    return parts.join('\n\n---\n\n');
  }
}

// Export singleton
export const mcpClient = new MCPClient();
