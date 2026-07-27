"use client";

import { sanitizeHtml } from "@/lib/sanitize";
import { cn } from "@/lib/utils";
import { marked } from "marked";
import { useState } from "react";
import CombinedActions from "./CombinedActions";
import ReferenceModal from "./ReferenceModal";
import SourcesGrid from "./SourcesGrid";

const ResearchContentWithReferences = ({
  content,
  sources = [],
  isLastData,
  isDataGenerating,
  title = "Research Results",
  agentId,
  onSwitchToSourcesTab,
}) => {
  const [selectedReference, setSelectedReference] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [hoverTimeout, setHoverTimeout] = useState(null);

  // Handle feedback submission
  const handleFeedback = async (feedbackType) => {
    try {
      // You can implement your feedback API call here
      // Example: await submitFeedback({ type: feedbackType, content, sources });
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    }
  };

  // Function to process content and make references clickable
  const processContentWithReferences = (text) => {
    // Ensure text is a string and clean it
    if (!text || typeof text !== "string") {
      if (typeof text === "object" && text !== null) {
        text = text.text || text.content || text.result || text.answer || "";
      } else {
        text = String(text || "");
      }
    }

    // Remove any [object Object] strings that might be in the text
    text = text.replace(/\[object Object\]/g, "");

    // Regular expression to find reference patterns like [1], [2, 9], [12, 13], etc.
    const referenceRegex = /\[(\d+(?:,\s*\d+)*)\]/g;

    return text.replace(referenceRegex, (match, numbers) => {
      const refNumbers = numbers.split(",").map((n) => parseInt(n.trim()));

      // Create clickable spans for each reference
      return refNumbers
        .map((refNum) => {
          const sourceExists = sources.some(
            (source) => source.reference === refNum,
          );
          if (sourceExists) {
            return `<span class="reference-link inline-block relative cursor-pointer rounded px-0.5 py-px font-medium text-primary underline transition-all duration-200 hover:bg-primary/10" data-reference="${refNum}">[${refNum}]</span>`;
          }
          return `[${refNum}]`;
        })
        .join("");
    });
  };

  const handleReferenceHover = (reference, event) => {

    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }

    setSelectedReference(reference);
    setAnchorEl(event.currentTarget);
    setModalOpen(true);
  };

  const handleReferenceLeave = () => {
    // Add a small delay to prevent flickering
    const timeout = setTimeout(() => {
      setModalOpen(false);
      setSelectedReference(null);
      setAnchorEl(null);
    }, 100);
    setHoverTimeout(timeout);
  };

  // Handle content - it might be an object with text property or a string
  let contentStr = "";
  if (typeof content === "string") {
    contentStr = content;
  } else if (typeof content === "object" && content !== null) {
    // If content is an object, try to extract the text content
    contentStr =
      content.text || content.content || content.result || content.answer || "";
  } else {
    contentStr = String(content || "");
  }

  // Clean any [object Object] strings from the content
  contentStr = contentStr.replace(/\[object Object\]/g, "");

  const processedContent = processContentWithReferences(contentStr);

  // Configure marked options
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  // Add hover event listeners after rendering
  const handleContentMouseOver = (event) => {
    const target = event.target;
    if (target.classList.contains("reference-link")) {
      const reference = parseInt(target.getAttribute("data-reference"));

      // Create a proper anchor element for this specific reference
      const rect = target.getBoundingClientRect();
      const anchorElement = {
        getBoundingClientRect: () => ({
          top: rect.top,
          left: rect.left,
          bottom: rect.bottom,
          right: rect.right,
          width: rect.width,
          height: rect.height,
        }),
        nodeType: 1,
      };

      handleReferenceHover(reference, { currentTarget: anchorElement });
    }
  };

  const handleContentMouseLeave = (event) => {
    const target = event.target;
    if (target.classList.contains("reference-link")) {
      handleReferenceLeave();
    }
  };

  return (
    <>
      <div className="flex w-full items-start">
        <div
          className={cn(
            "bg-background box-border w-full max-w-full flex-1 border-none px-3 py-2 shadow-none",
            isLastData && isDataGenerating
              ? "mb-2 sm:mb-9 md:mb-2"
              : "mb-[4.75rem] sm:mb-9 md:mb-2",
          )}
        >
          {/* Sources Grid - Display at the top like Perplexity */}
          {sources && sources.length > 0 && (
            <SourcesGrid
              sources={sources}
              onViewAllSources={onSwitchToSourcesTab}
            />
          )}

          <div
            className={cn(
              "prose max-w-none dark:prose-invert",
              "prose-headings:font-bold prose-headings:break-words",
              "prose-h1:text-2xl prose-h1:mb-4",
              "prose-h2:text-xl prose-h2:mb-4",
              "prose-h3:text-lg prose-h3:mb-4",
              "prose-h4:text-base prose-h4:mb-4",
              "prose-p:mb-4 prose-p:break-words prose-p:hyphens-auto",
              "prose-a:text-primary prose-a:break-all",
              "prose-code:bg-muted-foreground/10 prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:text-sm prose-code:break-all prose-code:before:content-none prose-code:after:content-none",
              "prose-pre:bg-muted-foreground/10 prose-pre:p-3 prose-pre:rounded-lg",
              "prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground",
              "prose-img:rounded-lg prose-img:max-w-full",
              "prose-th:p-2 prose-th:text-left prose-td:p-2",
            )}
            onMouseOver={handleContentMouseOver}
            onMouseLeave={handleContentMouseLeave}
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(marked(processedContent)),
            }}
          />

          <span className="text-muted-foreground mt-1 block text-right text-[0.6rem] sm:text-xs" />

          {/* Combined Sharing and Feedback Actions */}
          <CombinedActions
            content={processedContent}
            sources={sources}
            title={title}
            onFeedback={handleFeedback}
            agentId={agentId}
          />
        </div>
      </div>

      <ReferenceModal
        open={modalOpen}
        onClose={handleReferenceLeave}
        reference={selectedReference}
        sources={sources}
        anchorEl={anchorEl}
      />
    </>
  );
};

export default ResearchContentWithReferences;
