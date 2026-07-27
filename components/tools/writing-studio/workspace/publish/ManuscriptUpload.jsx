"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  FileType,
  HardDrive,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const ACCEPTED_FORMATS = {
  "application/epub+zip": ".epub",
  "application/pdf": ".pdf",
};

const ACCEPTED_EXTENSIONS = [".epub", ".pdf"];
const MAX_FILE_SIZE = 300 * 1024 * 1024;

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(name) {
  return name.slice(name.lastIndexOf(".")).toLowerCase();
}

export function ManuscriptUpload({ formData, updateFormData, onManuscriptUpload }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = useCallback((file) => {
    const ext = getFileExtension(file.name);
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      return "Only ePub (.epub) and PDF (.pdf) files are accepted.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds the 300MB limit. Your file is ${formatFileSize(file.size)}.`;
    }
    return null;
  }, []);

  const processFile = useCallback(
    async (file) => {
      const error = validateFile(file);
      if (error) {
        setUploadError(error);
        return;
      }

      setUploadError("");
      setIsUploading(true);
      setUploadProgress(0);

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 10;
        });
      }, 300);

      try {
        if (onManuscriptUpload) {
          await onManuscriptUpload(file);
        } else {
          const ext = getFileExtension(file.name);
          updateFormData({
            manuscript: file,
            manuscriptName: file.name,
            manuscriptSize: file.size,
            manuscriptFormat: ext.replace(".", "").toUpperCase(),
          });
        }
        clearInterval(progressInterval);
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 500);
      } catch (err) {
        clearInterval(progressInterval);
        setUploadError(err.message || "Upload failed. Please try again.");
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [validateFile, updateFormData, onManuscriptUpload]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const removeFile = useCallback(() => {
    updateFormData({
      manuscript: null,
      manuscriptName: "",
      manuscriptSize: 0,
      manuscriptFormat: "",
    });
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [updateFormData]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">
          Upload Your Manuscript
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Upload your completed book manuscript. We accept ePub and PDF formats.
        </p>
      </div>

      {!formData.manuscript ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200",
            isDragging
              ? "border-brand bg-brand/5 scale-[1.01]"
              : "border-zinc-300 dark:border-zinc-700 hover:border-brand/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
          )}
          role="button"
          aria-label="Upload manuscript file"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".epub,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          {isUploading ? (
            <div className="space-y-4">
              <div className="size-16 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Upload className="h-8 w-8" />
                </motion.div>
              </div>
              <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                Processing your manuscript...
              </p>
              <div className="max-w-xs mx-auto">
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                  <motion.div
                    className="bg-brand h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  {Math.round(uploadProgress)}% complete
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="size-16 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="h-8 w-8" />
              </div>
              <p className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Drop your manuscript here
              </p>
              <p className="text-sm text-zinc-500 mb-4">
                or click to browse your files
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1">
                  <FileType className="h-3.5 w-3.5" />
                  ePub, PDF
                </span>
                <span className="w-px h-3 bg-zinc-300 dark:bg-zinc-600" />
                <span className="flex items-center gap-1">
                  <HardDrive className="h-3.5 w-3.5" />
                  Max 300MB
                </span>
              </div>
            </>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-900/50 border border-emerald-200 dark:border-emerald-800/30 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="size-14 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
              <FileText className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-zinc-900 dark:text-white truncate">
                    {formData.manuscriptName}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-zinc-500">
                      {formatFileSize(formData.manuscriptSize)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand font-bold">
                      {formData.manuscriptFormat}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-emerald-500 font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Ready
                    </span>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500 transition-colors"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {uploadError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl"
        >
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700 dark:text-red-400">Upload Error</p>
            <p className="text-sm text-red-600 dark:text-red-300">{uploadError}</p>
          </div>
        </motion.div>
      )}

      <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-xl p-5">
        <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-brand" />
          Manuscript Guidelines
        </h3>
        <ul className="space-y-2 text-xs text-zinc-500">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
            ePub format recommended for best reader experience
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
            PDF accepted but may have limited formatting on mobile devices
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
            Minimum 5,000 words required for publication
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
            Ensure your work is original and does not contain plagiarized content
          </li>
        </ul>
      </div>

      {formData.manuscriptStorageId && (
        <EpubExportSection bookId={formData.bookId} manuscriptStorageId={formData.manuscriptStorageId} />
      )}
    </div>
  );
}

function EpubExportSection({ bookId }) {
  const [validating, setValidating] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [validation, setValidation] = useState(null);
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  const formats = [
    { id: "epub", label: "EPUB", icon: "📖", mime: "application/epub+zip" },
    { id: "pdf", label: "PDF", icon: "📄", mime: "application/pdf" },
    { id: "docx", label: "DOCX", icon: "📝", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
    { id: "mobi", label: "MOBI", icon: "📱", mime: "application/x-mobipocket-ebook" },
    { id: "kepub", label: "KEPUB", icon: "📚", mime: "application/epub+zip" },
  ];

  const getToken = () => typeof window !== "undefined" ? localStorage.getItem("auth_token") || "" : "";

  const handleDownload = async (format) => {
    if (!bookId) return;
    setDownloadingFormat(format);
    try {
      const res = await fetch("/api/books/export/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ bookId, format }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || `Export to ${format.toUpperCase()} failed.`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `manuscript.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed. Please check the Calibre service is running.");
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleValidate = async () => {
    if (!bookId) return;
    setValidating(true);
    setValidation(null);
    try {
      const res = await fetch("/api/books/export/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ bookId }),
      });
      const data = await res.json();
      if (res.ok) setValidation(data);
      else alert(data.error || "Validation failed.");
    } catch {
      alert("Validation service unavailable.");
    } finally {
      setValidating(false);
    }
  };

  const handleAutoFix = async () => {
    if (!bookId) return;
    setFixing(true);
    try {
      const res = await fetch("/api/books/export/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ bookId, fix: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setValidation(data);
        alert(`Fixed ${data.problems_fixed?.length || 0} issue(s). Re-upload the fixed EPUB if needed.`);
      } else {
        alert(data.error || "Auto-fix failed.");
      }
    } catch {
      alert("Auto-fix service unavailable.");
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
          Export Formats
        </h3>
        <button
          onClick={handleValidate}
          disabled={validating || !bookId}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 transition-all"
        >
          {validating ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <CheckCircle2 className="h-3.5 w-3.5" />
            </motion.div>
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          {validating ? "Checking..." : "EPUB Readiness Check"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {formats.map((fmt) => (
          <button
            key={fmt.id}
            onClick={() => handleDownload(fmt.id)}
            disabled={downloadingFormat === fmt.id || !bookId}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:border-brand/40 hover:text-brand disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {downloadingFormat === fmt.id ? (
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                ⏳
              </motion.span>
            ) : (
              <span>{fmt.icon}</span>
            )}
            {fmt.label}
          </button>
        ))}
      </div>

      {validation && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className={`text-2xl font-black ${validation.score >= 8 ? "text-emerald-600" : validation.score >= 5 ? "text-amber-500" : "text-red-500"}`}>
              {validation.score}/10
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-white">
                {validation.score >= 8 ? "Ready for distribution" : validation.score >= 5 ? "Minor issues found" : "Issues need fixing"}
              </p>
              {validation.ready_for?.length > 0 && (
                <p className="text-xs text-zinc-500">
                  Ready for: {validation.ready_for.join(", ")}
                </p>
              )}
            </div>
            {validation.issues?.some((i) => i.fixable) && (
              <button
                onClick={handleAutoFix}
                disabled={fixing}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white rounded-lg text-xs font-bold hover:bg-brand/90 disabled:opacity-50 transition-all"
              >
                {fixing ? "Fixing..." : "Auto-Fix Issues"}
              </button>
            )}
          </div>

          {validation.issues?.length > 0 && (
            <ul className="space-y-1.5">
              {validation.issues.map((issue, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <span className={`mt-0.5 shrink-0 ${issue.severity === "error" ? "text-red-500" : "text-amber-500"}`}>
                    {issue.severity === "error" ? "●" : "○"}
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-400">{issue.message}</span>
                  {issue.fixable && (
                    <span className="ml-auto shrink-0 text-brand font-bold">fixable</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      )}
    </div>
  );
}
