/**
 * MCP Client - Integration with Ebook-MCP server
 * Provides EPUB/PDF processing capabilities
 */

import { fetchWithTimeout, resolvePublicMcpServerUrl } from '@/lib/mcp/config';

export interface MCPConfig {
  serverUrl: string;
  timeout?: number;
}

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

export interface ListBooksParams {
  directory: string;
  recursive?: boolean;
}

export interface ExtractMetadataParams {
  filePath: string;
}

export interface ExtractChapterParams {
  filePath: string;
  chapterId: string;
  format?: 'markdown' | 'text' | 'html';
}

export interface SearchBookParams {
  filePath: string;
  query: string;
  context?: number;
}

export interface SummarizeBookParams {
  filePath: string;
  maxLength?: number;
}

export interface BookMetadata {
  title?: string;
  author?: string;
  publisher?: string;
  pubDate?: string;
  language?: string;
  description?: string;
  isbn?: string;
}

export interface TocEntry {
  id: string;
  label: string;
  href: string;
  children?: TocEntry[];
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
}

export interface SearchResult {
  chapter: string;
  text: string;
  context: string;
}

export class MCPClient {
  private config: MCPConfig;

  constructor(config: MCPConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    };
  }

  /**
   * List available tools from MCP server
   */
  async listTools(): Promise<MCPTool[]> {
    const response = await fetchWithTimeout(`${this.config.serverUrl}/mcp/tools`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }, this.config.timeout);

    if (!response.ok) {
      throw new Error(`Failed to list tools: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Call an MCP tool
   */
  private async callTool<T>(name: string, parameters: Record<string, any>): Promise<T> {
    const response = await fetchWithTimeout(`${this.config.serverUrl}/mcp/tool`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parameters }),
    }, this.config.timeout);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Tool call failed: ${error}`);
    }

    return response.json();
  }

  /**
   * List all EPUB/PDF files in a directory
   */
  async listBooks(params: ListBooksParams): Promise<{
    files: Array<{
      path: string;
      name: string;
      size: number;
      modified: string;
      type: 'epub' | 'pdf';
    }>;
  }> {
    return this.callTool('list_books', {
      directory: params.directory,
      recursive: params.recursive ?? false,
    });
  }

  /**
   * Extract metadata from an e-book
   */
  async extractMetadata(params: ExtractMetadataParams): Promise<BookMetadata> {
    return this.callTool('extract_metadata', {
      filePath: params.filePath,
    });
  }

  /**
   * Extract table of contents
   */
  async extractTOC(params: { filePath: string }): Promise<{
    toc: TocEntry[];
  }> {
    return this.callTool('extract_toc', {
      filePath: params.filePath,
    });
  }

  /**
   * Extract specific chapter
   */
  async extractChapter(params: ExtractChapterParams): Promise<Chapter> {
    return this.callTool('extract_chapter', {
      filePath: params.filePath,
      chapterId: params.chapterId,
      format: params.format ?? 'markdown',
    });
  }

  /**
   * Search within a book
   */
  async searchBook(params: SearchBookParams): Promise<{
    results: SearchResult[];
  }> {
    return this.callTool('search_book', {
      filePath: params.filePath,
      query: params.query,
      context: params.context ?? 200,
    });
  }

  /**
   * Generate book summary
   */
  async summarizeBook(params: SummarizeBookParams): Promise<{
    summary: string;
    keyPoints: string[];
  }> {
    return this.callTool('summarize_book', {
      filePath: params.filePath,
      maxLength: params.maxLength ?? 500,
    });
  }

  /**
   * Extract specific pages (PDF only)
   */
  async extractPages(params: {
    filePath: string;
    startPage: number;
    endPage: number;
  }): Promise<{
    pages: Array<{
      pageNumber: number;
      content: string;
    }>;
  }> {
    return this.callTool('extract_pages', {
      filePath: params.filePath,
      startPage: params.startPage,
      endPage: params.endPage,
    });
  }

  /**
   * Convert book format
   */
  async convertBook(params: {
    inputPath: string;
    outputPath: string;
    outputFormat: 'epub' | 'pdf' | 'markdown' | 'txt';
  }): Promise<{
    outputPath: string;
    success: boolean;
  }> {
    return this.callTool('convert_book', {
      inputPath: params.inputPath,
      outputPath: params.outputPath,
      outputFormat: params.outputFormat,
    });
  }

  /**
   * Check if MCP server is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetchWithTimeout(`${this.config.serverUrl}/health`, {
        method: 'GET',
      }, 5000);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Process book for Shothik import
   * Extracts all relevant information for importing into a project
   */
  async processForImport(filePath: string): Promise<{
    metadata: BookMetadata;
    toc: TocEntry[];
    chapters: Chapter[];
    summary: string;
  }> {
    // Extract all information in parallel
    const [metadata, toc, summary] = await Promise.all([
      this.extractMetadata({ filePath }),
      this.extractTOC({ filePath }),
      this.summarizeBook({ filePath, maxLength: 1000 }),
    ]);

    // Extract all chapters
    const chapters: Chapter[] = [];
    for (const entry of toc.toc) {
      try {
        const chapter = await this.extractChapter({
          filePath,
          chapterId: entry.id,
          format: 'markdown',
        });
        chapters.push(chapter);
      } catch (error) {
        console.warn(`Failed to extract chapter ${entry.id}:`, error);
      }
    }

    return {
      metadata,
      toc: toc.toc,
      chapters,
      summary: summary.summary,
    };
  }
}

// Export singleton instance
export const mcpClient = new MCPClient({
  serverUrl: resolvePublicMcpServerUrl(),
});
