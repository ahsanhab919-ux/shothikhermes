"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  Image,
  CheckCircle2,
  AlertCircle,
  X,
  Ruler,
  HardDrive,
  Palette,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/tiff"];
const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.tiff,.tif";
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const MIN_WIDTH = 1600;
const MIN_HEIGHT = 2400;

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CoverUpload({ formData, updateFormData, onCoverUpload }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const fileInputRef = useRef(null);

  const processImage = useCallback(
    async (file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setUploadError("Only JPEG, PNG, and TIFF images are accepted.");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`File size exceeds 50MB limit. Your file is ${formatFileSize(file.size)}.`);
        return;
      }

      setUploadError("");
      setIsProcessing(true);

      const img = new window.Image();
      const url = URL.createObjectURL(file);

      img.onload = async () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;

        if (width < MIN_WIDTH || height < MIN_HEIGHT) {
          setUploadError(
            `Image is ${width} x ${height} px. Minimum required: ${MIN_WIDTH} x ${MIN_HEIGHT} px.`
          );
          URL.revokeObjectURL(url);
          setIsProcessing(false);
          return;
        }

        try {
          if (onCoverUpload) {
            await onCoverUpload(file, { width, height });
          } else {
            updateFormData({
              coverFile: file,
              coverPreview: url,
              coverDimensions: { width, height },
            });
          }
        } catch (err) {
          setUploadError(err.message || "Cover upload failed. Please try again.");
          URL.revokeObjectURL(url);
        }
        setIsProcessing(false);
      };

      img.onerror = () => {
        setUploadError("Could not read the image file. Please try another image.");
        URL.revokeObjectURL(url);
        setIsProcessing(false);
      };

      img.src = url;
    },
    [updateFormData]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processImage(file);
    },
    [processImage]
  );

  const removeCover = useCallback(() => {
    if (formData.coverPreview) URL.revokeObjectURL(formData.coverPreview);
    updateFormData({
      coverFile: null,
      coverPreview: null,
      coverDimensions: null,
    });
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [formData.coverPreview, updateFormData]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">
          Cover Art
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Upload a professional cover image. A great cover is the biggest factor in book sales.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {!formData.coverFile ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 aspect-[2/3] flex flex-col items-center justify-center",
                isDragging
                  ? "border-brand bg-brand/5"
                  : "border-zinc-300 dark:border-zinc-700 hover:border-brand/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
              )}
              role="button"
              aria-label="Upload cover image"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) processImage(file);
                }}
                className="hidden"
              />

              {isProcessing ? (
                <div className="space-y-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="size-12 border-3 border-brand/20 border-t-brand rounded-full mx-auto"
                  />
                  <p className="text-sm text-zinc-500">Processing image...</p>
                </div>
              ) : (
                <>
                  <div className="size-14 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-full flex items-center justify-center mb-4">
                    <Image className="h-7 w-7" />
                  </div>
                  <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Drop your cover image here
                  </p>
                  <p className="text-xs text-zinc-500 mb-3">
                    or click to browse
                  </p>
                  <div className="space-y-1 text-[10px] text-zinc-400">
                    <p>JPEG, PNG, or TIFF</p>
                    <p>Min 1600 x 2400 px</p>
                    <p>Max 50MB</p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative group aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl shadow-black/20 border border-zinc-200 dark:border-zinc-800"
            >
              <img
                src={formData.coverPreview}
                alt="Book cover preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-zinc-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white text-zinc-900 px-4 py-2 rounded-full text-xs font-bold hover:bg-brand hover:text-white transition-all"
                >
                  Change Cover
                </button>
                <button
                  onClick={() => setShowFullPreview(true)}
                  className="bg-transparent border border-white text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-1.5"
                >
                  <Eye className="h-3 w-3" /> Full Preview
                </button>
                <button
                  onClick={removeCover}
                  className="text-red-300 hover:text-red-400 text-xs font-bold transition-colors mt-2"
                >
                  Remove Cover
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) processImage(file);
                }}
                className="hidden"
              />
            </motion.div>
          )}
        </div>

        <div className="space-y-4">
          {formData.coverFile && formData.coverDimensions && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4"
            >
              <h3 className="font-bold text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Cover Details
              </h3>
              {[
                { icon: Ruler, label: "Dimensions", value: `${formData.coverDimensions.width} x ${formData.coverDimensions.height} px` },
                { icon: HardDrive, label: "File Size", value: formData.coverFile?.size ? formatFileSize(formData.coverFile.size) : "Uploaded" },
                { icon: Palette, label: "Format", value: formData.coverFile?.type ? formData.coverFile.type.split("/")[1]?.toUpperCase() : "Image" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-zinc-500">
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-white">{value}</span>
                </div>
              ))}

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-bold text-emerald-600">Meets all requirements</span>
                </div>
              </div>
            </motion.div>
          )}

          <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-xl p-5">
            <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2">
              <Image className="h-4 w-4 text-brand" />
              Cover Guidelines
            </h3>
            <ul className="space-y-2 text-xs text-zinc-500">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                Recommended: 1600 x 2560 px (portrait orientation)
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                High-resolution images look best on all devices
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                Avoid text-heavy covers that become unreadable at small sizes
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                Ensure you have rights to all images used in the cover
              </li>
            </ul>
          </div>
        </div>
      </div>

      {uploadError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl"
        >
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-300">{uploadError}</p>
        </motion.div>
      )}

      {showFullPreview && formData.coverPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm p-8"
          onClick={() => setShowFullPreview(false)}
        >
          <button
            onClick={() => setShowFullPreview(false)}
            className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors"
            aria-label="Close preview"
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={formData.coverPreview}
            alt="Full cover preview"
            className="max-h-[85vh] max-w-[85vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </div>
  );
}
