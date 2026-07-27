/**
 * Upload Error Handling
 * Custom error class and error parsing utilities
 */

export class UploadError extends Error {
  constructor(message, code, statusCode = null) {
    super(message);
    this.name = "UploadError";
    this.code = code;
    this.statusCode = statusCode;
    this.isRetryable = false;
  }
}

/**
 * Parse HTTP response error and return user-friendly UploadError
 * @param {Response} response - Fetch API response object
 * @returns {Promise<UploadError>}
 */
export const parseUploadError = async (response) => {
  const statusCode = response.status;

  // Try to get error details from response
  let errorData;
  try {
    errorData = await response.json();
  } catch {
    errorData = {};
  }

  const errorMap = {
    401: {
      message: "Session expired. Please log in again.",
      code: "AUTH_EXPIRED",
      retryable: false,
    },
    403: {
      message: "You do not have permission to upload files.",
      code: "PERMISSION_DENIED",
      retryable: false,
    },
    413: {
      message: "File too large. Maximum 25MB allowed.",
      code: "FILE_TOO_LARGE",
      retryable: false,
    },
    415: {
      message: "Unsupported file type. Only PDF, DOCX, and TXT are allowed.",
      code: "UNSUPPORTED_TYPE",
      retryable: false,
    },
    429: {
      message: "Too many uploads. Please wait a moment and try again.",
      code: "RATE_LIMIT",
      retryable: true,
    },
    500: {
      message: "Server error occurred. Please try again.",
      code: "SERVER_ERROR",
      retryable: true,
    },
    503: {
      message: "Service temporarily unavailable. Please try again later.",
      code: "SERVICE_UNAVAILABLE",
      retryable: true,
    },
  };

  const errorInfo = errorMap[statusCode] || {
    message: errorData.message || "Upload failed. Please try again.",
    code: "UNKNOWN_ERROR",
    retryable: true,
  };

  const error = new UploadError(errorInfo.message, errorInfo.code, statusCode);
  error.isRetryable = errorInfo.retryable;

  return error;
};
