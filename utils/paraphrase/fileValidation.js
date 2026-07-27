/**
 * File Validation Utilities
 * Client-side validation for file uploads
 */

const VALID_MIME_TYPES = {
  "application/pdf": {
    extension: "pdf",
    signatures: [[0x25, 0x50, 0x44, 0x46]], // %PDF
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    extension: "docx",
    signatures: [
      [0x50, 0x4b, 0x03, 0x04],
      [0x50, 0x4b, 0x05, 0x06],
    ], // PK (ZIP)
  },
  "text/plain": {
    extension: "txt",
    signatures: [], // Text files don't have fixed signatures
  },
};

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

/**
 * Validate a file for upload
 * @param {File} file - The file to validate
 * @returns {Promise<{valid: boolean, errors: string[]}>}
 */
export const validateFile = async (file) => {
  const errors = [];

  // 1. Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push("File must be ≤ 25 MB");
  }

  if (file.size === 0) {
    errors.push("File is empty");
  }

  // 2. Check MIME type
  if (!VALID_MIME_TYPES[file.type]) {
    errors.push("Unsupported file type. Only PDF, DOCX, and TXT are allowed.");
  }

  // 3. Check file extension
  const extension = file.name.split(".").pop()?.toLowerCase();
  const expectedExtension = VALID_MIME_TYPES[file.type]?.extension;

  if (extension !== expectedExtension) {
    errors.push(`File extension .${extension} doesn't match file type`);
  }

  // 4. Check file signature (magic bytes) - skip for text files
  if (file.type !== "text/plain" && VALID_MIME_TYPES[file.type]) {
    const isValidSignature = await checkFileSignature(file);
    if (!isValidSignature) {
      errors.push("File appears to be corrupted or invalid");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Check file signature (magic bytes)
 * @param {File} file - The file to check
 * @returns {Promise<boolean>}
 */
const checkFileSignature = async (file) => {
  try {
    const arrayBuffer = await file.slice(0, 8).arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const signatures = VALID_MIME_TYPES[file.type]?.signatures || [];

    return signatures.some((signature) =>
      signature.every((byte, index) => bytes[index] === byte),
    );
  } catch {
    return false;
  }
};

/**
 * Sanitize file name to prevent XSS and other issues
 * @param {string} fileName - The file name to sanitize
 * @returns {string} - Sanitized file name
 */
export const sanitizeFileName = (fileName) => {
  // Remove any HTML/script tags
  let clean = fileName.replace(/<[^>]*>/g, "");

  // Replace dangerous characters
  clean = clean.replace(/[<>:"|?*]/g, "_");

  // Limit length
  if (clean.length > 255) {
    const ext = clean.split(".").pop();
    const nameWithoutExt = clean.slice(0, clean.lastIndexOf("."));
    clean = nameWithoutExt.slice(0, 250 - ext.length) + "." + ext;
  }

  return clean;
};

/**
 * Generate unique file ID
 * @param {File} file - The file to generate ID for
 * @returns {string} - Unique file identifier
 */
export const generateFileId = (file) => {
  return `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
