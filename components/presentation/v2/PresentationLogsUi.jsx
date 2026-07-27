"use client";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import InputArea from "../InputAreas";
import MessageBubble from "./MessageBubble";

export default function PresentationLogsUi({
  logs = [],
  onViewSummary,
  onSend,
  isLoading: externalIsLoading = false,
  status = null,
  presentationStatus = null,
  handlePreviewOpen = null,
  slidesCount = 0,
}) {
  const scrollContainerRef = useRef(null);
  const router = useRouter();

  const [inputValue, setInputValue] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileUrls, setFileUrls] = useState([]);

  // Handle send action
  const handleSend = async () => {
    if (!inputValue.trim() || externalIsLoading) return;

    // Extract file URLs from uploaded files
    const urls = fileUrls.length > 0 ? fileUrls : null;
    const message = inputValue.trim();

    // Clear input and files immediately for better UX
    // The optimistic log will be added, so user sees their message right away
    setInputValue("");
    setUploadedFiles([]);
    setFileUrls([]);

    // Scroll to bottom immediately after clearing input (optimistic UI)
    // This ensures scroll happens before the optimistic log is added
    setTimeout(() => {
      const el = scrollContainerRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 0);

    // Call the parent's onSend handler
    if (onSend) {
      await onSend(message, urls);
      // Note: Input is already cleared above for immediate feedback
      // If send fails, the optimistic log will still be there
    }
  };

  // Handle new chat - redirect to agents page with slides tab
  const handleNewChat = () => {
    router.push("/agents?tab=slides");
  };

  // Auto-scroll to bottom when logs change
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    // Use a small delay to ensure DOM has updated
    const scrollToBottom = () => {
      // Use scrollTop for instant scroll (better for real-time updates)
      el.scrollTop = el.scrollHeight;
    };

    // Use requestAnimationFrame for better performance, then a small timeout for DOM updates
    requestAnimationFrame(() => {
      scrollToBottom();
      // Also try after a small delay to catch any async DOM updates
      setTimeout(scrollToBottom, 50);
    });
  }, [logs]);

  return (
    // Container: column flex so logs area can be flex:1 and input stays fixed at bottom
    <div className="bg-background flex h-full min-h-0 flex-col">
      {/* Scrollable logs area */}
      <div
        ref={scrollContainerRef}
        className={cn(
          "min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-3 pl-14 md:pl-3",
          "scroll-smooth",
          "[&::-webkit-scrollbar]:w-1.5",
          "[&::-webkit-scrollbar-track]:bg-transparent",
          "[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20",
          "[&::-webkit-scrollbar-thumb]:rounded-sm",
          "[&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/30",
          "scrollbar-thin",
        )}
      >
        <div className="flex flex-col gap-1">
          {logs?.length ? (
            logs.map((l, idx) => (
              // <Typography
              //   key={l.id ?? `${l.type}-${Math.random()}`}
              //   sx={{ py: 1 }}
              // >
              //   {l.text ?? "logs"} {/* render real text if available */}
              // </Typography>

              <MessageBubble
                key={l.id || idx}
                logs={l}
                onViewSummary={onViewSummary}
                handlePreviewOpen={handlePreviewOpen}
              />
            ))
          ) : (
            <p className="text-muted-foreground">No logs yet</p>
          )}

          {/* Show spinner at the end when presentation is still generating */}
          {(() => {
            // Determine if presentation is still generating
            // Show spinner when status is NOT "failed" or "completed"
            const isFailed =
              status === "failed" || presentationStatus === "failed";
            const isCompleted =
              status === "completed" || presentationStatus === "completed";
            const isGenerating =
              !isFailed &&
              !isCompleted &&
              (status === "streaming" ||
                status === "loading_history" ||
                presentationStatus === "queued" ||
                presentationStatus === "processing" ||
                (logs?.length > 0 &&
                  status !== "idle" &&
                  status !== "checking" &&
                  status !== "ready"));

            if (isGenerating) {
              return (
                <div className="flex items-center justify-start gap-2 py-4">
                  <Spinner className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground text-sm">
                    Generating...
                  </span>
                </div>
              );
            }
            return null;
          })()}
        </div>
      </div>

      {/* Mobile: Preview button above input area */}
      {handlePreviewOpen && (
        <div
          className="border-border bg-accent flex w-full cursor-pointer items-start gap-2 border-t p-4"
          onClick={handlePreviewOpen}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24"
            width="24"
            viewBox="0 0 24 24"
            className="text-primary h-7 w-7 shrink-0"
          >
            <path d="M0 0h24v24H0z" fill="none" />
            <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86l-3 3.87L9 13.14 6 17h12l-3.86-5.14z" />
          </svg>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">Preview Slides</h3>
            {slidesCount > 0 && (
              <p className="text-muted-foreground text-sm">
                {slidesCount} slide{slidesCount > 1 ? "s" : ""} available
              </p>
            )}
            {slidesCount === 0 && (
              <p className="text-muted-foreground text-sm">Click to open</p>
            )}
          </div>
        </div>
      )}

      {/* Input area pinned to bottom */}
      <div className="border-border bg-card shrink-0 border-t">
        <InputArea
          currentAgentType={"presentation"}
          inputValue={inputValue}
          setInputValue={setInputValue}
          onSend={handleSend}
          onNewChat={handleNewChat}
          isLoading={externalIsLoading}
          setUploadedFiles={setUploadedFiles}
          setFileUrls={setFileUrls}
          uploadedFiles={uploadedFiles}
          fileUrls={fileUrls}
        />
      </div>
    </div>
  );
}
