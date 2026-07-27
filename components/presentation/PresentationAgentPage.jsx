"use client";

import { useAgentContext } from "@/components/agents/shared/AgentContextProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  selectPresentation,
  setPresentationState,
} from "@/redux/slices/presentationSlice";
import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import io from "socket.io-client";
import ChatArea from "./ChatArea";
import PreviewPanel from "./PreviewPanel";
const PHASES_ORDER = [
  "planning",
  "preferences",
  "content",
  "design",
  "validation",
];

const getLatestPhase = (completedPhasesSet) => {
  return (
    PHASES_ORDER.slice()
      .reverse()
      .find((phase) => completedPhasesSet.has(phase)) || null
  );
};

// Custom hook for media query
function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e) => setMatches(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

export default function PresentationAgentPage({ specificAgent }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { agentType, setAgentType } = useAgentContext();
  const isMobile = useMediaQuery("(max-width: 1023px)");

  const urlPresentationId =
    searchParams.get("id") || searchParams.get("presentation_id");

  const [currentPresentationId, setCurrentPresentationId] =
    useState(urlPresentationId);
  const [chatHistory, setChatHistory] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNavItem, setSelectedNavItem] = useState("chat");
  const [socket, setSocket] = useState(null);
  const [dataFetched, setDataFetched] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const chatEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [awaitingAck, setAwaitingAck] = useState(false);
  const ackTimeoutRef = useRef(null); // Flag for handling immediate polling bug. [Problem Statement: we try to immediately call slides, and logs api to get the data that cause the problem, before edit slide sends the response we try to get logs and slide. And because of this the status of logs and slide is still completed and causing issue.]

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileUrls, setFileUrls] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const presentationState = useSelector(selectPresentation);
  const {
    logs = [],
    slides = [],
    currentPhase = "planning",
    completedPhases = [],
    presentationBlueprint = null,
    status = "idle",
    totalSlides = 0,
  } = presentationState || {};


  useEffect(() => {

    const token = localStorage.getItem("accessToken");
    const socketInstance = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000",
      {
        auth: { token },
        forceNew: true,
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      },
    );

    socketInstance.on("connect", () => {
      setIsSocketConnected(true);

      // RECONNECTION LOGIC: If we have a presentation ID, rejoin the room
      if (currentPresentationId) {
        socketInstance.emit("joinPresentation", currentPresentationId);

        // If we don't have data or we're in a loading state, fetch current state
        if (!dataFetched || isLoading) {
          setIsLoading(true); // Starting the data polling again to start the streaming
          fetchPresentationData();
        }
      }
    });

    socketInstance.on("disconnect", () => {
      setIsSocketConnected(false);
    });

    socketInstance.on("error", (error) => {
      if (
        error.message === "Authentication failed" ||
        error.message === "Unauthorized presentation access"
      ) {
        router.push("/agents");
      }
    });

    socketInstance.on(
      "presentationUpdate",
      ({ presentationId, logs, slides, status }) => {
        if (presentationId === currentPresentationId) {
          // console.log(
          //   "[SOCKET] Updating presentation state for:",
          //   presentationId,
          //   logs,
          //   slides,
          //   status
          // );
            status,
            presentationId,
          // server is responding => allow polling now
          setAwaitingAck(false);
          dispatch(
            setPresentationState((prev) => ({
              ...prev,
              logs: logs ?? prev.logs,
              slides: slides ?? prev.slides,
              status: status ?? prev.status,
            })),
          );

          // dispatch(
          //   setPresentationState((prev) => ({
          //     logs: [
          //       ...prev.logs,
          //       ...logs.filter(
          //         (newLog) =>
          //           !prev.logs.some((existing) => existing.id === newLog.id)
          //       ),
          //     ],
          //     slides,
          //     status,
          //   }))
          // );
          if (status === "completed" || status === "failed") {
            setIsLoading(false);
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          }
        } else {
        }
      },
    );

    socketInstance.on("joinedPresentation", (data) => {
    });

    socketInstance.on("connect_error", (error) => {
      console.error("[SOCKET] Connection error:", error);
      setIsSocketConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      socketInstance.disconnect();

      // Clear Redux state on unmount
      dispatch(
        setPresentationState({
          logs: [],
          slides: [],
          status: "idle",
          currentPhase: "planning",
          completedPhases: [],
          presentationBlueprint: null,
          title: "Generating",
          totalSlides: 0,
        }),
      );

      if (ackTimeoutRef.current) clearTimeout(ackTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (urlPresentationId && urlPresentationId !== currentPresentationId) {

      dispatch(
        setPresentationState({
          logs: [],
          slides: [],
          status: "planning",
          currentPhase: "planning",
          completedPhases: [],
          presentationBlueprint: null,
          title: "Generating...",
          totalSlides: 0,
        }),
      );
      setChatHistory([]);
      setDataFetched(false);
      setIsLoading(true);

      if (socket && isSocketConnected && currentPresentationId) {
        socket.emit("leavePresentation", currentPresentationId);
      }

      setCurrentPresentationId(urlPresentationId);

      if (socket && isSocketConnected) {
        socket.emit("joinPresentation", urlPresentationId);
      }
    }
  }, [
    urlPresentationId,
    currentPresentationId,
    socket,
    isSocketConnected,
    dispatch,
  ]);

  useEffect(() => {
    if (specificAgent && specificAgent !== agentType) {
      setAgentType(specificAgent);
    }
  }, [specificAgent, agentType, setAgentType]);

  const currentAgentType = specificAgent || agentType;

  useEffect(() => {
    if (currentAgentType === "presentation") {
      setSelectedNavItem("slides");
    } else {
      setSelectedNavItem("chat");
    }
  }, [currentAgentType]);

  useEffect(() => {
    const initialPrompt = sessionStorage.getItem("initialPrompt");
    if (initialPrompt && chatHistory.length === 0) {
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        role: "user",
        message: initialPrompt,
        timestamp: new Date().toISOString(),
        isOptimistic: true,
      };
      // Add to local state immediately
      setOptimisticMessages((prev) => [...prev, optimisticMessage]);
      setIsLoading(true);
      sessionStorage.removeItem("initialPrompt");
    }
  }, [chatHistory.length]);

  useEffect(() => {
    if (currentPresentationId && !dataFetched) {
      fetchPresentationData();
    }
  }, [currentPresentationId, dataFetched]);

  useEffect(() => {
    // If the presentation is finished, ensure polling is stopped and loading is false.
    if (status === "completed" || status === "failed") {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (isLoading) {
        setIsLoading(false);
      }
      return;
    }

    // If there's no ID, stop polling.
    if (!currentPresentationId) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Start polling if we're loading OR status is processing
    // const shouldStartPolling = isLoading || status === "processing";

    // 

    const shouldStartPolling = !awaitingAck && status === "processing";

    if (shouldStartPolling) {
      // Prevent starting a new poller if one is already running
      if (pollingIntervalRef.current) return;


      pollingIntervalRef.current = setInterval(() => {
        fetchPresentationData();
      }, 3000);
    } else {
      // Stop polling if we're not loading and status is not processing
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [
    currentPresentationId,
    isLoading,
    status,
    awaitingAck,
    isSocketConnected,
  ]); //these dependencies shouldn't be changed frequently

  // (isLoading || status === "processing") && !isSocketConnected;
  // 

  const fetchPresentationData = async () => {
    if (!currentPresentationId) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL_WITH_PREFIX || "";
      const token = localStorage.getItem("accessToken");

      const headers = {
        "Content-Type": "application/json",
        "X-Presentation-ID": currentPresentationId,
        "Cache-Control": "no-cache",
        Authorization: `Bearer ${token}`,
      };

      const [logsResponse, slidesResponse] = await Promise.all([
        fetch(
          `${baseUrl}/presentation/logs/${currentPresentationId}?t=${Date.now()}`,
          {
            headers,
            cache: "no-cache",
          },
        ),
        fetch(
          `${baseUrl}/presentation/slides/${currentPresentationId}?t=${Date.now()}`,
          {
            headers,
            cache: "no-cache",
          },
        ),
      ]);

      if (logsResponse.ok || slidesResponse.ok) {
        const logsData = logsResponse.ok ? await logsResponse.json() : null;
        const slidesData = slidesResponse.ok
          ? await slidesResponse.json()
          : null;

        const currentUrlId =
          searchParams.get("id") || searchParams.get("presentation_id");
        if (currentPresentationId === currentUrlId) {
          // const newStatus =
          //   logsData?.status || slidesData?.status || presentationState.status;
          // let newStatus = presentationState.status;
          // if (presentationState.status !== "processing") {
          //   newStatus = logsData?.status || slidesData?.status || newStatus;
          // }

          // const apiStatus = logsData?.status || slidesData?.status;
          // const newStatus =
          //   presentationState.status === "processing"
          //     ? "processing"
          //     : apiStatus || presentationState.status;

          const apiStatus = logsData?.status || slidesData?.status;
          const prevLogsLen = presentationState.logs?.length ?? 0;
          const prevSlidesLen = presentationState.slides?.length ?? 0;
          const nextLogsLen = logsData?.data?.length ?? prevLogsLen;
          const nextSlidesLen = slidesData?.data?.length ?? prevSlidesLen;
          const hasNewData =
            nextLogsLen !== prevLogsLen || nextSlidesLen !== prevSlidesLen;

          let newStatus = presentationState.status;
          if (presentationState.status === "processing") {
            if (apiStatus === "failed") {
              newStatus = "failed";
            } else if (apiStatus === "completed" && !hasNewData) {
              // stale “completed” snapshot — keep waiting
              newStatus = "processing";
            } else {
              newStatus = apiStatus || "processing";
            }
          } else {
            newStatus = apiStatus || presentationState.status;
          }

          const combinedState = {
            logs: logsData?.data ?? presentationState.logs ?? [],
            slides: slidesData?.data ?? presentationState.slides ?? [],
            status: newStatus,
            title:
              slidesData?.title || logsData?.title || presentationState.title,
            totalSlides:
              slidesData?.total_slides ||
              logsData?.total_slides ||
              presentationState.totalSlides,
            currentPhase: logsData?.status || presentationState.currentPhase,
            completedPhases:
              logsData?.completedPhases || presentationState.completedPhases,
          };

          dispatch(setPresentationState(combinedState));

          // Stop loading and polling if completed or failed
          if (newStatus === "completed" || newStatus === "failed") {
            setIsLoading(false);
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          }
        }
      } else {
        // throw new Error("Failed to fetch presentation data");
      }

      setDataFetched(true);
    } catch (error) {
      console.error("Failed to fetch presentation data", error);
      setDataFetched(true);
      // Consider not redirecting immediately on a transient fetch error
      // router.push("/agents");
    }
  };

  const handleSend = async (promptText) => {
    const prompt = promptText || inputValue;
    if (!prompt.trim() || isLoading) return;

    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      message: prompt,
      timestamp: new Date().toISOString(),
      isOptimistic: true,
    };

    // setChatHistory([]);
    setChatHistory((prev) => [...prev, optimisticMessage]);
    // Add to local state immediately
    setOptimisticMessages((prev) => [...prev, optimisticMessage]);
    setInputValue("");

    setIsLoading(true);

    // Reset status to processing to ensure polling starts
    dispatch(
      setPresentationState({
        ...presentationState,
        status: "processing",
      }),
    );

    // block polling until the server has had a moment to flip state
    setAwaitingAck(true);
    if (ackTimeoutRef.current) clearTimeout(ackTimeoutRef.current);
    ackTimeoutRef.current = setTimeout(() => setAwaitingAck(false), 5000); // 5s fallback

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL_WITH_PREFIX || "";
      const token = localStorage.getItem("accessToken");

      const response = await fetch(
        `${baseUrl}/presentation/chat/message/${urlPresentationId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ user_query: prompt }),
        },
      );

      if (response.ok) {
        setAwaitingAck(false);
      }

      if (!response.ok) {
        // Handle different error status codes
        let errorMessage = "Failed to send message. Please try again.";

        if (response.status === 401) {
          errorMessage = "Session expired. Please log in again.";
        } else if (response.status === 403) {
          errorMessage =
            "You don't have permission to access this presentation.";
        } else if (response.status === 429) {
          errorMessage =
            "Too many requests. Please wait a moment and try again.";
        } else if (response.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        }

        // throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("[PresentationAgentPage] Failed to send message:", error);

      // Remove the optimistic message
      setOptimisticMessages((prev) =>
        prev.filter((msg) => msg.id !== optimisticMessage.id),
      );

      // Reset loading state
      setIsLoading(false);

      // Reset status back to previous state
      dispatch(
        setPresentationState({
          ...presentationState,
          status: status || "idle",
        }),
      );

      // Show error notification
      setSnackbar({
        open: true,
        message: error.message || "Failed to send message. Please try again.",
        severity: "error",
      });
    }
  };

  // Add this function to handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleApplyAutoFixes = () => {
  };

  const handleRegenerateWithFeedback = () => {
  };

  const handlePreviewOpen = () => setPreviewOpen(true);
  const handlePreviewClose = (open) => setPreviewOpen(open);

  // 

  useEffect(() => {
    if (status === "failed") {
      setSnackbar({
        open: true,
        message: "Presentation generation failed. Please try again.",
        severity: "error",
      });
    }
  }, [status]);

  // Auto-hide snackbar after 6 seconds
  useEffect(() => {
    if (snackbar.open) {
      const timer = setTimeout(() => {
        setSnackbar((prev) => ({ ...prev, open: false }));
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [snackbar.open]);

  if (!currentPresentationId) {
    return (
      <div className="bg-background text-foreground flex h-[100dvh] flex-col items-center justify-center">
        <h6 className="text-destructive mb-2 text-lg font-semibold">
          No presentation ID found. Please start a new presentation.
        </h6>
        <Button
          variant="default"
          onClick={() => router.push("/agents")}
          className="mt-2"
        >
          Go Back to Agents
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground flex h-[90dvh] flex-col overflow-hidden lg:h-[calc(100dvh-70px)]">
      {/* <div className="shrink-0">
        <AgentHeader
          currentAgentType={currentAgentType}
          onBackClick={() => router.push("/agents")}
        />
      </div> */}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {isMobile ? (
          // Mobile Layout
          <>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <ChatArea
                currentAgentType={currentAgentType}
                chatHistory={chatHistory}
                realLogs={logs}
                isLoading={isLoading}
                currentPhase={currentPhase}
                completedPhases={completedPhases}
                logsData={{ data: logs, status: currentPhase }}
                chatEndRef={chatEndRef}
                inputValue={inputValue}
                setInputValue={setInputValue}
                onSend={handleSend}
                status={status}
                presentationId={urlPresentationId}
                optimisticMessages={optimisticMessages}
                setUploadedFiles={setUploadedFiles}
                setFileUrls={setFileUrls}
                uploadedFiles={uploadedFiles}
                fileUrls={fileUrls}
                hideInputField={false}
                simulationCompleted={false}
                showModal={showModal}
                setShowModal={setShowModal}
                // these are for preview panel on mobile devices
                handlePreviewOpen={handlePreviewOpen}
                slides={slides}
              />
            </div>
            <Dialog open={previewOpen} onOpenChange={handlePreviewClose}>
              <DialogContent
                className="relative h-[80vh] max-h-[80vh] overflow-hidden p-0"
                showCloseButton={true}
              >
                <PreviewPanel
                  currentAgentType="presentation"
                  slidesData={{
                    data: slides,
                    status: status,
                    title: presentationState.title || "Generating...",
                    totalSlide: presentationState.totalSlides || 0,
                  }}
                  slidesLoading={isLoading}
                  presentationId={currentPresentationId}
                  currentPhase={currentPhase}
                  completedPhases={completedPhases}
                  presentationBlueprint={presentationBlueprint}
                  qualityMetrics={null}
                  validationResult={null}
                  isValidating={false}
                  onApplyAutoFixes={handleApplyAutoFixes}
                  onRegenerateWithFeedback={handleRegenerateWithFeedback}
                  title={presentationState.title || "Generating..."}
                  status={"completed"}
                />
              </DialogContent>
            </Dialog>
          </>
        ) : (
          // Desktop Layout
          <div className="grid min-h-0 grid-cols-1 grid-rows-1 overflow-hidden md:grid-cols-2">
            <div className="flex min-h-0 flex-col overflow-hidden">
              <ChatArea
                currentAgentType={currentAgentType}
                chatHistory={chatHistory}
                realLogs={logs}
                isLoading={isLoading}
                currentPhase={currentPhase}
                completedPhases={completedPhases}
                logsData={{ data: logs, status: currentPhase }}
                chatEndRef={chatEndRef}
                inputValue={inputValue}
                setInputValue={setInputValue}
                onSend={handleSend}
                status={status}
                presentationId={urlPresentationId}
                optimisticMessages={optimisticMessages}
                setUploadedFiles={setUploadedFiles}
                setFileUrls={setFileUrls}
                uploadedFiles={uploadedFiles}
                fileUrls={fileUrls}
                hideInputField={false}
                simulationCompleted={false}
                showModal={showModal}
                setShowModal={setShowModal}
              />
            </div>
            <div className="flex min-h-0 flex-col overflow-hidden">
              <PreviewPanel
                currentAgentType="presentation"
                slidesData={{
                  data: slides,
                  status: status,
                  title: presentationState.title || "Generating...",
                  totalSlide: presentationState.totalSlides || 0,
                }}
                slidesLoading={isLoading}
                presentationId={currentPresentationId}
                currentPhase={currentPhase}
                completedPhases={completedPhases}
                presentationBlueprint={presentationBlueprint}
                qualityMetrics={null}
                validationResult={null}
                isValidating={false}
                onApplyAutoFixes={handleApplyAutoFixes}
                onRegenerateWithFeedback={handleRegenerateWithFeedback}
                title={presentationState.title || "Generating..."}
                status={"completed"}
              />
            </div>
          </div>
        )}
      </div>

      {/* Snackbar replacement */}
      {snackbar.open && (
        <div className="fixed top-5 left-1/2 z-50 w-full max-w-md -translate-x-1/2 transform">
          <Alert
            variant={snackbar.severity === "error" ? "destructive" : "default"}
            className="bg-background w-full"
          >
            <AlertDescription className="flex items-center justify-between">
              <span>{snackbar.message}</span>
              <button
                onClick={handleSnackbarClose}
                className="text-muted-foreground hover:text-foreground focus:ring-ring ml-2 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:outline-none"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
