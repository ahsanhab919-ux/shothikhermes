"use client";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CloudUpload } from "lucide-react";
import mammoth from "mammoth";
import { useRef, useState } from "react";
import pdfToText from "./pdftotext";

function FileUpload({ isMobile, setInput }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsProcessing(true);
    const fileType = getFileType(file.name);
    try {
      switch (fileType) {
        case "pdf":
          await convertPdfToHtml(file);
          break;
        case "docx":
          await convertDocxToHtml(file);
          break;
        default:
          console.error("Unsupported file type");
      }
    } finally {
      setIsProcessing(false);
      inputRef.current.value = null;
    }
  };

  const getFileType = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();
    if (extension === "pdf") return "pdf";
    if (extension === "docx") return "docx";
    return "";
  };

  // HELPER FUNCTION
  const sanitizeMarkdown = (text) => {
    if (!text) return "";

    return (
      text
        // Remove escaped markdown characters
        .replace(/\\([*_\-#`~[\](){}])/g, "$1")
        // Normalize multiple spaces to single space
        .replace(/\s+/g, " ")
        // Normalize newlines (keep paragraph breaks)
        // .replace(/\n{3,}/g, "\n\n")
        .trim()
    );
  };

  const convertPdfToHtml = async (pdfFile) => {
    try {
      let text = await pdfToText(pdfFile);
      setInput(text);
    } catch (error) {
      console.error("Error converting PDF to HTML:", error);
    }
  };

  const convertDocxToHtml = async (file) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const arrayBuffer = event.target.result;
      try {
        const result = await mammoth.convertToHtml({ arrayBuffer });

        // Convert paragraph and break tags to newlines, then strip all other HTML tags
        let plainText = result.value.replace(/<\/p>/g, "\n\n"); // Replace closing paragraph tags with two newlines
        plainText = plainText.replace(/<br\s*\/?>/g, "\n"); // Replace break tags with one newline
        plainText = plainText.replace(/<p[^>]*>/g, "\n"); // Replace opening paragraph tags (with attributes) with one newline
        plainText = plainText.replace(/<[^>]*>/g, ""); // Strip any remaining HTML tags

        // Add sanitization here
        plainText = sanitizeMarkdown(plainText);

        setInput(plainText.trim()); // Trim leading/trailing whitespace
      } catch (error) {
        console.error("Error converting DOCX to HTML:", error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative">
          <Button
            variant="ghost"
            className={cn(
              "border-primary text-primary border-2 bg-transparent hover:opacity-80",
              "flex items-center gap-1 rounded-lg px-3 py-2.5 text-sm font-bold transition-opacity md:gap-1.5 lg:gap-2",
            )}
            disabled={isProcessing}
            onClick={() => inputRef.current?.click()}
          >
            <CloudUpload className="h-5 w-5 lg:h-5 lg:w-5" />
            {`Upload ${isMobile ? "Doc" : "Document"}`}
            <input
              ref={inputRef}
              onChange={handleFileChange}
              type="file"
              accept="application/pdf, .docx"
              className="absolute inset-0 h-full w-full opacity-0"
              style={{
                clip: "rect(0 0 0 0)",
                clipPath: "inset(50%)",
              }}
            />
          </Button>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">Browse documents (DOCX, PDF).</TooltipContent>
    </Tooltip>
  );
}

export default FileUpload;
