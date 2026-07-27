"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  isWritingStudioEnabled,
  convertLatexToHtml,
  uploadFile,
} from "@/services/writing-studio.service";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Upload,
  FileText,
  File,
  FileType,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".docx", ".pdf", ".txt", ".tex", ".latex"];
const ACCEPTED_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/pdf",
  "text/plain",
  "application/x-tex",
  "application/x-latex",
];

function extractLatexBody(texContent) {
  const beginMatch = texContent.indexOf("\\begin{document}");
  const endMatch = texContent.indexOf("\\end{document}");
  if (beginMatch !== -1 && endMatch !== -1) {
    return texContent
      .substring(beginMatch + "\\begin{document}".length, endMatch)
      .trim();
  }
  return texContent;
}

function latexBodyToBasicHtml(body) {
  let html = body;
  html = html.replace(/\\section\*?\{([^}]+)\}/g, "<h2>$1</h2>");
  html = html.replace(/\\subsection\*?\{([^}]+)\}/g, "<h3>$1</h3>");
  html = html.replace(/\\subsubsection\*?\{([^}]+)\}/g, "<h4>$1</h4>");
  html = html.replace(/\\textbf\{([^}]+)\}/g, "<strong>$1</strong>");
  html = html.replace(/\\textit\{([^}]+)\}/g, "<em>$1</em>");
  html = html.replace(/\\underline\{([^}]+)\}/g, "<u>$1</u>");
  html = html.replace(
    /\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g,
    (_, items) => {
      const lis = items
        .split("\\item")
        .filter(Boolean)
        .map((i) => "<li>" + i.trim() + "</li>")
        .join("");
      return "<ul>" + lis + "</ul>";
    }
  );
  html = html.replace(
    /\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g,
    (_, items) => {
      const lis = items
        .split("\\item")
        .filter(Boolean)
        .map((i) => "<li>" + i.trim() + "</li>")
        .join("");
      return "<ol>" + lis + "</ol>";
    }
  );
  html = html.replace(/\n\n+/g, "</p><p>");
  html = "<p>" + html + "</p>";
  html = html.replace(/<p>\s*<\/p>/g, "");
  return html;
}

function getFileExtension(filename) {
  const ext = filename.toLowerCase().split(".").pop();
  return ext ? `.${ext}` : "";
}

function isAcceptedFile(file) {
  const ext = getFileExtension(file.name);
  return ACCEPTED_EXTENSIONS.includes(ext);
}

const FILE_TYPE_INFO = [
  { ext: "DOCX", icon: FileText, color: "text-blue-500" },
  { ext: "PDF", icon: File, color: "text-red-500" },
  { ext: "TXT", icon: FileType, color: "text-zinc-500" },
  { ext: "LaTeX", icon: FileText, color: "text-green-500" },
];

export function DocumentImport({ editor, isOpen, onClose }) {
  const [status, setStatus] = useState("idle");
  const [fileName, setFileName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const resetState = useCallback(() => {
    setStatus("idle");
    setFileName("");
    setErrorMessage("");
    setIsDragOver(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose?.();
  }, [resetState, onClose]);

  const insertHtmlIntoEditor = useCallback(
    (html) => {
      if (!editor) return;
      editor.chain().focus().insertContent(html).run();
    },
    [editor]
  );

  const processTxtFile = useCallback(
    async (file) => {
      const text = await file.text();
      if (!text.trim()) {
        toast.error("The file appears to be empty.");
        setStatus("idle");
        return;
      }
      const paragraphs = text
        .split(/\n\n+/)
        .filter(Boolean)
        .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
        .join("");
      insertHtmlIntoEditor(paragraphs);
      setStatus("success");
    },
    [insertHtmlIntoEditor]
  );

  const processLatexFile = useCallback(
    async (file) => {
      const text = await file.text();
      if (!text.trim()) {
        toast.error("The file appears to be empty.");
        setStatus("idle");
        return;
      }
      const body = extractLatexBody(text);

      if (isWritingStudioEnabled()) {
        try {
          const result = await convertLatexToHtml({ latex: body });
          if (result?.html) {
            insertHtmlIntoEditor(result.html);
            setStatus("success");
            return;
          }
        } catch {
          // fallback to client-side
        }
      }

      const html = latexBodyToBasicHtml(body);
      if (html && html !== "<p></p>") {
        insertHtmlIntoEditor(html);
      } else {
        insertHtmlIntoEditor(`<pre><code>${text}</code></pre>`);
      }
      setStatus("success");
    },
    [insertHtmlIntoEditor]
  );

  const processDocxFile = useCallback(
    async (file) => {
      try {
        const mammoth = await import("mammoth");
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        if (!result.value?.trim()) {
          toast.error("The file appears to be empty.");
          setStatus("idle");
          return;
        }
        insertHtmlIntoEditor(result.value);
        setStatus("success");
      } catch {
        if (isWritingStudioEnabled()) {
          try {
            await uploadFile(file);
            toast.info(
              "DOCX file uploaded to server for processing. Content will be available shortly."
            );
            setStatus("success");
            return;
          } catch {
            // fall through to error
          }
        }
        setErrorMessage(
          "DOCX import failed. Please try converting the file to TXT first."
        );
        setStatus("error");
      }
    },
    [insertHtmlIntoEditor]
  );

  const processPdfFile = useCallback(
    async (file) => {
      if (isWritingStudioEnabled()) {
        try {
          await uploadFile(file);
          toast.info(
            "PDF file uploaded to server for processing. Content will be available shortly."
          );
          setStatus("success");
          return;
        } catch {
          // fall through to error
        }
      }
      setErrorMessage(
        "PDF import requires the backend service. Please try converting the file to TXT or DOCX first."
      );
      setStatus("error");
    },
    []
  );

  const processFile = useCallback(
    async (file) => {
      if (!file) return;

      if (file.size > MAX_FILE_SIZE) {
        toast.error("File too large. Maximum size is 10MB.");
        return;
      }

      if (!isAcceptedFile(file)) {
        toast.error(
          "Unsupported file type. Please use DOCX, PDF, TXT, or LaTeX files."
        );
        return;
      }

      if (file.size === 0) {
        toast.error("The file appears to be empty.");
        return;
      }

      setFileName(file.name);
      setStatus("processing");
      setErrorMessage("");

      const ext = getFileExtension(file.name);

      try {
        switch (ext) {
          case ".txt":
            await processTxtFile(file);
            break;
          case ".tex":
          case ".latex":
            await processLatexFile(file);
            break;
          case ".docx":
            await processDocxFile(file);
            break;
          case ".pdf":
            await processPdfFile(file);
            break;
          default:
            toast.error(
              "Unsupported file type. Please use DOCX, PDF, TXT, or LaTeX files."
            );
            setStatus("idle");
        }
      } catch {
        setErrorMessage("An unexpected error occurred while processing the file.");
        setStatus("error");
      }
    },
    [processTxtFile, processLatexFile, processDocxFile, processPdfFile]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e) => {
      const file = e.target?.files?.[0];
      if (file) processFile(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [processFile]
  );

  useEffect(() => {
    if (status !== "success") return;
    const timer = setTimeout(() => {
      handleClose();
    }, 1500);
    return () => clearTimeout(timer);
  }, [status, handleClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
          role="dialog"
          aria-label="Import document"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-lg mx-4 bg-background rounded-xl shadow-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Import Document</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0"
                aria-label="Close import dialog"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <AnimatePresence mode="wait">
              {status === "idle" && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                >
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      "flex flex-col items-center justify-center p-10 rounded-xl bg-muted/50 shadow-sm transition-all cursor-pointer",
                      isDragOver &&
                        "bg-primary/10 ring-2 ring-primary/30 scale-[1.01]"
                    )}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    aria-label="Drag and drop a file here or click to browse"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        fileInputRef.current?.click();
                      }
                    }}
                  >
                    <motion.div
                      animate={isDragOver ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      <Upload
                        className={cn(
                          "h-10 w-10 mb-3",
                          isDragOver ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                    </motion.div>
                    <p className="text-sm font-medium mb-1">
                      {isDragOver
                        ? "Drop your file here"
                        : "Drag & drop your document"}
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Maximum file size: 10MB
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      aria-label="Browse files"
                    >
                      Or browse files
                    </Button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={ACCEPTED_EXTENSIONS.join(",")}
                    onChange={handleFileSelect}
                    aria-hidden="true"
                  />

                  <div className="flex items-center justify-center gap-4 mt-4">
                    {FILE_TYPE_INFO.map((info) => (
                      <div
                        key={info.ext}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground"
                      >
                        <info.icon className={cn("h-3.5 w-3.5", info.color)} />
                        <span>{info.ext}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {status === "processing" && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col items-center justify-center p-10 rounded-xl bg-muted/50 shadow-sm"
                >
                  <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
                  <p className="text-sm font-medium mb-1 truncate max-w-[300px]">
                    {fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Converting your document...
                  </p>
                </motion.div>
              )}

              {status === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="flex flex-col items-center justify-center p-10 rounded-xl bg-muted/50 shadow-sm"
                >
                  <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
                  <p className="text-sm font-medium">Document imported!</p>
                </motion.div>
              )}

              {status === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col items-center justify-center p-10 rounded-xl bg-muted/50 shadow-sm"
                >
                  <AlertTriangle className="h-10 w-10 text-red-500 mb-3" />
                  <p className="text-sm font-medium text-red-500 mb-1">
                    Import failed
                  </p>
                  <p className="text-xs text-muted-foreground text-center mb-4 max-w-[300px]">
                    {errorMessage}
                  </p>
                  <Button variant="outline" size="sm" onClick={resetState}>
                    Try Again
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default DocumentImport;
