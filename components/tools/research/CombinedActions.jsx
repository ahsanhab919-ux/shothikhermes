"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Download,
  FileText,
  Globe,
  Mail,
  RotateCw,
  Share2,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useState } from "react";
import ShareAgentModal from "../../share/ShareAgentModal";

const CombinedActions = ({ content, sources, title, onFeedback, agentId }) => {
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareModalDefaultTab, setShareModalDefaultTab] = useState(0);

  const handleCopyLink = async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
    setShareMenuOpen(false);
  };

  const handleShare = (shareResult) => {
    setShareMenuOpen(false);
  };

  // ===== LOAD SHOTHIK AI LOGO FROM FILE =====
  const loadShothikLogo = () => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL("image/png");
          resolve(dataURL);
        } catch (error) {
          console.error("Failed to convert logo to base64:", error);
          resolve(null);
        }
      };

      img.onerror = (error) => {
        console.error("Error loading logo from file:", error);
        resolve(null);
      };

      // Load the actual logo file from public directory (same as AI detector)
      img.src = "/shothik_light_logo.png";
    });
  };

  const handleExportPDF = async () => {
    try {
      const jsPDFMod = await import("jspdf").catch((e) => {
        console.error("Failed to import jspdf", e);
        return null;
      });
      if (!jsPDFMod) throw new Error("Failed to load PDF library");
      const jsPDF = jsPDFMod.default || jsPDFMod.jsPDF;

      const markedMod = await import("marked").catch((e) => {
        console.error("Failed to import marked", e);
        return null;
      });
      const DOMPurifyMod = await import("dompurify").catch((e) => {
        console.error("Failed to import dompurify", e);
        return null;
      });

      const marked = markedMod?.marked || markedMod?.default || markedMod;
      const DOMPurify = DOMPurifyMod?.default || DOMPurifyMod;

      if (!marked || !DOMPurify) {
        console.error("Missing PDF generation libraries.");
        throw new Error("Missing PDF generation libraries");
      }

      // ===== LOAD LOGO FOR PDF =====
      const logoBase64 = await loadShothikLogo();

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 50;
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = pageHeight - margin * 2;

      let yPosition = margin;
      let currentPage = 1;
      const lineHeight = 16;
      const maxLinesPerPage = Math.floor(contentHeight / lineHeight) - 3;
      let currentLineCount = 0;

      const markdownContent = content || "";
      const html =
        typeof marked === "function"
          ? marked(markdownContent)
          : marked.marked(markdownContent);
      const cleanHtml = DOMPurify.sanitize(html);

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = cleanHtml;

      const imgs = tempDiv.querySelectorAll("img");
      imgs.forEach((img) => img.remove());

      // ===== ADD HEADER WITH LOGO TO FIRST PAGE =====
      if (logoBase64) {
        try {
          // Logo size to match AI Detection Report (width: 120, increased height for better proportion)
          doc.addImage(logoBase64, "PNG", margin, yPosition, 120, 40);
          yPosition += 50; // Increased spacing after logo for better margin bottom
          currentLineCount += 2;
        } catch (error) {
          console.error("Error adding logo image:", error);
          // Fallback: Add text logo if image fails
          doc.setFontSize(16);
          doc.setFont("helvetica", "bold");
          doc.setTextColor("#1a1a1a");
          doc.text("SHOTHIK AI", margin, yPosition + 15);
          yPosition += 30;
          currentLineCount += 2;
        }
      } else {
        console.warn("Logo not available, using text fallback");
        // Fallback: Add text logo if image loading fails
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor("#1a1a1a");
        doc.text("SHOTHIK AI", margin, yPosition + 15);
        yPosition += 30;
        currentLineCount += 2;
      }

      // Add "Research Results" title with AI detector-style spacing
      const queryTitle = title || "Research Results";
      doc.setFontSize(16); // Match AI detector title size
      doc.setFont("helvetica", "bold");
      doc.setTextColor("#637381"); // Match AI detector title color

      const titleLines = doc.splitTextToSize(queryTitle, contentWidth);
      titleLines.forEach((line) => {
        doc.text(line, margin, yPosition);
        yPosition += 16; // Match AI detector line height
        currentLineCount += 1;
      });

      yPosition += 8; // Spacing after title to match AI detector
      currentLineCount += 1;

      // Add generation date with minimal spacing
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor("#888888");
      const currentDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      doc.text(`Generated on ${currentDate}`, margin, yPosition);
      yPosition += 12; // Minimal spacing after date
      currentLineCount += 1;

      // Add separator line with minimal spacing
      doc.setDrawColor("#e5e5e5");
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 20; // Increased spacing after separator for better content separation
      currentLineCount += 1;

      const addNewPage = () => {
        doc.addPage();
        yPosition = margin;
        currentLineCount = 0;
        currentPage++;
      };

      const checkPageBreak = (linesToAdd = 1) => {
        if (currentLineCount + linesToAdd > maxLinesPerPage) {
          addNewPage();
          return true;
        }
        return false;
      };

      const addSpacing = (lines = 1) => {
        if (currentLineCount + lines <= maxLinesPerPage) {
          yPosition += lineHeight * lines;
          currentLineCount += lines;
        }
      };

      const addTextWithInlineReferences = (
        text,
        fontSize = 11,
        fontStyle = "normal",
        color = "#000000",
        customMargin = margin,
      ) => {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", fontStyle);

        const maxWidth = contentWidth - (customMargin - margin);

        const referenceRegex = /(\[[\d,\s]+\])/g;
        const parts = text.split(referenceRegex).filter((p) => p);

        let words = [];

        parts.forEach((part) => {
          if (/^\[[\d,\s]+\]$/.test(part)) {
            words.push({ text: part, isRef: true });
          } else {
            part.split(/\s+/).forEach((word) => {
              if (word) words.push({ text: word, isRef: false });
            });
          }
        });

        let currentLine = [];
        let currentLineWidth = 0;

        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          const wordWidth = doc.getTextWidth(word.text + " ");

          if (currentLineWidth + wordWidth < maxWidth) {
            currentLine.push(word);
            currentLineWidth += wordWidth;
          } else {
            if (currentLine.length > 0) {
              renderLine(currentLine, customMargin, color, fontSize);
              yPosition += lineHeight;
              currentLineCount++;
              checkPageBreak(1);
            }
            currentLine = [word];
            currentLineWidth = wordWidth;
          }
        }

        if (currentLine.length > 0) {
          renderLine(currentLine, customMargin, color, fontSize);
          yPosition += lineHeight;
          currentLineCount++;
        }
      };

      const renderLine = (words, startX, defaultColor, fontSize) => {
        let currentX = startX;

        words.forEach((word, index) => {
          if (word.isRef) {
            const refMatch = word.text.match(/\[(\d+(?:,\s*\d+)*)\]/);
            if (refMatch) {
              const refNumbers = refMatch[1]
                .split(",")
                .map((n) => parseInt(n.trim()));
              const firstRef = refNumbers[0];
              const source = sources.find((s) => s.reference === firstRef);

              doc.setTextColor("#000000");
              doc.setFont("helvetica", "normal");
              doc.text(word.text, currentX, yPosition);

              if (source && source.url) {
                const textWidth = doc.getTextWidth(word.text);
                doc.link(
                  currentX,
                  yPosition - fontSize,
                  textWidth,
                  fontSize + 2,
                  {
                    url: source.url,
                  },
                );
              }

              currentX += doc.getTextWidth(word.text);
            }
          } else {
            doc.setTextColor(defaultColor);
            doc.setFont("helvetica", "normal");
            const wordText =
              index < words.length - 1 ? word.text + " " : word.text;
            doc.text(wordText, currentX, yPosition);
            currentX += doc.getTextWidth(wordText);
          }
        });
      };

      const processElement = (element) => {
        const tagName = element.tagName?.toLowerCase();
        const textContent = element.textContent?.trim();

        if (!textContent) return;

        switch (tagName) {
          case "h1":
            checkPageBreak(3);
            addSpacing(2.5);
            doc.setFontSize(22);
            doc.setLineHeight(2);
            doc.setFont("helvetica", "bold");
            doc.setTextColor("#1a1a1a");
            const h1Lines = doc.splitTextToSize(textContent, contentWidth);
            h1Lines.forEach((line) => {
              checkPageBreak(1);
              doc.text(line, margin, yPosition);
              yPosition += lineHeight;
              currentLineCount++;
            });
            addSpacing(2.5); // Increased spacing after main title for better content separation
            break;

          case "h2":
            checkPageBreak(2);
            addSpacing(0.8);
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.setTextColor("#1a1a1a");
            const h2Lines = doc.splitTextToSize(textContent, contentWidth);
            h2Lines.forEach((line) => {
              checkPageBreak(1);
              doc.text(line, margin, yPosition);
              yPosition += lineHeight;
              currentLineCount++;
            });
            addSpacing(0.8);
            break;

          case "h3":
            checkPageBreak(2);
            addSpacing(0.6);
            doc.setFontSize(15);
            doc.setFont("helvetica", "bold");
            doc.setTextColor("#1a1a1a");
            const h3Lines = doc.splitTextToSize(textContent, contentWidth);
            h3Lines.forEach((line) => {
              checkPageBreak(1);
              doc.text(line, margin, yPosition);
              yPosition += lineHeight;
              currentLineCount++;
            });
            addSpacing(0.6);
            break;

          case "h4":
            checkPageBreak(2);
            addSpacing(0.5);
            doc.setFontSize(13);
            doc.setFont("helvetica", "bold");
            doc.setTextColor("#1a1a1a");
            const h4Lines = doc.splitTextToSize(textContent, contentWidth);
            h4Lines.forEach((line) => {
              checkPageBreak(1);
              doc.text(line, margin, yPosition);
              yPosition += lineHeight;
              currentLineCount++;
            });
            addSpacing(0.5);
            break;

          case "p":
            if (textContent) {
              checkPageBreak(2);
              addTextWithInlineReferences(textContent, 11, "normal", "#333333");
              addSpacing(1.2);
            }
            break;

          case "li":
            checkPageBreak(2);
            const bulletIndent = 18;
            const textIndent = 12;
            const totalIndent = bulletIndent + textIndent;

            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            doc.setTextColor("#333333");
            doc.text("•", margin + bulletIndent, yPosition);

            addTextWithInlineReferences(
              textContent,
              11,
              "normal",
              "#333333",
              margin + totalIndent,
            );

            addSpacing(0.6);
            break;

          case "strong":
          case "b":
            addTextWithInlineReferences(textContent, 11, "bold", "#1a1a1a");
            break;

          case "em":
          case "i":
            addTextWithInlineReferences(textContent, 11, "italic", "#555555");
            break;

          case "blockquote":
            checkPageBreak(2);
            doc.setDrawColor("#e5e5e5");
            doc.setLineWidth(1);
            doc.line(margin + 12, yPosition - 8, margin + 12, yPosition + 12);
            addSpacing(0.5);
            addTextWithInlineReferences(
              textContent,
              11,
              "italic",
              "#666666",
              margin + 25,
            );
            addSpacing(1);
            break;

          default:
            if (textContent) {
              addTextWithInlineReferences(textContent, 11, "normal", "#333333");
            }
            break;
        }
      };

      const allElements = tempDiv.querySelectorAll("*");
      const processedElements = new Set();

      allElements.forEach((element) => {
        let shouldProcess = true;
        let parent = element.parentNode;
        while (parent && parent !== tempDiv) {
          if (processedElements.has(parent)) {
            shouldProcess = false;
            break;
          }
          parent = parent.parentNode;
        }

        if (shouldProcess && !processedElements.has(element)) {
          const hasProcessableChildren =
            element.querySelectorAll("h1, h2, h3, p, li").length > 0;
          if (!hasProcessableChildren) {
            processElement(element);
            processedElements.add(element);
          }
        }
      });

      const walker = document.createTreeWalker(
        tempDiv,
        NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: (node) => {
            if (
              ["H1", "H2", "H3", "P", "LI"].includes(node.tagName) &&
              !processedElements.has(node)
            ) {
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_SKIP;
          },
        },
      );

      let node;
      while ((node = walker.nextNode())) {
        if (!processedElements.has(node)) {
          processElement(node);
          processedElements.add(node);
        }
      }

      // Professional Sources section
      if (sources && sources.length > 0) {
        checkPageBreak(4);
        addSpacing(1.5);

        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.setTextColor("#1a1a1a");
        doc.text(`Sources (${sources.length})`, margin, yPosition);
        yPosition += lineHeight;
        currentLineCount++;

        addSpacing(0.8);

        doc.setDrawColor("#e5e5e5");
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 16;
        currentLineCount += 1;

        sources.forEach((s, index) => {
          checkPageBreak(2);

          const sourceTitle = s.title || s.resolved_url || s.url || "Source";
          const sourceUrl = s.url || s.resolved_url || "";

          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.setTextColor("#1a1a1a");
          doc.text(`${index + 1}.`, margin, yPosition);

          const titleWidth = doc.getTextWidth(`${index + 1}. `);
          const titleLines = doc.splitTextToSize(
            sourceTitle,
            contentWidth - titleWidth - 15,
          );

          titleLines.forEach((line) => {
            checkPageBreak(1);
            doc.setFont("helvetica", "normal");
            doc.text(line, margin + titleWidth, yPosition);
            yPosition += lineHeight;
            currentLineCount++;
          });

          if (sourceUrl) {
            yPosition += 4;
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.setTextColor("#000000");
            const urlLines = doc.splitTextToSize(
              sourceUrl,
              contentWidth - titleWidth - 15,
            );
            urlLines.forEach((line) => {
              checkPageBreak(1);
              doc.text(line, margin + titleWidth, yPosition);

              // Add clickable link
              const lineWidth = doc.getTextWidth(line);
              doc.link(margin + titleWidth, yPosition - 9, lineWidth, 9, {
                url: sourceUrl,
              });

              // Add underline to URL
              doc.setDrawColor("#000000");
              doc.setLineWidth(0.5);
              doc.line(
                margin + titleWidth,
                yPosition + 1,
                margin + titleWidth + lineWidth,
                yPosition + 1,
              );

              yPosition += lineHeight - 2;
              currentLineCount++;
            });
            yPosition += 4;
            currentLineCount++;
          }
        });
      }

      // ===== ADD FOOTER WITH LOGO TO ALL PAGES =====
      const totalPages = doc.internal.getNumberOfPages();

      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Add separator line
        doc.setDrawColor("#e5e5e5");
        doc.setLineWidth(0.5);
        doc.line(margin, pageHeight - 40, pageWidth - margin, pageHeight - 40);

        // Add SHOTHIK AI logo to footer
        if (logoBase64) {
          try {
            // Footer logo size proportional to header (smaller but increased height for better proportion)
            doc.addImage(logoBase64, "PNG", margin, pageHeight - 35, 80, 26);
          } catch (error) {
            console.error("Failed to add logo to footer on page", i, error);
            // Fallback: Add text logo if image fails
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor("#1a1a1a");
            doc.text("SHOTHIK AI", margin, pageHeight - 25);
          }
        } else {
          // Fallback: Add text logo if image loading fails
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.setTextColor("#1a1a1a");
          doc.text("SHOTHIK AI", margin, pageHeight - 25);
        }

        // Add page number on the right
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor("#999999");
        const pageText = `Page ${i} of ${totalPages}`;
        const pageTextWidth = doc.getTextWidth(pageText);
        doc.text(pageText, pageWidth - margin - pageTextWidth, pageHeight - 18);
      }

      doc.save(`${title || "research-results"}.pdf`);
    } catch (err) {
      console.error("Failed to export PDF:", err);
    }
    setExportMenuOpen(false);
  };

  const handleRewrite = () => {
  };

  const handleFeedback = async (type) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setFeedback(type);

    try {
      if (onFeedback) {
        await onFeedback(type);
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      setFeedback(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-border bg-background flex items-center justify-between gap-2 border-t px-2 py-1">
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <DropdownMenu open={shareMenuOpen} onOpenChange={setShareMenuOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:bg-accent h-8 w-8"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Share</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start">
              {agentId ? (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      setShareMenuOpen(false);
                      setShareModalDefaultTab(0);
                      setShareModalOpen(true);
                    }}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>Share via Email</span>
                      <span className="text-muted-foreground text-xs">
                        Send to specific people
                      </span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setShareMenuOpen(false);
                      setShareModalDefaultTab(1);
                      setShareModalOpen(true);
                    }}
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>Create Public Link</span>
                      <span className="text-muted-foreground text-xs">
                        Anyone with link can view
                      </span>
                    </div>
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu open={exportMenuOpen} onOpenChange={setExportMenuOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:bg-accent h-8 w-8"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Export</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="mr-2 h-4 w-4" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRewrite}
                className="text-muted-foreground hover:bg-accent h-8 w-8"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Rewrite</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex items-center gap-1">
        <span className="text-muted-foreground mr-1 text-sm">
          Was this helpful?
        </span>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleFeedback("helpful")}
                disabled={isSubmitting}
                className={cn(
                  "h-8 w-8",
                  feedback === "helpful"
                    ? "text-green-600 hover:text-green-600"
                    : "text-muted-foreground hover:bg-accent hover:text-green-600",
                )}
              >
                <ThumbsUp className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Yes, helpful</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleFeedback("not-helpful")}
                disabled={isSubmitting}
                className={cn(
                  "h-8 w-8",
                  feedback === "not-helpful"
                    ? "text-red-600 hover:text-red-600"
                    : "text-muted-foreground hover:bg-accent hover:text-red-600",
                )}
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>No, not helpful</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Share Agent Modal */}
      {agentId && (
        <ShareAgentModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          agentId={agentId}
          agentData={{ content, sources, title }}
          defaultTab={shareModalDefaultTab}
        />
      )}
    </div>
  );
};

export default CombinedActions;
