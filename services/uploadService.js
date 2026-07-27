import { parseUploadError, UploadError } from "@/utils/paraphrase/uploadErrors";

class UploadService {
  constructor() {
    this.apiBase = `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_PARAPHRASE_REDIRECT_PREFIX}/api`;
    this.activeRequests = new Map(); // Track active XHR requests for cancellation
  }

  /**
   * Upload a single file with real-time progress tracking using XHR
   */
  async uploadFile({
    file,
    mode,
    synonym,
    language,
    freezeWords = [],
    accessToken,
    onProgress,
    fileId, // Add fileId for request tracking
  }) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Store request for potential cancellation
      if (fileId) {
        this.activeRequests.set(fileId, xhr);
      }

      // Build FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode?.toLowerCase() ?? "");
      formData.append("synonym", synonym?.toLowerCase() ?? "");
      formData.append("freeze", freezeWords);
      formData.append("language", language ?? "");

      // Configure XHR
      xhr.open("POST", `${this.apiBase}/files/file-paraphrase`, true);
      xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
      xhr.responseType = "blob";

      // Progress event handler
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = Math.round(
            (event.loaded / event.total) * 100,
          );
          onProgress(percentComplete);
        }
      });

      // Success handler
      xhr.addEventListener("load", async () => {
        // Cleanup
        if (fileId) {
          this.activeRequests.delete(fileId);
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          // Success - return blob
          resolve(xhr.response);
        } else {
          // Error - parse error response
          try {
            // Convert blob to text to parse error
            const errorBlob = xhr.response;
            const errorText = await errorBlob.text();
            let errorData = {};

            try {
              errorData = JSON.parse(errorText);
            } catch {
              // Not JSON, use default error
            }

            // Create mock response object for parseUploadError
            const mockResponse = {
              status: xhr.status,
              json: async () => errorData,
            };

            const error = await parseUploadError(mockResponse);
            reject(error);
          } catch (parseError) {
            reject(
              new UploadError(
                "Upload failed. Please try again.",
                "UPLOAD_FAILED",
                xhr.status,
              ),
            );
          }
        }
      });

      // Error handler (network errors)
      xhr.addEventListener("error", () => {
        if (fileId) {
          this.activeRequests.delete(fileId);
        }
        reject(
          new UploadError(
            "Network error. Please check your connection.",
            "NETWORK_ERROR",
          ),
        );
      });

      // Abort handler
      xhr.addEventListener("abort", () => {
        if (fileId) {
          this.activeRequests.delete(fileId);
        }
        reject(new UploadError("Upload cancelled.", "UPLOAD_CANCELLED"));
      });

      // Timeout handler
      xhr.addEventListener("timeout", () => {
        if (fileId) {
          this.activeRequests.delete(fileId);
        }
        reject(
          new UploadError(
            "Upload timed out. Please try again.",
            "UPLOAD_TIMEOUT",
          ),
        );
      });

      // Set timeout (5 minutes for large files)
      xhr.timeout = 300000; // 5 minutes

      // Send request
      xhr.send(formData);
    });
  }

  /**
   * Cancel an active upload
   */
  cancelUpload(fileId) {
    const xhr = this.activeRequests.get(fileId);
    if (xhr) {
      xhr.abort();
      this.activeRequests.delete(fileId);
      return true;
    }
    return false;
  }

  /**
   * Cancel all active uploads
   */
  cancelAllUploads() {
    this.activeRequests.forEach((xhr) => xhr.abort());
    this.activeRequests.clear();
  }

  /**
   * Check if user is authenticated
   */
  validateAuth(accessToken) {
    if (!accessToken) {
      throw new Error("Please log in to upload files");
    }
  }
}

export const uploadService = new UploadService();
