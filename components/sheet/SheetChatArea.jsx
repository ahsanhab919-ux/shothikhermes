import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/ui/useMobile";
import { cn } from "@/lib/utils";
import { useGetChatHistoryQuery } from "@/redux/api/sheet/sheetApi";
import {
  addSavePoint,
  selectActiveChatId,
  selectActiveStreamingChatId,
  selectSheet,
  setActiveChatId,
  setActiveStreamingChatId,
  setChatPolling,
  setSheetData,
  setSheetStatus,
  setSheetTitle,
} from "@/redux/slices/sheetSlice";
import { Loader2, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import removeMarkdown from "remove-markdown-and-html";
import TypingAnimation from "../common/TypingAnimation";
import InputArea from "../presentation/InputAreas";
import MetadataDisplay from "./MetaDataDisplay";
import { FooterCta } from "./SheetAgentPage";

// Updated MessageBubble component
const MessageBubble = ({
  message,
  isUser,
  timestamp,
  type = "info",
  metadata,
}) => {
  const displayMessage = !isUser ? removeMarkdown(message) : message;
  return (
    <div className={cn("mb-6 flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[80%]", !isUser && "max-w-[90%]")}>
        {isUser ? (
          // User message styling
          <>
            <div className="mb-2 flex items-center justify-end gap-2 opacity-70">
              <span className="text-muted-foreground text-[0.7rem]">
                {new Date(timestamp).toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "numeric",
                  hour12: true,
                })}
              </span>
              <span className="text-muted-foreground text-xs font-medium">
                You
              </span>
              <div className="bg-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
                <User className="text-primary-foreground h-3 w-3" />
              </div>
            </div>
            <div className="bg-primary text-primary-foreground max-w-full rounded-[18px] rounded-tr-[4px] px-4 py-3 wrap-break-word">
              <p className="text-[0.95rem] leading-normal">{displayMessage}</p>
            </div>
          </>
        ) : (
          // AI message styling
          <div>
            <div className="mb-3 flex items-center gap-2 opacity-70">
              <div className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold">
                AI
              </div>
              <span className="text-muted-foreground text-xs font-medium">
                Sheet AI
              </span>
              <span className="text-muted-foreground text-[0.7rem]">
                {new Date(timestamp).toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "numeric",
                  hour12: true,
                })}
              </span>
            </div>
            <div className="bg-background">
              <p className="text-foreground text-[0.95rem] leading-relaxed wrap-break-word whitespace-pre-wrap">
                {displayMessage}
              </p>
              {metadata && <MetadataDisplay metadata={metadata} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const getStepMessage = (step, data) => {
  // First check if the data object has a custom message
  if (data?.message) {
    return data.message;
  }

  // Fallback to predefined messages for known steps
  const stepMessages = {
    context_analysis: "Analyzing conversation context...",
    validation: "Validating your request...",
    database_create: "Creating conversation record...",
    llm_processing: "Processing with AI model...",
    formatting: "Formatting the response...",
    memory_storage: "Storing conversation in memory...",
    database_update: "Updating conversation with response...",
    followup_analysis: "Analyzing follow-up intent...",
    followup_decision: "Determining response strategy...",
    validation_error:
      data?.error?.message ||
      "Your requested prompt is not contextual enough. Please try again with more details.",
  };

  return stepMessages[step] || `Processing step: ${step}...`;
};

// Main SheetChatArea component
export default function SheetChatArea({
  currentAgentType,
  // these are for preview panel on mobile devices
  handlePreviewOpen,
}) {
  const dispatch = useDispatch();
  const activeChatId = useSelector(selectActiveChatId);
  const activeStreamingChatId = useSelector(selectActiveStreamingChatId);
  const sheetState = useSelector(selectSheet);
  const { accessToken: sheetAiToken } = useSelector((state) => state.auth); // Naming it for better understanding, sheet service uses accesstoken
  const searchParams = useSearchParams();
  const currentChatId = searchParams.get("id");
  const router = useRouter();

  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  // const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [shouldPoll, setShouldPoll] = useState(false);
  const [toastState, setToastState] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const isMobile = useIsMobile();

  const [showModal, setShowModal] = useState(false);
  const [simulationCompleted, setSimulationCompleted] = useState(false);
  const [showNewChatWarning, setShowNewChatWarning] = useState(false);
  const s_id = searchParams.get("s_id"); // simulation id

  // Determine the actual chat ID to use
  const actualChatId = s_id || currentChatId;
  const isSimulationMode = Boolean(s_id);

  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);
  const initialPromptProcessedRef = useRef(false);
  const initializationAttemptedRef = useRef(false);
  const streamOwnerChatIdRef = useRef(null); // Track which chat owns the active stream
  const isNavigationAbortRef = useRef(false); // Distinguish navigation abort from user stop

  // Track active chat in Redux for scoped state
  useEffect(() => {
    if (actualChatId) {
      dispatch(setActiveChatId(actualChatId));
    }
    return () => {
      if (activeChatId === actualChatId) {
        dispatch(setActiveChatId(null));
      }
      dispatch(setChatPolling({ chatId: actualChatId, isPolling: false }));
    };
  }, [actualChatId]);

  // CRITICAL: Abort SSE stream and clear messages when navigating to a different chat
  useEffect(() => {
    // Clear messages when chat changes (fresh start for each chat)
    setMessages([]);
    setIsLoading(false);
    setError(null);
    initialPromptProcessedRef.current = false;
    initializationAttemptedRef.current = false;

    return () => {
      // Abort any running SSE stream when leaving this chat
      if (abortControllerRef.current) {
        isNavigationAbortRef.current = true; // Mark as navigation abort BEFORE aborting
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      streamOwnerChatIdRef.current = null;
      // NOTE: We do NOT clear activeStreamingChatId here - backend is still processing
      // When user returns, polling will resume if chat history shows incomplete
    };
  }, [actualChatId]);

  // RTK Query hook with conditional polling STARTS
  const {
    data: chatData,
    isLoading: isLoadingHistory,
    isError,
    error: historyError,
    refetch,
  } = useGetChatHistoryQuery(currentChatId, {
    skip: !currentChatId || (!sheetAiToken && !isSimulationMode), // when we have s_id -> simulation Id we don't need this query.
    pollingInterval: shouldPoll && activeChatId === actualChatId ? 3000 : 0,
    refetchOnMountOrArgChange: true,
  });

  const hasAnyConversation = Boolean(chatData?.conversations?.length);


  // Effect to control polling based on data completeness
  // Only poll if THIS chat has an active stream - don't auto-poll just because history looks incomplete
  useEffect(() => {
    if (!chatData) return; // no data yet
    if (!hasAnyConversation) return; // <— bail out on the default-empty payload

    // Only start polling if this chat initiated a stream in this session
    if (chatData?.isIncomplete) {
      dispatch(setChatPolling({ chatId: actualChatId, isPolling: true }));
      setShouldPoll(true);
    } else {
      dispatch(setChatPolling({ chatId: actualChatId, isPolling: false }));
      setShouldPoll(false);
    }
  }, [
    chatData?.isIncomplete,
    isLoadingHistory,
    actualChatId,
    activeStreamingChatId,
    hasAnyConversation,
    dispatch,
  ]);

  // Cleanup effect when component unmounts or chat changes:
  // Don't reset status if this chat has an active stream - let SSE completion handle it
  useEffect(() => {
    return () => {
      dispatch(setChatPolling({ chatId: actualChatId, isPolling: false }));
      // Only reset to idle if this chat doesn't have an active stream
      // Let the SSE completion handler set the final status for streaming chats
    };
  }, [actualChatId, dispatch]);
  // RTK Query hook with conditional polling ENDS

  // Initialization and other useEffect hooks remain unchanged
  useEffect(() => {
    const initializeComponent = async () => {
      if (initializationAttemptedRef.current) return;
      initializationAttemptedRef.current = true;

      // For simulation mode, no token required - initialize directly
      if (isSimulationMode) {
        setIsInitialized(true);
        dispatch(
          setSheetStatus({ chatId: actualChatId, status: "generating" }),
        );
        return;
      }

      try {
        if (!sheetAiToken) {
          router.push("/");
          toast.error("Please log in to use this service.");
        }
        setIsInitialized(true);
        dispatch(setSheetStatus({ chatId: actualChatId, status: "idle" }));
      } catch (error) {
        console.error("Initialization error:", error);
        setError(error.message);
        setIsInitialized(false);
      }
    };
    initializeComponent();
  }, [dispatch, currentChatId, actualChatId, isSimulationMode, sheetAiToken]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const processInitialPrompt = async () => {
      if (
        !isInitialized ||
        isLoading ||
        initialPromptProcessedRef.current ||
        !sheetAiToken ||
        isSimulationMode
      ) {
        return;
      }
      const initialPrompt = sessionStorage.getItem("initialSheetPrompt");
      if (initialPrompt && initialPrompt.trim()) {
        initialPromptProcessedRef.current = true;
        try {
          await handleMessage(initialPrompt);
        } catch (error) {
          console.error("Failed to process initial prompt:", error);
          initialPromptProcessedRef.current = false;
          setError("Failed to process initial request. Please try again.");
        } finally {
          sessionStorage.removeItem("initialSheetPrompt");
        }
      }
    };
    processInitialPrompt();
  }, [isInitialized, sheetAiToken, isSimulationMode]);

  // Handle chat history data changes
  useEffect(() => {
    // if(isLoading) return;
    if (!chatData) return; // nothing loaded yet
    if (!hasAnyConversation) return; // <— skip the "empty payload"

    const {
      conversations,
      shouldSetGenerating,
      recommendedStatus,
      lastConversation,
    } = chatData;

    const convertedMessages = [];

    // Only update status from history if this chat doesn't have an active stream
    // Let SSE handle status for actively streaming chats
    const hasActiveStream = activeStreamingChatId === actualChatId;

    if (!hasActiveStream) {
      const hasRows = Boolean(lastConversation?.response?.rows?.length);
      const safeStatus =
        recommendedStatus === "generating"
          ? hasRows
            ? "completed"
            : "idle"
          : recommendedStatus;
      dispatch(
        setSheetStatus({
          chatId: actualChatId,
          status: safeStatus,
        }),
      );
    }

    // if (chatData.isIncomplete) {
    //   dispatch(setSheetStatus("generating"));
    // } else if (recommendedStatus === "completed") {
    //   dispatch(setSheetStatus("completed"));
    // } else if (recommendedStatus === "error") {
    //   dispatch(setSheetStatus("error"));
    // } else if (recommendedStatus === "cancelled") {
    //   dispatch(setSheetStatus("cancelled"));
    // }

    // Set Redux status based on API analysis
    // dispatch(setSheetStatus(recommendedStatus));

    // Add reconnection message if needed
    if (shouldSetGenerating) {
      const hasReconnectMessage = messages.some((msg) =>
        msg.id.includes("reconnecting"),
      );
      // Uncomment if you want reconnection message
      // if (!hasReconnectMessage) {
      //   convertedMessages.push({
      //     id: `reconnecting-${Date.now()}`,
      //     message: "Reconnecting to generation in progress...",
      //     isUser: false,
      //     timestamp: new Date().toISOString(),
      //     type: "info",
      //   });
      // }
    }

    // Create save points structure
    const savePoints = conversations.map((item) => ({
      id: `savepoint-${item._id}`,
      title: item.prompt.substring(0, 50) + "..." || "",
      prompt: item.prompt,
      timestamp: item.createdAt,
      generations: [
        {
          id: `gen-${item._id}`,
          title: "Generation 1",
          timestamp: item.updatedAt || item.createdAt,
          sheetData: item.response?.rows || null,
          status: item.response?.rows
            ? "completed"
            : shouldSetGenerating && item._id === lastConversation.id
              ? "generating"
              : "error",
          message: item.response?.rows
            ? "Sheet generated successfully"
            : shouldSetGenerating && item._id === lastConversation.id
              ? "Resuming generation..."
              : "No data generated",
          metadata: item.response?.metadata,
        },
      ],
      activeGenerationId: `gen-${item._id}`,
    }));

    // Dispatch to Redux
    dispatch({
      type: "sheet/initializeSavePoints",
      payload: {
        savePoints,
        activeSavePointId:
          savePoints.length > 0 ? savePoints[savePoints.length - 1].id : null,
      },
    });

    // Convert to messages
    conversations.forEach((item) => {
      convertedMessages.push({
        id: `user-${item._id}`,
        message: item.prompt,
        isUser: true,
        timestamp: item.createdAt,
      });

      if (item.events) {
        item.events.forEach((stepEvent) => {
          convertedMessages.push({
            id: `ai-${stepEvent._id}`,
            message: stepEvent.message,
            timestamp: stepEvent.timestamp,
            isUser: false,
          });
        });
      }

      // Set sheet data and title for completed conversations
      if (item.response?.rows && recommendedStatus === "completed") {
        dispatch(
          setSheetData({ chatId: actualChatId, sheet: item.response.rows }),
        );
        dispatch(
          setSheetTitle({
            chatId: actualChatId,
            title: item.prompt.substring(0, 50) + "..." || "",
          }),
        );
      }
    });

    // setMessages(convertedMessages);

    setMessages((prevMessages) => {
      const userMessageIds = new Set(convertedMessages.map((m) => m.id));
      const preservedMessages = prevMessages.filter(
        (m) => !userMessageIds.has(m.id),
      );
      return [...preservedMessages, ...convertedMessages];
    });

    // for simulation only
    if (s_id) {
      setSimulationCompleted(true);
    }
  }, [chatData, dispatch]);

  // Handle completion detection
  // useEffect(() => {
  //   if (!chatData?.isIncomplete && sheetState.status === "generating") {
  //     // Generation completed, add success message
  //     const lastConversation =
  //       chatData?.conversations?.[chatData.conversations.length - 1];
  //     if (lastConversation?.response?.rows) {
  //       setMessages((prev) => [
  //         ...prev,
  //         {
  //           id: `completed-${Date.now()}`,
  //           message: "Sheet generation completed successfully!",
  //           isUser: false,
  //           timestamp: new Date().toISOString(),
  //           type: "success",
  //         },
  //       ]);
  //     }
  //   }
  // }, [chatData?.isIncomplete, sheetState.status]);

  // const loadChatHistory = async (chatId, token) => {
  //   if (!chatId || isLoadingHistory) return;
  //   setIsLoadingHistory(true);
  //   dispatch(setSheetStatus("generating"));
  //   dispatch(setSheetData(null));
  //   try {
  //     const response = await fetch(
  //       `https://sheetai.pixigenai.com/api/conversation/get_chat_conversations/${chatId}`,
  //       {
  //         method: "GET",
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );
  //     if (!response.ok) {
  //       throw new Error(`Failed to load chat history: ${response.status}`);
  //     }
  //     const historyData = await response.json();
  //     const convertedMessages = [];

  //     // Create save points structure
  //     const savePoints = historyData.map((item, index) => ({
  //       id: `savepoint-${item._id}`,
  //       title: item.prompt.substring(0, 50) + "...",
  //       prompt: item.prompt,
  //       timestamp: item.createdAt,
  //       generations: [
  //         {
  //           id: `gen-${item._id}`,
  //           title: "Generation 1",
  //           timestamp: item.updatedAt || item.createdAt,
  //           sheetData: item.response?.rows || null,
  //           status: item.response?.rows ? "completed" : "error",
  //           message: item.response?.rows
  //             ? "Sheet generated successfully"
  //             : "No data generated",
  //           metadata: item.response?.metadata,
  //         },
  //       ],
  //       activeGenerationId: `gen-${item._id}`,
  //     }));

  //     // Dispatch to Redux to initialize save points
  //     dispatch({
  //       type: "sheet/initializeSavePoints",
  //       payload: {
  //         savePoints,
  //         activeSavePointId:
  //           savePoints.length > 0 ? savePoints[savePoints.length - 1].id : null,
  //       },
  //     });

  //     historyData.forEach((item) => {
  //       convertedMessages.push({
  //         id: `user-${item._id}`,
  //         message: item.prompt,
  //         isUser: true,
  //         timestamp: item.createdAt,
  //       });
  //       if (item.events) {
  //         item.events?.map((stepEvent) => {
  //           convertedMessages.push({
  //             id: `ai-${stepEvent._id}`,
  //             message: stepEvent.message,
  //             timestamp: stepEvent.timestamp,
  //             isUser: false,
  //           });
  //         });
  //       }

  //       if (item.response) {
  //         if (item.response.rows && item.response.columns) {
  //           // metadata = item.response.metadata;
  //           dispatch(setSheetData(item.response.rows));
  //           dispatch(setSheetTitle(item.prompt.substring(0, 50) + "..."));
  //           dispatch(setSheetStatus("completed"));
  //         }
  //       }
  //     });
  //     setChatHistory(convertedMessages);
  //     setMessages(convertedMessages);
  //   } catch (error) {
  //     console.error("Failed to load chat history:", error);
  //   } finally {
  //     setIsLoadingHistory(false);
  //   }
  // };

  const handleSimulationGeneration = async (simulationChatId) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_SHEET_REDIRECT_PREFIX}/conversation/simulate_conversation`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          chat: simulationChatId, // This will be the s_id from URL
        }),
        signal: abortControllerRef.current.signal,
      },
    );
    return response;
  };

  const handleUserSheetGeneration = async (prompt, chatId, token) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_SHEET_REDIRECT_PREFIX}/conversation/create_conversation`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          prompt: prompt,
          chat: chatId,
        }),
        signal: abortControllerRef.current.signal,
      },
    );
    return response;
  };

  const handleMessage = async (messageText = inputValue) => {
    if (
      !messageText.trim() ||
      isLoading ||
      (!isSimulationMode && !sheetAiToken)
    ) {
      return;
    }

    setError(null);
    setIsLoading(true);
    streamOwnerChatIdRef.current = actualChatId; // Track which chat owns this stream
    isNavigationAbortRef.current = false; // Reset navigation abort flag for new stream
    dispatch(setSheetStatus({ chatId: actualChatId, status: "generating" }));
    dispatch(setActiveStreamingChatId(actualChatId)); // Mark this chat as actively streaming
    sessionStorage.setItem("activeChatId", actualChatId);
    dispatch(setChatPolling({ chatId: actualChatId, isPolling: true }));

    // Create user message with a predictable ID
    const userMessageId = `user-${Date.now()}`;
    const userMessage = {
      id: userMessageId,
      message: messageText,
      isUser: true,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    try {
      await handleSheetGeneration(messageText, actualChatId, userMessageId);
    } catch (error) {
      console.error("Failed to process message:", error);
      const errorMessage =
        error.message || "Failed to generate sheet. Please try again.";
      setError(errorMessage);
      dispatch(setSheetStatus({ chatId: actualChatId, status: "error" }));
      dispatch(setActiveStreamingChatId(null)); // Clear streaming flag on error

      // Remove the user message that failed to process
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessageId));

      // Show toast notification
      setToastState({
        open: true,
        message: "Failed to generate sheet. Please try again.",
        severity: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // THIS PART IS ONLY FOR SIMULATION STARTS
  useEffect(() => {
    const runSimulation = async () => {
      // Only run simulation if we have s_id and component is properly initialized
      if (!isSimulationMode || !isInitialized || isLoading) {
        return;
      }

      // Check if simulation has already been processed
      // const simulationKey = `simulation-processed-${s_id}`;
      // if (sessionStorage.getItem(simulationKey)) {
      //   
      //   return;
      // }

      // Mark simulation as being processed
      // sessionStorage.setItem(simulationKey, "true");

      try {
        // Set loading state
        setError(null);
        setIsLoading(true);
        streamOwnerChatIdRef.current = actualChatId; // Track which chat owns this stream
        isNavigationAbortRef.current = false; // Reset navigation abort flag for new stream
        dispatch(
          setSheetStatus({ chatId: actualChatId, status: "generating" }),
        );
        dispatch(setActiveStreamingChatId(actualChatId)); // Mark as streaming
        dispatch(setChatPolling({ chatId: actualChatId, isPolling: true }));

        // const prompt = dev_mode ? getSimulationPromptDev(actualChatId) : getSimulationPromptProd(actualChatId);
        const prompt = getSimulationPrompt(actualChatId);

        // Create user message for simulation
        const userMessage = {
          id: `user-simulation-${s_id}-${Date.now()}`,
          message: prompt,
          isUser: true,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);

        // Run the sheet generation
        await handleSheetGeneration(prompt, actualChatId, userMessage.id);
      } catch (error) {
        console.error("Simulation failed:", error);
        setError("Simulation failed to run. Please try again.");
        dispatch(setSheetStatus({ chatId: actualChatId, status: "error" }));
        dispatch(setActiveStreamingChatId(null)); // Clear streaming flag on error
      } finally {
        setIsLoading(false);
      }
    };

    runSimulation();
  }, [isSimulationMode, isInitialized, actualChatId, dispatch, isLoading]);

  const getSimulationPrompt = (simulationId) => {
    const simulationPrompts = {
      "68c92076dc985a1ee342aa72":
        "Compare pricing of top 10 gyms of the world in a sheet",
      "68c9237adc985a1ee342aa75": "List top 5 Italian restaurants with ratings",
      "68c926eedc985a1ee342aa77": "Generate 10 school and contact notes",
    };

    return simulationPrompts[simulationId] || null;
  };

  // THIS PART IS ONLY FOR SIMULATION ENDS

  // Updated handleSheetGeneration to show each SSE step
  const handleSheetGeneration = async (prompt, chatId, userMessageId) => {
    try {
      abortControllerRef.current = new AbortController();
      const response = isSimulationMode
        ? await handleSimulationGeneration(actualChatId) // Using s_id for simulation
        : await handleUserSheetGeneration(prompt, actualChatId, sheetAiToken); // Using id for user specific prompt

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText}`);
      }

      // 

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      // 
      let buffer = "";
      let hasReceivedData = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        hasReceivedData = true;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);


            // Check for validation error first
            if (data?.data?.error) {

              // Remove the user message that couldn't be processed
              setMessages((prev) =>
                prev.filter((msg) => msg.id !== userMessageId),
              );

              // Show meaningful toast notification
              setToastState({
                open: true,
                message:
                  data.data.error.message ||
                  "Your request couldn't be processed. Please provide more specific details.",
                severity: "warning",
              });

              setIsLoading(false);
              dispatch(
                setSheetStatus({ chatId: actualChatId, status: "completed" }),
              );
              dispatch(setActiveStreamingChatId(null)); // Clear streaming flag
              dispatch(
                setChatPolling({ chatId: actualChatId, isPolling: false }),
              );
              setShouldPoll(false);
              reader.cancel();
              return;
            }

            // Handle step-based messages (excluding validation_error since we handle it above)
            if (
              data.step &&
              data.step !== "completed" &&
              data.step !== "validation_error"
            ) {

              const stepMessage = getStepMessage(data.step, data.data);
              if (stepMessage) {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `step-${data.step}-${Date.now()}`,
                    message: stepMessage,
                    isUser: false,
                    timestamp: data.timestamp,
                    type: "info",
                  },
                ]);
              }
            }

            // Handle completion step. [FOR PRODUCTION]
            // else if (data.step === "completed") {
            //   const responseData = data?.data?.data;
            //   

            //   const stepMessage = getStepMessage(data.step, data.data);
            //   if (stepMessage) {
            //     setMessages((prev) => [
            //       ...prev,
            //       {
            //         id: `step-${data.step}-${Date.now()}`,
            //         message: stepMessage,
            //         isUser: false,
            //         timestamp: data.timestamp,
            //         type: "info",
            //       },
            //     ]);
            //   }

            //   if (
            //     responseData?.response?.columns &&
            //     responseData?.response?.rows
            //   ) {
            //     // Update Redux store with sheet data
            //     dispatch(setSheetData(responseData.response.rows));
            //     dispatch(
            //       setSheetTitle(responseData.prompt.substring(0, 50) + "...")
            //     );
            //     dispatch(setSheetStatus("completed"));

            //     // Show success toast
            //     setToast({
            //       open: true,
            //       message: "Spreadsheet generated successfully!",
            //       severity: "success",
            //     });

            //     const newSavePoint = {
            //       id: `savepoint-${responseData._id}`,
            //       title: responseData.prompt.substring(0, 50) + "...",
            //       prompt: responseData.prompt,
            //       timestamp: responseData.createdAt,
            //       generations: [
            //         {
            //           id: `gen-${responseData._id}`,
            //           title: "Generation 1",
            //           timestamp:
            //             responseData.updatedAt || responseData.createdAt,
            //           sheetData: responseData.response.rows,
            //           status: "completed",
            //           message: "Sheet generated successfully",
            //           metadata: responseData.response.metadata,
            //         },
            //       ],
            //       activeGenerationId: `gen-${responseData._id}`,
            //     };

            //     dispatch({
            //       type: "sheet/addSavePoint",
            //       payload: newSavePoint,
            //     });
            //   }
            // }

            // FOR SIMULATION
            else if (data.step === "completed") {
              // First completed step - just has message
              if (
                data.data?.message &&
                !data.data?.columns &&
                !data.data?.rows
              ) {
                const stepMessage = data.data.message;
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `step-${data.step}-message-${Date.now()}`,
                    message: stepMessage,
                    isUser: false,
                    timestamp: data.timestamp,
                    type: "info",
                  },
                ]);
              } else if (
                data.data?.columns.length > 0 &&
                data.data?.rows.length > 0
              ) {
                // Update Redux store with sheet data
                dispatch(
                  setSheetData({
                    chatId: actualChatId,
                    sheet: data.data?.rows,
                  }),
                );
                dispatch(
                  setSheetTitle({
                    chatId: actualChatId,
                    title: prompt.substring(0, 50) + "..." || "",
                  }),
                );
                dispatch(
                  setSheetStatus({ chatId: actualChatId, status: "completed" }),
                );
                dispatch(setActiveStreamingChatId(null)); // Clear streaming flag on success

                // Show success toast
                setToastState({
                  open: true,
                  message: "Spreadsheet generated successfully!",
                  severity: "success",
                });

                // Create save point with the actual conversation data
                const conversationId = data.conversation;
                const chatId = data.chat;

                const newSavePoint = {
                  id: `savepoint-${conversationId}`,
                  title: prompt.substring(0, 50) + "..." || "",
                  prompt: prompt,
                  timestamp:
                    data?.updatedAt ||
                    data.timestamp ||
                    new Date().toISOString(),
                  generations: [
                    {
                      id: `gen-${conversationId}`,
                      title: "Generation 1",
                      timestamp:
                        data?.updatedAt ||
                        data.timestamp ||
                        new Date().toISOString(),
                      sheetData: data.response?.rows,
                      status: "completed",
                      message: "Sheet generated successfully",
                      metadata: data.response?.metadata,
                    },
                  ],
                  activeGenerationId: `gen-${conversationId}`,
                };

                dispatch(
                  addSavePoint({
                    chatId: actualChatId,
                    savePoint: newSavePoint,
                  }),
                );

                // Add final success message
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `final-success-${Date.now()}`,
                    message: `Successfully generated a ${
                      data.response?.metadata?.totalRows || "spreadsheet"
                    } with ${
                      data.response?.metadata?.columnCount ||
                      data.response?.columns?.length ||
                      "multiple"
                    } columns!`,
                    isUser: false,
                    timestamp:
                      data?.updatedAt ||
                      data.timestamp ||
                      new Date().toISOString(),
                    type: "success",
                    metadata: data.response?.metadata,
                  },
                ]);

                // for simulation only
                if (s_id) {
                  setSimulationCompleted(true);
                }
              }
            }
            // Lastly step - has the actual data || New update simulation doesn't sending data separately
            else if (!data.step) {

              // Update Redux store with sheet data
              dispatch(
                setSheetData({
                  chatId: actualChatId,
                  sheet: data.response?.rows,
                }),
              );
              dispatch(
                setSheetTitle({
                  chatId: actualChatId,
                  title: prompt.substring(0, 50) + "..." || "",
                }),
              );
              dispatch(
                setSheetStatus({ chatId: actualChatId, status: "completed" }),
              );
              dispatch(setActiveStreamingChatId(null)); // Clear streaming flag on success

              // Show success toast
              setToastState({
                open: true,
                message: "Spreadsheet generated successfully!",
                severity: "success",
              });

              // Create save point with the actual conversation data
              const conversationId = data.conversation;
              const chatId = data.chat;

              const newSavePoint = {
                id: `savepoint-${conversationId}`,
                title: prompt.substring(0, 50) + "..." || "",
                prompt: prompt,
                timestamp:
                  data?.updatedAt || data.timestamp || new Date().toISOString(),
                generations: [
                  {
                    id: `gen-${conversationId}`,
                    title: "Generation 1",
                    timestamp:
                      data?.updatedAt ||
                      data.timestamp ||
                      new Date().toISOString(),
                    sheetData: data.response?.rows,
                    status: "completed",
                    message: "Sheet generated successfully",
                    metadata: data.response?.metadata,
                  },
                ],
                activeGenerationId: `gen-${conversationId}`,
              };

              dispatch(
                addSavePoint({ chatId: actualChatId, savePoint: newSavePoint }),
              );

              // Add final success message
              setMessages((prev) => [
                ...prev,
                {
                  id: `final-success-${Date.now()}`,
                  message: `Successfully generated a ${
                    data.response?.metadata?.totalRows || "spreadsheet"
                  } with ${
                    data.response?.metadata?.columnCount ||
                    data.response?.columns?.length ||
                    "multiple"
                  } columns!`,
                  isUser: false,
                  timestamp:
                    data?.updatedAt ||
                    data.timestamp ||
                    new Date().toISOString(),
                  type: "success",
                  metadata: data.response?.metadata,
                },
              ]);

              // for simulation only
              if (s_id) {
                setSimulationCompleted(true);
              }
            }
          } catch (error) {
            console.error("Error parsing SSE data:", error, "Line:", line);
          }
        }
      }

      if (!hasReceivedData) {
        throw new Error("No data received from server");
      }
    } catch (error) {
      console.error("Sheet generation error:", error);

      if (error.name === "AbortError") {
        // Check if this was a navigation abort (user left the chat but backend is still processing)
        if (isNavigationAbortRef.current) {
          isNavigationAbortRef.current = false; // Reset flag
          // DON'T clear activeStreamingChatId - backend is still processing
          // When user returns, polling will check history and resume if incomplete
          return;
        }

        // User explicitly clicked "Stop" - treat as cancellation
        dispatch(setSheetStatus({ chatId: actualChatId, status: "cancelled" }));
        dispatch(setActiveStreamingChatId(null)); // Clear streaming flag
        setMessages((prev) => [
          ...prev,
          {
            id: `cancelled-${Date.now()}`,
            message: "Generation was cancelled.",
            isUser: false,
            timestamp: new Date().toISOString(),
            type: "info",
          },
        ]);
        return;
      }

      // Handle different types of errors gracefully
      let errorMessage =
        "Something went wrong while generating your spreadsheet.";
      let errorType = "error";

      // Network errors
      if (
        error.message.includes("fetch") ||
        error.message.includes("Failed to fetch")
      ) {
        errorMessage =
          "Connection lost. Please check your internet and try again.";
        errorType = "warning";
      }
      // Server errors
      else if (error.message.includes("Server error")) {
        errorMessage =
          "Server is temporarily unavailable. Please try again in a moment.";
        errorType = "warning";
      }
      // Timeout errors
      else if (error.message.includes("timeout")) {
        errorMessage = "Request timed out. Please try with a simpler request.";
        errorType = "warning";
      }
      // Parsing errors
      else if (
        error.message.includes("JSON") ||
        error.message.includes("parsing")
      ) {
        errorMessage =
          "Received invalid response from server. Please try again.";
        errorType = "error";
      }
      // Custom error messages from server
      else if (error.message) {
        errorMessage = error.message;
      }

      // Update Redux state
      dispatch(setSheetStatus({ chatId: actualChatId, status: "error" }));
      dispatch(setActiveStreamingChatId(null)); // Clear streaming flag on error
      dispatch(setChatPolling({ chatId: actualChatId, isPolling: false }));
      setShouldPoll(false);

      // Remove the failed user message
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessageId));

      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          message: errorMessage,
          isUser: false,
          timestamp: new Date().toISOString(),
          type: errorType,
        },
      ]);

      // Show toast notification
      setToastState({
        open: true,
        message: errorMessage,
        severity: errorType,
      });

      // Set component error state for additional UI feedback
      setError(errorMessage);
    } finally {
      abortControllerRef.current = null;
      streamOwnerChatIdRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      isNavigationAbortRef.current = false; // Ensure this is treated as user stop, not navigation
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      streamOwnerChatIdRef.current = null;
      setIsLoading(false);
      dispatch(setSheetStatus({ chatId: actualChatId, status: "cancelled" }));
      dispatch(setActiveStreamingChatId(null)); // Clear streaming flag
      setMessages((prev) => [
        ...prev,
        {
          id: `cancelled-${Date.now()}`,
          message: "Generation cancelled by user.",
          isUser: false,
          timestamp: new Date().toISOString(),
          type: "info",
        },
      ]);
    }
  };

  const clearError = () => {
    setError(null);
    dispatch(setSheetStatus({ chatId: actualChatId, status: "completed" }));
  };

  // Handle new chat creation - redirect to agents page
  const handleNewChat = () => {

    // Abort any running stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    streamOwnerChatIdRef.current = null;

    // Clear all current state
    setMessages([]);
    setError(null);
    setShowNewChatWarning(false);

    // Reset Redux state
    dispatch(setSheetData({ chatId: actualChatId, sheet: null }));
    dispatch(setSheetStatus({ chatId: actualChatId, status: "idle" }));
    dispatch(
      setSheetTitle({ chatId: actualChatId, title: "Ready to Generate" }),
    );
    dispatch(setActiveStreamingChatId(null)); // Clear any active streaming
    dispatch(setChatPolling({ chatId: actualChatId, isPolling: false }));

    // Clear session storage
    sessionStorage.removeItem("activeChatId");
    sessionStorage.removeItem("initialSheetPrompt");

    // Show success message first
    toast.success("Redirecting to AI Sheets for a fresh start!");

    // Navigate to agents page with AI Sheets tab selected
    try {
      router.push("/agents?tab=sheets");
    } catch (error) {
      window.location.href = "/agents?tab=sheets";
    }
  };

  useEffect(() => {
    if (toastState.open) {
      const timer = setTimeout(() => {
        setToastState({ ...toastState, open: false });
      }, 6000); // Hide after 6 seconds

      return () => clearTimeout(timer);
    }
  }, [toastState.open]);

  if (!isInitialized && error && !isSimulationMode) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            <div className="mt-2">
              <span className="text-muted-foreground text-xs">
                Make sure you are logged in.
              </span>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isInitialized || isLoadingHistory) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="text-primary mx-auto mb-4 h-6 w-6 animate-spin" />
        <p className="text-muted-foreground text-sm">
          {isLoadingHistory
            ? "Loading chat history..."
            : isSimulationMode
              ? "Initializing Simulation..."
              : "Initializing Sheet AI..."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="border-border bg-background relative flex h-full flex-col overflow-hidden border-r">
        {error && (
          <div className="p-4">
            <Alert variant="destructive" className="relative">
              <AlertDescription>
                {error}
                <button
                  onClick={clearError}
                  className="text-muted-foreground hover:text-foreground absolute top-2 right-2"
                  aria-label="Close"
                >
                  ×
                </button>
              </AlertDescription>
            </Alert>
          </div>
        )}
        <div className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent min-h-0 flex-1 overflow-y-auto scroll-smooth">
          <div className="relative pt-20 pr-6 pb-6 pl-20">
            {messages.length === 0 && !isLoadingHistory ? (
              <div className="mt-8 text-center">
                <h2 className="text-muted-foreground mb-2 text-xl font-semibold">
                  Welcome to Sheet Generator
                </h2>
                <p className="text-muted-foreground text-sm">
                  Describe what kind of spreadsheet you&apos;d like to create.
                </p>
                <span className="text-muted-foreground mt-2 block text-xs">
                  Example: &quot;Create a budget tracker for personal
                  expenses&quot; or &quot;Generate a student grade sheet&quot;
                </span>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message.message}
                    isUser={message.isUser}
                    timestamp={message.timestamp}
                    type={message.type}
                    metadata={message.metadata}
                  />
                ))}
                {(isLoading ||
                  sheetState.status === "generating" ||
                  chatData?.isIncomplete) && (
                  <TypingAnimation
                    text={
                      chatData?.isIncomplete
                        ? "Generating"
                        : isLoading || sheetState.status === "generating"
                          ? "Generating"
                          : "Process failed"
                    }
                  />
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        {/* for simulation only */}
        {isSimulationMode && <div className="pt-5"></div>}

        <div className="flex w-full flex-col items-center justify-center">
          {isMobile && (
            <div
              className="border-border bg-accent flex w-full cursor-pointer items-start gap-2 border p-4"
              onClick={handlePreviewOpen}
            >
              <CustomTableChartIcon className="text-primary text-[40px]" />
              <div>
                <h3 className="ml-1 text-lg font-semibold">
                  Preview Sheet Data
                </h3>
                <p className="text-muted-foreground ml-1 text-sm">
                  Click to open
                </p>
              </div>
            </div>
          )}
          {!isSimulationMode && (
            <div className="border-border bg-background w-full shrink-0 border-t">
              <InputArea
                currentAgentType={currentAgentType}
                inputValue={inputValue}
                setInputValue={setInputValue}
                onSend={handleMessage}
                onNewChat={handleNewChat}
                isLoading={isLoading || sheetState.status === "generating"}
                disabled={
                  !isInitialized ||
                  isLoading ||
                  !sheetAiToken ||
                  sheetState.status === "generating"
                }
                placeholder={
                  !isInitialized
                    ? "Initializing..."
                    : !sheetAiToken
                      ? "Authentication required..."
                      : isLoading || sheetState.status === "generating"
                        ? "Generating sheet..."
                        : "Describe the spreadsheet you want to create..."
                }
              />
            </div>
          )}
        </div>
        {/* for simulation only */}
      </div>

      {toastState.open && (
        <div className="fixed top-5 right-5 z-9999 max-w-[400px] min-w-[300px]">
          <Alert
            variant={
              toastState.severity === "error" ? "destructive" : "default"
            }
            className="rounded-lg shadow-lg"
          >
            <AlertDescription className="text-sm">
              {toastState.message}
              <button
                onClick={() => setToastState({ ...toastState, open: false })}
                className="text-muted-foreground hover:text-foreground absolute top-2 right-2"
                aria-label="Close"
              >
                ×
              </button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* footer cta */}
      {/* // for simulation only */}
      {isSimulationMode && simulationCompleted && (
        <FooterCta
          isMobile={isMobile}
          showModal={showModal}
          setShowModal={setShowModal}
        />
      )}
    </>
  );
}

const CustomTableChartIcon = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="24"
    viewBox="0 0 24 24"
    width="24"
    className={className}
    {...props}
  >
    <path d="M0 0h24v24H0z" fill="none" />
    <path
      d="M10 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h5v-2H5V5h5V3zm9 0h-5v2h5v14h-5v2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v2h4v-2zm0-4h-4v2h4V9zm0-4h-4v2h4V5z"
      fill="currentColor"
    />
  </svg>
);
