/**
 * Sheet Service API Client
 * 
 * Connects Sheet Frontend to new Sheet Service Backend (Port 3003)
 */

const SHEET_SERVICE_URL = process.env.NEXT_PUBLIC_SHEET_SERVICE_URL || 'http://localhost:3003';

class SheetServiceClient {
  constructor() {
    this.baseUrl = SHEET_SERVICE_URL;
  }

  /**
   * Create a new sheet generation job
   */
  async createSheet(request) {
    const response = await fetch(`${this.baseUrl}/sheets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create sheet');
    }

    return response.json();
  }

  /**
   * Get sheet job status
   */
  async getSheetStatus(jobId) {
    const response = await fetch(`${this.baseUrl}/sheets/${jobId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get sheet status');
    }

    return response.json();
  }

  /**
   * Stream sheet generation progress
   */
  streamSheetProgress(jobId, callbacks = {}) {
    const eventSource = new EventSource(`${this.baseUrl}/sheets/${jobId}/stream`);

    eventSource.onopen = () => {
      callbacks.onOpen?.();
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callbacks.onMessage?.(data);

        // Auto-close on completion or error
        if (data.status === 'completed' || data.status === 'failed') {
          eventSource.close();
          callbacks.onComplete?.(data);
        }
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      callbacks.onError?.(error);
      eventSource.close();
    };

    return {
      close: () => eventSource.close(),
    };
  }

  /**
   * Export sheet to format
   */
  async exportSheet(jobId, format = 'xlsx') {
    const response = await fetch(`${this.baseUrl}/sheets/${jobId}/export/${format}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Export failed');
    }

    // Get filename from Content-Disposition header
    const disposition = response.headers.get('Content-Disposition');
    let filename = `sheet.${format}`;
    if (disposition) {
      const match = disposition.match(/filename="(.+)"/);
      if (match) filename = match[1];
    }

    // Download file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return { success: true, filename };
  }

  /**
   * Poll sheet status until complete
   */
  async pollUntilComplete(jobId, options = {}) {
    const { interval = 1000, timeout = 60000, onProgress } = options;
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          const result = await this.getSheetStatus(jobId);
          
          onProgress?.(result.data);

          if (result.data.status === 'completed') {
            resolve(result.data);
            return;
          }

          if (result.data.status === 'failed') {
            reject(new Error(result.data.error || 'Sheet generation failed'));
            return;
          }

          // Check timeout
          if (Date.now() - startTime > timeout) {
            reject(new Error('Sheet generation timeout'));
            return;
          }

          // Continue polling
          setTimeout(checkStatus, interval);
        } catch (error) {
          reject(error);
        }
      };

      checkStatus();
    });
  }
}

// Singleton instance
export const sheetService = new SheetServiceClient();

export default sheetService;
