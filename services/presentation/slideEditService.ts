// Note: extractModifiedContent expects an iframe element, not HTML string
// We'll need to handle this differently

/**
 * Parameters for saving a slide
 */
export interface SaveSlideParams {
  slideId: string;
  presentationId: string;
  htmlContent: string;
  slideIndex?: number;
  metadata?: {
    lastEdited: string;
    editedBy: string;
    version?: number;
  };
}

/**
 * Response from save operation
 */
export interface SaveSlideResponse {
  success: boolean;
  slideId: string;
  version: number;
  savedAt: string;
  conflict?: boolean;
  error?: string;
}

/**
 * Service for saving slide edits to backend
 * Handles API calls, error handling, and conflict resolution
 */
export class SlideEditService {
  /**
   * Get authentication token from storage or state
   */
  private static getAuthToken(): string | null {
    if (typeof window === "undefined") return null;

    // Try to get from localStorage
    const token = localStorage.getItem("accessToken");
    if (token) return token;

    // Try to get from Redux state (if available)
    // This would require accessing the store directly or passing token as param
    return null;
  }

  /**
   * Save slide changes to backend
   */
  static async saveSlide(params: SaveSlideParams): Promise<SaveSlideResponse> {
    try {
      // Use the provided HTML content directly (should already be extracted)
      const htmlContent = params.htmlContent;

      if (!htmlContent) {
        throw new Error("No HTML content provided");
      }

      const token = this.getAuthToken();
      const SLIDE_PREFIX = "/slide";
      const apiUrl = process.env.NEXT_PUBLIC_API_URL + SLIDE_PREFIX;

      if (!apiUrl) {
        throw new Error("Slide API URL not configured");
      }

      // Call API
      const response = await fetch(`${apiUrl}/slides/save`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          htmlContent: htmlContent,
          presentationId: params.presentationId,
          slideIndex: params.slideIndex,
          metadata: {
            ...params.metadata,
            lastEdited: params.metadata?.lastEdited || new Date().toISOString(),
            editedBy: params.metadata?.editedBy || "user",
          },
        }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          // Conflict detected
          return {
            success: false,
            slideId: params.slideId,
            version: 0,
            savedAt: new Date().toISOString(),
            conflict: true,
            error: "Conflict: Slide was modified by another user",
          };
        }

        const errorData = await response.json().catch(() => ({
          message: response.statusText,
        }));

        throw new Error(
          errorData.message || `Save failed: ${response.statusText}`,
        );
      }

      const data = await response.json();

      return {
        success: true,
        slideId: data.slideId || params.slideId,
        version: data.version || 1,
        savedAt: data.savedAt || new Date().toISOString(),
      };
    } catch (error) {
      console.error("Save error:", error);
      return {
        success: false,
        slideId: params.slideId,
        version: 0,
        savedAt: new Date().toISOString(),
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
}
