/**
 * File Upload Helpers
 * Manages blob URLs to prevent memory leaks
 */

export class FileURLManager {
  constructor() {
    this.urls = new Set();
  }

  /**
   * Create a blob URL and track it
   * @param {Blob} blob - The blob to create URL for
   * @returns {string} - The created URL
   */
  create(blob) {
    const url = URL.createObjectURL(blob);
    this.urls.add(url);
    return url;
  }

  /**
   * Revoke a specific URL
   * @param {string} url - The URL to revoke
   */
  revoke(url) {
    if (this.urls.has(url)) {
      URL.revokeObjectURL(url);
      this.urls.delete(url);
    }
  }

  /**
   * Revoke all tracked URLs
   */
  revokeAll() {
    this.urls.forEach((url) => URL.revokeObjectURL(url));
    this.urls.clear();
  }

  /**
   * Get count of tracked URLs
   * @returns {number}
   */
  getCount() {
    return this.urls.size;
  }
}
