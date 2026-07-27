"use client";

import { buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";
import mammoth from "mammoth";
import { useRef, useState } from "react";

const pdfToText = async (file) => {
  const { pdfjs } = await import("react-pdf");
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs?.version}/build/pdf.worker.min.mjs`;
  
  const blobUrl = URL.createObjectURL(file);
  const loadingTask = pdfjs.getDocument(blobUrl);
  let extractedText = "";

  try {
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();

      let previousY = null;
      let pageText = "";

      textContent.items.forEach((item) => {
        if (previousY && Math.abs(previousY - item.transform[5]) > 10) {
          pageText += "\n";
        }
        pageText += item.str + " ";
        previousY = item.transform[5];
      });

      extractedText += pageText.trim() + "\n\n";
    }
  } catch (error) {
    extractedText = "Error parsing the document.";
    console.error("Error extracting text from PDF:", error);
  }

  URL.revokeObjectURL(blobUrl);
  return extractedText.trim();
};

const ButtonInsertDocumentText = ({ className, onApply, onChange }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef(null);

  const getFileType = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();
    if (extension === "pdf") return "pdf";
    if (extension === "docx") return "docx";
    if (extension === "txt") return "txt";
    if (extension === "tex" || extension === "latex" || extension === "bib") return "tex";
    return "";
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsProcessing(true);

    const fileType = getFileType(file.name);
    try {
      if (fileType === "pdf") {
        const text = await pdfToText(file);
        onApply?.(text);
      } else if (fileType === "docx") {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const arrayBuffer = event.target.result;
          const result = await mammoth.convertToHtml({ arrayBuffer });
          let plainText = result.value
            .replace(/<\/p>/g, "\n\n")
            .replace(/<br\s*\/?>/g, "\n")
            .replace(/<p[^>]*>/g, "\n")
            .replace(/<[^>]*>/g, "")
            .trim();

          onApply?.(plainText);
        };
        reader.readAsArrayBuffer(file);
      } else if (fileType === "txt" || fileType === "tex") {
        const text = await file.text();
        onApply?.(text);
      } else {
        console.error("Unsupported file type");
      }
    } catch (error) {
      console.error("Error converting document:", error);
    } finally {
      setIsProcessing(false);
      inputRef.current.value = null;
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <label
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "relative shrink-0 cursor-pointer",
            isProcessing && "pointer-events-none opacity-50",
            className,
          )}
        >
          <div className="flex items-center gap-2">
            {isProcessing ? (
              <Spinner className="size-4" />
            ) : (
              <Upload className="size-4" />
            )}
            <span>Upload Document</span>
          </div>
          <input
            ref={inputRef}
            onChange={(e) => {
              handleFileChange(e);
              onChange?.(e);
            }}
            type="file"
            accept="application/pdf, .docx, .txt, .tex, .latex, .bib"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            disabled={isProcessing}
          />
        </label>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>Upload File</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default ButtonInsertDocumentText;
