"use client";

import { handleFollowUpQuery } from "@/components/agents/super-agent/agentPageUtils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import usePresentationOrchestrator from "@/hooks/orchestrator/usePresentationOrchestrator";
import { useIsMobile } from "@/hooks/ui/useMobile";
import { cn } from "@/lib/utils";
import { selectPresentation } from "@/redux/slices/presentationSlice";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PresentationAgentPageV2Skeleton from "./PresentationAgentPageV2Skeleton";
import PreviewPanel from "./PreviewPanel";
import PresentationLogsUi from "./v2/PresentationLogsUi";

export default function PresentationAgentPageV2({ presentationId }) {
  const dispatch = useDispatch();
  const presentationState = useSelector(selectPresentation);
  const user = useSelector((state) => state.auth.user);
  const [browserWorkerSummary, setBrowserWorkerSummary] = useState(null);
  const [isLoadingFollowUp, setIsLoadingFollowUp] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const isMobile = useIsMobile();

  // Handler for View button in BrowserWorkerLog
  const handleViewSummary = (log) => {
    if (log?.summary) {
      setBrowserWorkerSummary(log.summary);
    }
  };

  // Handler to close summary
  const handleCloseSummary = () => {
    setBrowserWorkerSummary(null);
  };

  // Handler for opening preview on mobile
  const handlePreviewOpen = () => {
    setPreviewOpen(true);
  };

  // Handler for closing preview on mobile
  const handlePreviewClose = () => {
    setPreviewOpen(false);
  };

  // Toast notification handler
  const showToast = useCallback((message, variant = "default") => {
    // Using console for now - can be replaced with a toast library later
    if (variant === "error" || variant === "destructive") {
      console.error("[Toast]", message);
    } else if (variant === "success") {
    } else {
      console.info("[Toast]", message);
    }
  }, []);

  // Handler for follow-up queries
  const handleFollowUp = useCallback(
    async (message, fileUrls) => {
      // Get current p_id from presentation state (prefer pId, fallback to slideCurrentId)
      const currentPId =
        presentationState.pId ||
        presentationState.slideCurrentId ||
        presentationId;

      // Get userId from auth state
      const userId = user?._id;

      await handleFollowUpQuery(
        message,
        fileUrls,
        currentPId,
        userId,
        dispatch,
        setIsLoadingFollowUp,
        showToast,
      );
    },
    [
      presentationState.pId,
      presentationState.slideCurrentId,
      presentationId,
      user?._id,
      dispatch,
      showToast,
    ],
  );

  // Initialize orchestrator - handles all status-based logic
  const { hookStatus, error, retry, currentStatus, socketConnected } =
    usePresentationOrchestrator(presentationId);

  /**
   * Render error state
   */
  if (hookStatus === "error" || presentationState.status === "failed") {
  }

  /**
   * Render loading state for initial status check
   */
  if (hookStatus === "checking" || hookStatus === "idle") {
    return <PresentationAgentPageV2Skeleton />;
  }

  /**
   * Render loading state for history loading
   */
  if (hookStatus === "loading_history") {
    return <PresentationAgentPageV2Skeleton />;
  }

  /**
   * Render main interface
   * Shows when: streaming, ready, or has data to display
   */

  return (
    <div
      className={cn(
        "h-[calc(100dvh-50px)] lg:h-[calc(100dvh-64px)]",
        "bg-background text-foreground",
        "flex flex-col overflow-hidden",
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {isMobile ? (
          <>
            {/* Mobile: Show only logs area */}
            <div className="flex flex-1 flex-col overflow-hidden">
              <PresentationLogsUi
                logs={presentationState.logs}
                onViewSummary={handleViewSummary}
                onSend={handleFollowUp}
                isLoading={isLoadingFollowUp}
                status={presentationState.status}
                presentationStatus={presentationState.presentationStatus}
                handlePreviewOpen={handlePreviewOpen}
                slidesCount={presentationState.slides?.length || 0}
              />
            </div>
            {/* Mobile: Preview panel in dialog */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
              <DialogContent className="h-[80vh] max-h-[80vh] max-w-3xl overflow-hidden p-0">
                <VisuallyHidden>
                  <DialogTitle>Slide Preview</DialogTitle>
                </VisuallyHidden>
                <PreviewPanel
                  currentAgentType={"presentation"}
                  slidesData={presentationState.slides}
                  presentationId={presentationState.slideCurrentId}
                  title={presentationState.title}
                  status={presentationState.status}
                  presentationStatus={presentationState.presentationStatus}
                  browserWorkerSummary={browserWorkerSummary}
                  onCloseSummary={handleCloseSummary}
                  error={presentationState.error || error}
                />
              </DialogContent>
            </Dialog>
          </>
        ) : (
          /* Desktop: Show both logs and preview side by side */
          <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-1 overflow-hidden md:grid-cols-2">
            <div className="border-border flex h-full min-h-0 flex-col overflow-hidden border-r">
              <PresentationLogsUi
                logs={presentationState.logs}
                onViewSummary={handleViewSummary}
                onSend={handleFollowUp}
                isLoading={isLoadingFollowUp}
                status={presentationState.status}
                presentationStatus={presentationState.presentationStatus}
              />
            </div>
            <div className="flex min-h-0 flex-col overflow-hidden">
              <PreviewPanel
                currentAgentType={"presentation"}
                slidesData={presentationState.slides}
                presentationId={presentationState.slideCurrentId}
                title={presentationState.title}
                status={presentationState.status}
                presentationStatus={presentationState.presentationStatus}
                browserWorkerSummary={browserWorkerSummary}
                onCloseSummary={handleCloseSummary}
                error={presentationState.error || error}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
