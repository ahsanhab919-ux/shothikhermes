// ====== For Slide creation handler ======

import {
  addLog,
  setCurrentSlideId,
  setPresentationState,
  setStatus,
} from "@/redux/slices/presentationSlice";
import { setSheetState } from "@/redux/slices/sheetSlice";
import { createPresentationServer } from "@/services/createPresentationServer";
import { enrichLogEntry } from "@/utils/presentation/messageTypeClassifier.js.js";

// ====== For SLIDE generation handler ======
async function handleSlideCreation(
  inputValue,
  fileUrls,
  fileObjects,
  setAgentType,
  dispatch,
  setLoginDialogOpen,
  setIsSubmitting,
  setIsInitiatingPresentation,
  router,
  showToast,
) {
  try {
    sessionStorage.setItem("initialPrompt", inputValue);

    setAgentType("presentation");

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

    // Transform file data for optimistic log (use URLs only for display)
    const fileUrlsForLog = fileUrls && fileUrls.length > 0 ? fileUrls : null;

    // Immediately show the user's query in the presentation logs (optimistic UI)
    const localUserLog = enrichLogEntry({
      id: `local-user-${Date.now()}`,
      author: "user",
      type: "chunk",
      user_message: inputValue,
      timestamp: new Date().toISOString(),
      p_id: null,
      file_urls: fileUrlsForLog,
      temp: true,
    });
    dispatch(addLog(localUserLog));

    const token = localStorage.getItem("accessToken");

    if (!token) {
      // console.error(
      //   "[AgentLandingPage] No accessToken token found in localStorage"
      // );
      setLoginDialogOpen(true);
      setIsSubmitting(false);
      return;
    }

    setIsInitiatingPresentation(true);

    // Transform file data to include both URL and filename
    // If fileObjects are available, use them to get filenames
    // Otherwise, fall back to just URLs (for backward compatibility)
    let fileUrlsWithNames = null;
    if (fileUrls && fileUrls.length > 0) {
      if (fileObjects && fileObjects.length > 0) {
        // Map fileObjects to include both signed_url and filename
        fileUrlsWithNames = fileObjects.map((fileObj, index) => ({
          url: fileObj.signed_url || fileUrls[index],
          name: fileObj.filename || fileObj.name || `file_${index + 1}`,
        }));
      } else {
        // Fallback: if no fileObjects, send URLs as strings (backward compatibility)
        fileUrlsWithNames = fileUrls;
      }
    }

    const response = await createPresentationServer({
      message: inputValue,
      file_urls: fileUrlsWithNames,
      token,
    });

    // for action service👇
    if (!response?.success) {
      showToast("Failed to create presentation. Please try again.");
      setIsSubmitting(false);
      setIsInitiatingPresentation(false);
      return;
    }
    const presentationId = response?.presentationId;

    if (presentationId) {
      router.push(`/agents/presentation?id=${presentationId}`);
    } else {
      // console.error("[AgentLandingPage] No presentation ID received from API");
      showToast("Failed to create presentation. Please try again.");
      setIsSubmitting(false);
      setIsInitiatingPresentation(false);
    }
  } catch (error) {
    showToast("Failed to initiate presentation. Please try again.");
    setIsSubmitting(false);
    setIsInitiatingPresentation(false);
  }
}

// ====== For SHEET generation handler ======
async function handleSheetGenerationRequest(
  inputValue,
  setAgentType,
  dispatch,
  setLoginDialogOpen,
  setIsSubmitting,
  setIsInitiatingSheet,
  router,
  email,
  showToast,
  refreshSheetAIToken,
) {
  try {
    // 
    sessionStorage.setItem("initialSheetPrompt", inputValue);

    setAgentType("sheet");

    dispatch(
      setSheetState({
        logs: [],
        sheet: [],
        status: "idle",
        title: "Generating...",
      }),
    );

    // console.log(
    //   "[agentPageUtils] Initiating presentation with message:",
    //   inputValue
    // );

    const token = localStorage.getItem("accessToken");

    if (!token) {
      // console.error("[AgentPageUtils] No access token found");
      showToast("You need to be logged in to create a report sheet.");
      setLoginDialogOpen(true);
      setIsSubmitting(false);
      setIsInitiatingSheet(false);
      return;
    }

    setIsInitiatingSheet(true);

    // Check if we have a sheet stored token
    const storedSheetToken = localStorage.getItem("sheetai-token");

    // if (!storedSheetToken) {
    //   await refreshSheetAIToken();
    // }

    // After authenticate we will have a sheet token on the local storage
    let response;
    try {
      response = await fetch(
        // "https://sheetai.pixigenai.com/api/chat/create_chat",
        // "http://163.172.172.38:3005/api/chat/create_chat",
        `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_SHEET_REDIRECT_PREFIX}/chat/create_chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Authorization: `Bearer ${localStorage.getItem("sheetai-token")}`,
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({
            name: `${inputValue} - ${new Date().toLocaleString()}`,
          }),
        },
      );
      if (!response.ok) {
        // 
        showToast("Failed to create spreadsheet. Please try again.");
        setIsSubmitting(false);
        setIsInitiatingSheet(false);
        return;
      }
    } catch (error) {
      setIsSubmitting(false);
      setIsInitiatingSheet(false);
      return;
    }

    const result = await response.json();

    const chatId = result.chat_id || result.id || result._id;

    // Save active chat ID for connection polling
    sessionStorage.setItem("activeChatId", chatId);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    router.push(`/agents/sheets/?id=${chatId}`);
  } catch (error) {
    setIsSubmitting(false);
    showToast("An error occurred while creating the spreadsheet.");
    setIsInitiatingSheet(false);
  }
}

// ====== For Research generation handler ======
async function handleResearchRequest(
  inputValue,
  researchModel,
  topLevel,
  setIsInitiatingResearch,
  setLoginDialogOpen,
  setIsSubmitting,
  showToast,
  router,
) {
  try {
    sessionStorage.setItem("initialResearchPrompt", inputValue);
    sessionStorage.setItem(
      "r-config",
      JSON.stringify({
        topK: topLevel,
        model: researchModel === "gemini-2.0-flash" ? "basic" : "pro",
      }),
    );

    const token = localStorage.getItem("accessToken");

    if (!token) {
      // console.error("[AgentPageUtils] No access token found");
      showToast("You need to be logged in to create a report sheet.");
      setLoginDialogOpen(true);
      setIsSubmitting(false);
      setIsInitiatingResearch(false);
      return;
    }

    setIsInitiatingResearch(true);

    // After authenticate we will have a sheet token on the local storage
    let response;
    try {
      response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_RESEARCH_REDIRECT_PREFIX}/chat/create_chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({
            name: `${inputValue} - ${new Date().toLocaleString()}`,
          }),
        },
      );
      if (!response.ok) {
        // 
        showToast("Failed to research. Please try again.");
        setIsSubmitting(false);
        setIsInitiatingResearch(false);
        return;
      }
    } catch (error) {
      setIsSubmitting(false);
      setIsInitiatingResearch(false);
      return;
    }

    const result = await response.json();

    const chatId = result.chat_id || result.id || result._id;

    // Save active chat ID for connection polling
    sessionStorage.setItem("activeResearchChatId", chatId);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    router.push(`/agents/research/?id=${chatId}`);
  } catch (error) {
    setIsSubmitting(false);
    showToast("An error occurred while researching.");
    setIsInitiatingResearch(false);
  }
}
// ====== For Follow-up query handler ======
async function handleFollowUpQuery(
  inputValue,
  fileUrls,
  currentPId,
  userId,
  dispatch,
  setIsLoading,
  showToast,
) {
  try {
    // Validate required parameters
    if (!inputValue || !inputValue.trim()) {
      showToast("Please enter a message", "error");
      return { success: false };
    }

    if (!currentPId) {
      showToast(
        "Presentation ID is missing. Please refresh the page.",
        "error",
      );
      return { success: false };
    }

    if (!userId) {
      showToast("User authentication required. Please log in.", "error");
      return { success: false };
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      showToast("Authentication required. Please log in.", "error");
      return { success: false };
    }

    // Immediately show the user's query in the presentation logs (optimistic UI)
    // Include both user_message (for backend) and content/text (for UI display)
    const localUserLog = enrichLogEntry({
      id: `local-user-${Date.now()}`,
      author: "user",
      type: "chunk",
      user_message: inputValue,
      content: inputValue, // For UI display in UserMessageLog
      text: inputValue, // Alternative field for UI display
      timestamp: new Date().toISOString(),
      p_id: currentPId,
      file_urls: fileUrls && fileUrls.length ? fileUrls : null,
      temp: true,
    });

    // Dispatch the optimistic log - ensure it's added to Redux
    dispatch(addLog(localUserLog));

    setIsLoading(true);

    const response = await createPresentationServer({
      message: inputValue,
      file_urls: fileUrls,
      p_id: currentPId,
      userId: userId,
      token: token,
    });

    if (!response?.success) {
      console.error("[handleFollowUpQuery] Failed to send follow-up query");
      showToast("Failed to send follow-up query. Please try again.", "error");
      setIsLoading(false);
      return { success: false };
    }

    const returnedPId = response?.presentationId;
    const responseStatus = response?.status; // "queued" status from API

    // Update Redux with the returned p_id and status
    if (returnedPId) {
      dispatch(setCurrentSlideId({ presentationId: returnedPId }));
    }

    // Handle the queued status - resume orchestrator process
    if (responseStatus === "queued") {
      // Update status to queued in Redux
      dispatch(
        setStatus({
          status: "streaming",
          presentationStatus: "queued",
        }),
      );

      // The socket connection will be automatically established by usePresentationSocket
      // because the status is now "queued" in Redux and the orchestrator will detect it
    } else {
      // For other statuses, just update the status
      dispatch(
        setStatus({
          status: "streaming",
          presentationStatus: responseStatus || "processing",
        }),
      );
    }

    setIsLoading(false);
    showToast("Follow-up query sent successfully", "success");
    return { success: true };
  } catch (error) {
    console.error("[handleFollowUpQuery] Error:", error);
    showToast(
      "An error occurred while sending the follow-up query. Please try again.",
      "error",
    );
    setIsLoading(false);
    return { success: false };
  }
}

// ====== For AI Chat generation handler ======
// ====== For Calls generation handler ======
// ====== For ALl Agents generation handler ======

export {
  handleFollowUpQuery,
  handleResearchRequest,
  handleSheetGenerationRequest,
  handleSlideCreation,
};
