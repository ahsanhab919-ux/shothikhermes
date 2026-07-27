import { getPdfExtractionRoute } from "@/lib/document-parsing/client";

export type SupportedFileType = "pdf" | "docx" | "txt" | "tex" | "unknown";

export interface FileExtractionResult {
  text: string;
  fileName: string;
  fileType: SupportedFileType;
  fileSize: number;
  pageCount?: number;
  wordCount: number;
}

export interface FileExtractionError {
  code:
    | "FILE_TOO_LARGE"
    | "UNSUPPORTED_TYPE"
    | "EXTRACTION_FAILED"
    | "EMPTY_FILE"
    | "CORRUPTED_FILE"
    | "PASSWORD_PROTECTED"
    | "TIMEOUT";
  message: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ACCEPTED_EXTENSIONS = ["pdf", "docx", "txt", "tex", "latex", "bib"];

const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/x-tex",
  "application/x-latex",
  "text/x-tex",
];

export function getFileType(fileName: string): SupportedFileType {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  if (extension === "pdf") return "pdf";
  if (extension === "docx") return "docx";
  if (extension === "txt") return "txt";
  if (["tex", "latex", "bib"].includes(extension)) return "tex";
  return "unknown";
}

export function validateFile(file: File): FileExtractionError | null {
  if (file.size === 0) {
    return { code: "EMPTY_FILE", message: "The file appears to be empty." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      code: "FILE_TOO_LARGE",
      message: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit.`,
    };
  }

  const fileType = getFileType(file.name);
  const hasSupportedExtension = fileType !== "unknown";
  const hasSupportedMime =
    !file.type || ACCEPTED_MIME_TYPES.includes(file.type) || file.type.startsWith("text/");

  if (!hasSupportedExtension && !hasSupportedMime) {
    return {
      code: "UNSUPPORTED_TYPE",
      message: `Unsupported file type. Please upload PDF, DOCX, TXT, or LaTeX files.`,
    };
  }

  if (!hasSupportedExtension) {
    return {
      code: "UNSUPPORTED_TYPE",
      message: `Unsupported file type. Please upload PDF, DOCX, TXT, or LaTeX files.`,
    };
  }

  return null;
}

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

async function extractPDF(file: File): Promise<FileExtractionResult> {
  if (process.env.NEXT_PUBLIC_EXTRACT_PDF_V2_ENABLED === "true") {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(getPdfExtractionRoute(), {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const text = String(data.text || "").trim();

        if (!text) {
          throw {
            code: "EMPTY_FILE",
            message: "No text could be extracted from this PDF. It may be image-based.",
          } as FileExtractionError;
        }

        return {
          text,
          fileName: file.name,
          fileType: "pdf",
          fileSize: file.size,
          pageCount: typeof data.pages === "number" ? data.pages : undefined,
          wordCount: countWords(text),
        };
      }
    } catch {
    }
  }

  const { pdfjs } = await import("react-pdf");
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs?.version}/build/pdf.worker.min.mjs`;

  const blobUrl = URL.createObjectURL(file);

  try {
    const loadingTask = pdfjs.getDocument(blobUrl);
    let pdf;
    try {
      pdf = await loadingTask.promise;
    } catch (pdfError: any) {
      if (
        pdfError?.name === "PasswordException" ||
        pdfError?.message?.toLowerCase().includes("password")
      ) {
        throw {
          code: "PASSWORD_PROTECTED",
          message: "This PDF is password-protected. Please remove the password and try again.",
        } as FileExtractionError;
      }
      throw {
        code: "CORRUPTED_FILE",
        message: "The PDF file appears to be corrupted or unreadable.",
      } as FileExtractionError;
    }

    const numPages = pdf.numPages;
    let extractedText = "";

    for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();

      let previousY: number | null = null;
      let pageText = "";

      textContent.items.forEach((item: any) => {
        if (previousY && Math.abs(previousY - item.transform[5]) > 10) {
          pageText += "\n";
        }
        pageText += item.str + " ";
        previousY = item.transform[5];
      });

      extractedText += pageText.trim() + "\n\n";
    }

    const text = extractedText.trim();
    if (!text) {
      throw {
        code: "EMPTY_FILE",
        message: "No text could be extracted from this PDF. It may be image-based.",
      } as FileExtractionError;
    }

    return {
      text,
      fileName: file.name,
      fileType: "pdf",
      fileSize: file.size,
      pageCount: numPages,
      wordCount: countWords(text),
    };
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

async function extractDOCX(file: File): Promise<FileExtractionResult> {
  const mammoth = (await import("mammoth")).default;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const text = result.value
          .replace(/<\/p>/g, "\n\n")
          .replace(/<br\s*\/?>/g, "\n")
          .replace(/<p[^>]*>/g, "\n")
          .replace(/<[^>]*>/g, "")
          .trim();

        if (!text) {
          reject({
            code: "EMPTY_FILE",
            message: "No text could be extracted from this document.",
          } as FileExtractionError);
          return;
        }

        resolve({
          text,
          fileName: file.name,
          fileType: "docx",
          fileSize: file.size,
          wordCount: countWords(text),
        });
      } catch {
        reject({
          code: "CORRUPTED_FILE",
          message: "The DOCX file appears to be corrupted or unreadable.",
        } as FileExtractionError);
      }
    };

    reader.onerror = () => {
      reject({
        code: "EXTRACTION_FAILED",
        message: "Failed to read the file.",
      } as FileExtractionError);
    };

    reader.readAsArrayBuffer(file);
  });
}

async function extractText(file: File): Promise<FileExtractionResult> {
  const text = await file.text();

  if (!text.trim()) {
    throw {
      code: "EMPTY_FILE",
      message: "The file appears to be empty.",
    } as FileExtractionError;
  }

  return {
    text: text.trim(),
    fileName: file.name,
    fileType: getFileType(file.name) as "txt" | "tex",
    fileSize: file.size,
    wordCount: countWords(text),
  };
}

export async function extractFileContent(
  file: File
): Promise<FileExtractionResult> {
  const validationError = validateFile(file);
  if (validationError) {
    throw validationError;
  }

  const fileType = getFileType(file.name);

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject({
        code: "TIMEOUT",
        message: "File extraction took too long. Try a smaller file.",
      } as FileExtractionError);
    }, 30000);
  });

  try {
    let extractionPromise: Promise<FileExtractionResult>;

    switch (fileType) {
      case "pdf":
        extractionPromise = extractPDF(file);
        break;
      case "docx":
        extractionPromise = extractDOCX(file);
        break;
      case "txt":
      case "tex":
        extractionPromise = extractText(file);
        break;
      default:
        throw {
          code: "UNSUPPORTED_TYPE",
          message: "Unsupported file type.",
        } as FileExtractionError;
    }

    return await Promise.race([extractionPromise, timeoutPromise]);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      typeof (error as FileExtractionError).code === "string"
    ) {
      throw error;
    }
    throw {
      code: "EXTRACTION_FAILED",
      message: "Failed to extract text from the file. Please try again.",
    } as FileExtractionError;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ACCEPTED_FILE_TYPES = ACCEPTED_EXTENSIONS.map((ext) => `.${ext}`).join(",");
