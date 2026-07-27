/**
 * Centralized Share Service for Shothik
 * Handles all sharing functionality across the application
 */

class ShareService {
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3008";
  }

  /**
   * Create a new share
   * @param {Object} shareData - The data to share
   * @param {Object} options - Sharing options
   * @returns {Promise<Object>} Share result
   */
  async createShare(shareData, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/api/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          content: shareData.content,
          contentType: shareData.contentType,
          title: shareData.title,
          description: shareData.description,
          tags: shareData.tags,
          thumbnail: shareData.thumbnail,
          permissions: {
            isPublic: options.isPublic !== false,
            allowComments: options.allowComments || false,
            allowDownload: options.allowDownload !== false,
            expiresAt: options.expiresAt || null,
            maxViews: options.maxViews || null,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Share creation failed:", response.status, result);
        throw new Error(
          result.message || `Failed to create share (${response.status})`,
        );
      }

      return result;
    } catch (error) {
      console.error("Error creating share:", error);
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error("Network error: Unable to connect to server");
      }
      throw error;
    }
  }

  /**
   * Get share by ID
   * @param {String} shareId - Share ID
   * @returns {Promise<Object>} Share data
   */
  async getShare(shareId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/share/${shareId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to get share");
      }

      return result;
    } catch (error) {
      console.error("Error getting share:", error);
      throw error;
    }
  }

  /**
   * Get user's shares
   * @param {Object} options - Query options
   * @returns {Promise<Array>} User's shares
   */
  async getUserShares(options = {}) {
    try {
      const queryParams = new URLSearchParams();

      if (options.status) queryParams.append("status", options.status);
      if (options.contentType)
        queryParams.append("contentType", options.contentType);
      if (options.limit) queryParams.append("limit", options.limit);
      if (options.skip) queryParams.append("skip", options.skip);

      const response = await fetch(
        `${this.baseUrl}/api/share/user/shares?${queryParams}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.getAuthToken()}`,
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to get user shares");
      }

      return result;
    } catch (error) {
      console.error("Error getting user shares:", error);
      throw error;
    }
  }

  /**
   * Update share
   * @param {String} shareId - Share ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated share
   */
  async updateShare(shareId, updateData) {
    try {
      const response = await fetch(`${this.baseUrl}/api/share/${shareId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update share");
      }

      return result;
    } catch (error) {
      console.error("Error updating share:", error);
      throw error;
    }
  }

  /**
   * Delete share
   * @param {String} shareId - Share ID
   * @returns {Promise<Boolean>} Success status
   */
  async deleteShare(shareId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/share/${shareId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete share");
      }

      return result.success;
    } catch (error) {
      console.error("Error deleting share:", error);
      throw error;
    }
  }

  /**
   * Get share analytics
   * @param {String} shareId - Share ID
   * @returns {Promise<Object>} Analytics data
   */
  async getShareAnalytics(shareId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/share/${shareId}/analytics`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.getAuthToken()}`,
          },
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to get share analytics");
      }

      return result;
    } catch (error) {
      console.error("Error getting share analytics:", error);
      throw error;
    }
  }

  /**
   * Copy share URL to clipboard
   * @param {String} shareUrl - Share URL
   * @returns {Promise<Boolean>} Success status
   */
  async copyToClipboard(shareUrl) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textArea);
        return success;
      }
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      return false;
    }
  }

  /**
   * Generate share URL for different content types
   * @param {String} shareId - Share ID
   * @param {String} contentType - Type of content
   * @returns {String} Complete share URL
   */
  generateShareUrl(shareId, contentType = "research") {
    // Use frontend URL (port 3000) for shared pages, not backend URL (port 3008)
    const frontendUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return `${frontendUrl}/shared/${contentType}/${shareId}`;
  }

  /**
   * Get authentication token
   * @returns {String} Auth token
   */
  getAuthToken() {
    // Get the main access token from localStorage
    return localStorage.getItem("accessToken") || "";
  }

  /**
   * Share research content
   * @param {Object} researchData - Research data to share
   * @param {Object} options - Sharing options
   * @returns {Promise<Object>} Share result
   */
  async shareResearch(researchData, options = {}) {
    const shareData = {
      content: {
        title: researchData.title,
        content: researchData.content,
        sources: researchData.sources,
        query: researchData.query,
        metadata: researchData.metadata,
      },
      contentType: "research",
      title: researchData.title || "Research Results",
      description: `Research results for: ${researchData.query || "Research Query"}`,
      tags: ["research", "ai", "shothik"],
      thumbnail: researchData.thumbnail || null,
    };

    return this.createShare(shareData, options);
  }

  /**
   * Share chat content
   * @param {Object} chatData - Chat data to share
   * @param {Object} options - Sharing options
   * @returns {Promise<Object>} Share result
   */
  async shareChat(chatData, options = {}) {
    const shareData = {
      content: {
        messages: chatData.messages,
        title: chatData.title,
        metadata: chatData.metadata,
      },
      contentType: "chat",
      title: chatData.title || "Chat Conversation",
      description: `Chat conversation with ${chatData.messages?.length || 0} messages`,
      tags: ["chat", "conversation", "shothik"],
      thumbnail: chatData.thumbnail || null,
    };

    return this.createShare(shareData, options);
  }

  /**
   * Share document content
   * @param {Object} documentData - Document data to share
   * @param {Object} options - Sharing options
   * @returns {Promise<Object>} Share result
   */
  async shareDocument(documentData, options = {}) {
    const shareData = {
      content: {
        title: documentData.title,
        content: documentData.content,
        type: documentData.type,
        metadata: documentData.metadata,
      },
      contentType: "document",
      title: documentData.title || "Document",
      description: `Document: ${documentData.type || "Unknown type"}`,
      tags: ["document", "shothik"],
      thumbnail: documentData.thumbnail || null,
    };

    return this.createShare(shareData, options);
  }
}

// Create and export a singleton instance
const shareService = new ShareService();
export default shareService;
