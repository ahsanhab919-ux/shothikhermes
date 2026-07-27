/**
 * Upload Queue
 * Manages concurrent upload limits to prevent server overload
 */

export class UploadQueue {
  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent;
    this.active = 0;
    this.queue = [];
  }

  /**
   * Add an upload function to the queue
   * @param {Function} uploadFn - The async upload function to execute
   * @returns {Promise<void>}
   */
  async add(uploadFn) {
    // Wait if at capacity
    while (this.active >= this.maxConcurrent) {
      await new Promise((resolve) => this.queue.push(resolve));
    }

    this.active++;

    try {
      await uploadFn();
    } finally {
      this.active--;
      // Start next in queue
      const next = this.queue.shift();
      if (next) next();
    }
  }

  /**
   * Get current queue statistics
   * @returns {{active: number, queued: number}}
   */
  getStats() {
    return {
      active: this.active,
      queued: this.queue.length,
    };
  }

  /**
   * Check if queue is empty
   * @returns {boolean}
   */
  isEmpty() {
    return this.active === 0 && this.queue.length === 0;
  }
}
