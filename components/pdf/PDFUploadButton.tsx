"use client";

import { useState, useRef } from "react";
import { usePDFUpload } from "@/hooks/usePDFUpload";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface PDFUploadButtonProps {
  agent: "research" | "slide" | "sheet";
  onSuccess?: (result: any) => void;
  buttonText?: string;
  accept?: string;
  maxSize?: number; // in MB
}

export function PDFUploadButton({
  agent,
  onSuccess,
  buttonText = "Upload PDF",
  accept = ".pdf",
  maxSize = 50,
}: PDFUploadButtonProps) {
  const { uploadPDF, isUploading, error } = usePDFUpload();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      alert("Please select a PDF file");
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File too large. Maximum size is ${maxSize}MB`);
      return;
    }

    setSelectedFile(file);
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const result = await uploadPDF(selectedFile, { agent });
    
    if (result) {
      setUploadResult(result);
      onSuccess?.(result);
      setSelectedFile(null);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {!selectedFile && !uploadResult && (
        <Button
          onClick={handleClick}
          variant="outline"
          className="w-full justify-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {buttonText}
        </Button>
      )}

      {selectedFile && (
        <div className="p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-8 h-8 text-blue-500" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Parsing...
                </>
              ) : (
                "Parse PDF"
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setSelectedFile(null)}
              disabled={isUploading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {uploadResult && (
        <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">PDF Parsed Successfully!</span>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Title:</strong> {uploadResult.metadata.title}</p>
            <p><strong>Pages:</strong> {uploadResult.metadata.pages}</p>
            <p><strong>Words:</strong> {uploadResult.metadata.wordCount.toLocaleString()}</p>
            <p><strong>Parse Time:</strong> {uploadResult.metadata.parseTime}ms</p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUploadResult(null)}
            className="mt-3"
          >
            Upload Another
          </Button>
        </div>
      )}

      {error && (
        <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}
