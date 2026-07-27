"use client";

import { useState, useCallback } from "react";
import { useSelector } from "react-redux";

interface PDFUploadOptions {
  agent: "research" | "slide" | "sheet";
  onProgress?: (progress: number) => void;
}

interface PDFUploadResult {
  documentId: string;
  metadata: {
    title: string;
    pages: number;
    wordCount: number;
    parseTime: number;
  };
  processedResult: any;
  preview: string;
}

export function usePDFUpload() {
  const { accessToken } = useSelector((state: any) => state.auth);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadPDF = useCallback(
    async (file: File, options: PDFUploadOptions): Promise<PDFUploadResult | null> => {
      setIsUploading(true);
      setError(null);

      try {
        const token = accessToken || localStorage.getItem("accessToken");
        
        const formData = new FormData();
        formData.append("file", file);
        formData.append("agent", options.agent);

        const response = await fetch("/api/pdf/parse", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to upload PDF");
        }

        const result = await response.json();
        return result;
      } catch (err: any) {
        setError(err.message);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [accessToken]
  );

  return {
    uploadPDF,
    isUploading,
    error,
  };
}

export function useUserDocuments(agent?: "research" | "slide" | "sheet") {
  const { accessToken } = useSelector((state: any) => state.auth);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = accessToken || localStorage.getItem("accessToken");
      const params = agent ? `?agent=${agent}` : "";
      
      const response = await fetch(`/api/pdf/documents${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, agent]);

  return { documents, isLoading, fetchDocuments };
}
