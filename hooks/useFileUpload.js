"use client";

import { useCallback } from "react";

/**
 * Custom hook for handling file uploads with validation and state management
 *
 * @param {Object} options - Configuration options
 * @param {Function} options.uploadFunction - Async function that handles the upload (uploadData) => Promise<result>
 * @param {boolean} options.isUploading - Loading state from the upload mutation
 * @param {Function} options.addFiles - Function from useNavItemFiles to add files to state
 * @param {Array<string>} options.allowedTypes - Allowed MIME types (default: PDF, DOC, DOCX, TXT)
 * @param {number} options.maxSize - Maximum file size in bytes (default: 10MB)
 * @param {Function} options.onUploadStart - Callback when upload starts (fileCount) => void
 * @param {Function} options.onSuccess - Callback on successful upload (files, result) => void
 * @param {Function} options.onError - Callback on upload error (error) => void
 * @param {Function} options.onValidationError - Callback on validation error (message) => void
 * @param {Function} options.prepareUploadData - Function to prepare upload data (files, userId) => uploadData
 * @param {Function} options.getUserId - Function to get current user ID () => string | null
 *
 * @returns {Object} Upload handlers and utilities
 */
const useFileUpload = ({
  uploadFunction,
  isUploading = false,
  addFiles,
  allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ],
  maxSize = 10 * 1024 * 1024, // 10MB
  onUploadStart,
  onSuccess,
  onError,
  onValidationError,
  prepareUploadData = (files, userId) => ({ files, userId }),
  getUserId = () => null,
}) => {
  /**
   * Validates files for type and size
   * @param {File[]} files - Array of File objects
   * @returns {{ valid: File[], invalid: string[] }} Validation result
   */
  const validateFiles = useCallback(
    (files) => {
      const valid = [];
      const invalid = [];

      for (const file of files) {
        if (!allowedTypes.includes(file.type)) {
          invalid.push(`${file.name} (invalid type: ${file.type})`);
        } else if (file.size > maxSize) {
          invalid.push(
            `${file.name} (too large: ${(file.size / 1024 / 1024).toFixed(2)}MB)`,
          );
        } else {
          valid.push(file);
        }
      }

      return { valid, invalid };
    },
    [allowedTypes, maxSize],
  );

  /**
   * Formats error message from upload error
   * @param {Error} error - Upload error object
   * @returns {string} Formatted error message
   */
  const formatErrorMessage = useCallback((error) => {
    if (error.status === "FETCH_ERROR") {
      return "Network error. Please check your connection and try again.";
    } else if (error.status === 400) {
      return "Bad request. Please check file format and try again.";
    } else if (error.status === 413) {
      return "Files too large. Please reduce file size and try again.";
    } else if (error.data?.message) {
      return error.data.message;
    }
    return "Failed to upload files. Please try again.";
  }, []);

  /**
   * Extracts uploads array from API response
   * Handles both { uploads: [...] } and { upLoads: [...] } formats
   * @param {Object} result - API response
   * @returns {Array|null} Array of uploaded files or null
   */
  const extractUploadsFromResponse = useCallback((result) => {
    return result?.uploads || result?.upLoads || null;
  }, []);

  /**
   * Handles file upload process
   * @param {File[]} files - Array of File objects to upload
   * @param {Event} event - File input event (optional, for clearing input)
   * @returns {Promise<void>}
   */
  const handleUpload = useCallback(
    async (files, event = null) => {
      if (!files || files.length === 0) {
        return;
      }

      // Validate files
      const { valid, invalid } = validateFiles(files);

      if (invalid.length > 0) {
        const errorMessage = `Invalid files: ${invalid.join(", ")}`;
        if (onValidationError) {
          onValidationError(errorMessage);
        }
        return;
      }

      if (valid.length === 0) {
        return;
      }

      // Validate user
      const userId = getUserId();
      if (!userId) {
        const errorMessage = "User not authenticated";
        if (onValidationError) {
          onValidationError(errorMessage);
        }
        return;
      }

      // Prepare upload data
      const uploadData = prepareUploadData(valid, userId);

      // Notify upload start
      if (onUploadStart) {
        onUploadStart(valid.length);
      }

      try {
        // Call upload function
        const result = await uploadFunction(uploadData);

        // Extract uploads from response
        const uploadsArray = extractUploadsFromResponse(result);

        if (
          uploadsArray &&
          Array.isArray(uploadsArray) &&
          uploadsArray.length > 0
        ) {
          // Extract signed URLs
          const newUrls = uploadsArray.map((file) => file.signed_url);

          // Add files to state
          if (addFiles) {
            addFiles(uploadsArray, newUrls);
          }

          // Call success callback
          if (onSuccess) {
            onSuccess(uploadsArray, result);
          }
        } else {
          // Unexpected response structure
          const error = new Error(
            "Upload completed but files could not be processed",
          );
          error.result = result;
          if (onError) {
            onError(error);
          }
        }

        // Clear file input if event provided
        if (event?.target) {
          event.target.value = "";
        }
      } catch (error) {
        // Format and handle error
        const errorMessage = formatErrorMessage(error);
        const formattedError = {
          ...error,
          message: errorMessage,
        };

        if (onError) {
          onError(formattedError);
        }

        // Clear file input on error
        if (event?.target) {
          event.target.value = "";
        }
      }
    },
    [
      validateFiles,
      getUserId,
      prepareUploadData,
      uploadFunction,
      extractUploadsFromResponse,
      addFiles,
      formatErrorMessage,
      onUploadStart,
      onSuccess,
      onError,
      onValidationError,
    ],
  );

  /**
   * Handles file input change event
   * @param {Event} event - File input change event
   * @returns {Promise<void>}
   */
  const handleFileSelect = useCallback(
    async (event) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      await handleUpload(files, event);
    },
    [handleUpload],
  );

  return {
    handleFileSelect,
    handleUpload,
    validateFiles,
    formatErrorMessage,
    isUploading,
  };
};

export default useFileUpload;
