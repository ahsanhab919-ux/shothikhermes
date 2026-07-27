"use client";

import { useChat } from "@/hooks/useChat";
import { useResearchHistory } from "@/hooks/useResearchHistory";
import { useResearchSimulation } from "@/hooks/useResearchSimulation";
import { useResearchStream } from "@/hooks/useResearchStream";
import { cn } from "@/lib/utils";
import {
  clearResearchChatState,
  researchChatState,
  setCurrentChat,
} from "@/redux/slices/researchChatSlice";
import {
  researchCoreState,
  resetResearchCore,
  setIsSimulating,
  setResearchSelectedTab,
  setSimulationStatus,
} from "@/redux/slices/researchCoreSlice";
import { clearResearchUiState } from "@/redux/slices/researchUiSlice";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import HeaderTitle from "./ui/HeaderTitle";
import ResearchDataArea from "./ui/ResearchDataArea";
import ResearchPageSkeletonLoader from "./ui/ResearchPageSkeletonLoader";
import ResearchStreamingShell from "./ui/ResearchStreamingShell";
import TabsPanel from "./ui/TabPanel";

export default function ResearchAgentPage({
  loadingResearchHistory,
  setLoadingResearchHistory,
}) {
  const scrollRef = useRef(null);
  const researchRefs = useRef({}); // Ref to store individual research item DOM elements
  const [isInitializingResearch, setIsInitializingResearch] = useState(true);
  const [headerHeight, setHeaderHeight] = useState(20); // default
  const [isSimulationCompleted, setIsSimulationCompleted] = useState(false);

  const dispatch = useDispatch();
  //   const { headerHeight } = useSelector((state) => state.ui);
  const { currentChatId } = useChat();
  const { startResearch } = useResearchStream();
  const { startSimulationResearch } = useResearchSimulation();

  const researchChat = useSelector(researchChatState);
  const researchCore = useSelector(researchCoreState);

  const searchParams = useSearchParams();
  const chatIdFromUrl = searchParams.get("id");

  const researchId = searchParams.get("r_id");
  const isSimulationMode = Boolean(researchId);
  const actualChatId = researchId || chatIdFromUrl;

  const { checkAndRecoverConnection, manualReconnect } = useResearchStream();
  const { loadChatResearchesWithQueueCheck } = useResearchHistory();

  const researchConfig = JSON.parse(sessionStorage.getItem("r-config"));


  // 

  // const initialQuery = sessionStorage.getItem("activeResearchChatId") || "";
  const initialUserPrompt = sessionStorage.getItem("initialResearchPrompt");

  // useEffect(() => {
  //   // Create initial chat if none exists
  //   if (!currentChatId) {
  //     createNewChat(initialQuery);
  //   }
  // }, [currentChatId, createNewChat]);

  useEffect(() => {
    if (!researchChat?.currentChatId) {
      sessionStorage.setItem("activeResearchChatId", actualChatId);
      dispatch(setCurrentChat(actualChatId));
    }
    return () => {
      // clean up effects
      if (!isSimulationMode) {
        // sessionStorage.removeItem("activeResearchChatId");
      }
      dispatch(clearResearchChatState());
      dispatch(resetResearchCore());
      dispatch(clearResearchUiState());
    };
  }, [actualChatId, isSimulationMode]);

  useEffect(() => {
    try {
      const loadResearches = async () => {
        if (currentChatId) {
          // For simulation mode, skip recovery and queue checks
          if (isSimulationMode) {
            setIsInitializingResearch(true);
            dispatch(setIsSimulating(true));
            dispatch(setSimulationStatus("ongoing"));

            // Start simulation immediately
            setTimeout(() => {
              startSimulationResearch(researchId, setIsSimulationCompleted);
              setIsInitializingResearch(false);
            }, 500);

            setLoadingResearchHistory(false);
            return;
          }

          // First check for interrupted connections
          await checkAndRecoverConnection();

          // Load existing researches and check queue status
          const { researches, hasActiveQueue } =
            await loadChatResearchesWithQueueCheck();

          //

          // Only start new research if:
          // 1. No existing researches AND
          // 2. No active/waiting queue AND
          // 3. We have an initial query AND
          // 4. We're not currently streaming or polling
          if (
            researches.length === 0 &&
            !hasActiveQueue &&
            !researchCore?.isStreaming &&
            !researchCore?.isPolling
          ) {
            const initialQuery = sessionStorage.getItem("initialResearchPrompt");
            if (initialQuery) {
              setIsInitializingResearch(true); // still initializing
              // Small delay to ensure all states are properly initialized
              setTimeout(() => {
                startResearch(initialQuery, {
                  effort:
                    researchConfig?.topK === 2
                      ? "low"
                      : researchConfig?.topK === 6
                        ? "medium"
                        : "high",
                  model:
                    researchConfig?.model === "basic"
                      ? "gemini-2.0-flash"
                      : "gemini-2.5-pro",
                });

                // Clean up after successful consumption
                sessionStorage.removeItem("initialResearchPrompt");
                sessionStorage.removeItem("r-config");

                setIsInitializingResearch(false); // after call triggered
              }, 500);
            } else {
              setIsInitializingResearch(false);
            }
          } else {
            // If we didn't start research (e.g. existing research or queue full),
            // we should still clean up the prompt to prevent it from leaking to other chats
            if (sessionStorage.getItem("initialResearchPrompt")) {
              sessionStorage.removeItem("initialResearchPrompt");
              sessionStorage.removeItem("r-config");
            }
            setIsInitializingResearch(false);
          }

          setLoadingResearchHistory(false);
        }
      };

      loadResearches();
    } catch (error) {
      console.error("Error loading research history:", error);
      setLoadingResearchHistory(false);
      setIsInitializingResearch(false);
    }
  }, [currentChatId, isSimulationMode, researchId]);

  useEffect(() => {
    if (scrollRef.current && researchCore?.isStreaming) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [
    researchCore?.isStreaming,
    researchCore?.researches?.length,
    researchCore?.streamEvents,
  ]);

  if (loadingResearchHistory || isInitializingResearch) {
    return <ResearchPageSkeletonLoader />;
  }

  return (
    <div
      ref={scrollRef}
      className={cn(
        "bg-background relative mx-auto max-w-[1000px] overflow-y-auto pr-4 pl-14 sm:px-0",
        "min-h-[calc(100dvh-180px)] sm:min-h-[calc(100dvh-200px)] md:min-h-[calc(100dvh-230px)] lg:min-h-[calc(100dvh-250px)] xl:min-h-[calc(100dvh-270px)]",
        isSimulationMode
          ? "max-h-[calc(100dvh-130px)] sm:max-h-[calc(100dvh-100px)] md:max-h-[calc(100dvh-130px)] lg:max-h-[calc(100dvh-150px)] xl:max-h-[calc(100dvh-170px)]"
          : "mb-[110px] max-h-[calc(100dvh-155px)] sm:max-h-[calc(100dvh-170px)] md:max-h-[calc(100dvh-200px)] lg:max-h-[calc(100dvh-200px)] xl:max-h-[calc(100dvh-200px)]",
        isSimulationMode
          ? "mb-0 sm:mb-[35px] md:mb-[60px] lg:mb-[80px] xl:mb-[100px]"
          : "mb-[110px] sm:mb-[105px] md:mb-[130px] lg:mb-[130px] xl:mb-[130px]",
      )}
    >
      {/* research data */}
      <div className="flex flex-col gap-2 sm:gap-4">
        {researchCore?.researches.length > 0 &&
          researchCore?.researches?.map((research, idx) => (
            <div
              key={research._id}
              ref={(el) => (researchRefs.current[research._id] = el)} // Assign ref to each research item
            >
              <div className="bg-background sticky top-0 z-10">
                <HeaderTitle
                  headerHeight={headerHeight}
                  setHeaderHeight={setHeaderHeight}
                  query={research.query}
                  researchItem={research}
                />
                <TabsPanel
                  selectedTab={research.selectedTab}
                  sources={research.sources}
                  images={research.images}
                  onTabChange={(newValue) => {
                    dispatch(
                      setResearchSelectedTab({
                        researchId: research._id,
                        selectedTab: newValue,
                      }),
                    );
                    // Scroll to the research item when its tab is clicked
                    if (researchRefs.current[research._id]) {
                      researchRefs.current[research._id].scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }
                  }}
                />
              </div>

              {/* data area */}
              <ResearchDataArea
                selectedTab={research.selectedTab}
                research={research}
                isLastData={idx === researchCore?.researches?.length - 1}
                onSwitchTab={(newTab) => {
                  dispatch(
                    setResearchSelectedTab({
                      researchId: research._id,
                      selectedTab: newTab,
                    }),
                  );
                  // Scroll to the research item when switching tabs
                  if (researchRefs.current[research._id]) {
                    researchRefs.current[research._id].scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }}
              />
            </div>
          ))}
      </div>

      {/* when streaming */}
      {/* {(researchCore?.isStreaming || researchCore?.isPolling) && (
          <StreamingIndicator
            streamEvents={researchCore?.streamEvents}
            isPolling={researchCore?.isPolling}
            connectionStatus={researchCore?.connectionStatus}
            onRetry={manualReconnect}
          />
        )} */}

      {(researchCore?.isStreaming || researchCore?.isPolling) && (
        // <ResearchProcessLogs
        //   streamEvents={researchCore?.streamEvents}
        //   researches={researchCore?.researches}
        //   isStreaming={researchCore?.isStreaming || researchCore?.isPolling}
        // />
        <ResearchStreamingShell
          streamEvents={researchCore?.streamEvents}
          isStreaming={researchCore?.isStreaming || researchCore?.isPolling}
          userQuery={initialUserPrompt}
        />
      )}
    </div>
  );
}
