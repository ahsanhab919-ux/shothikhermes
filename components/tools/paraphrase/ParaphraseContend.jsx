"use client";
import { modes } from "@/_mock/tools/paraphrase";
import { ENV } from "@/config/env";
import { trySamples } from "@/_mock/trySamples";
import { trackEvent } from "@/analysers/eventTracker";
import logger from "@/lib/logger";
import { trackToolUsed } from "@/lib/posthog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Menubar,
  MenubarContent,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Separator } from "@/components/ui/separator";
import { detectLanguage } from "@/hooks/languageDitector";
import useResponsive from "@/hooks/ui/useResponsive";
import useDebounce from "@/hooks/useDebounce";
import useSetState from "@/hooks/useSetState";
import useWordLimit from "@/hooks/useWordLimit";
import { cn } from "@/lib/utils";
import { setShowLoginModal } from "@/redux/slices/auth";
import { setAlertMessage, setShowAlert } from "@/redux/slices/tools";
import { File as FileIcon, MoreVertical } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import WordCounter from "../common/WordCounter";
import LanguageMenu from "../grammar/LanguageMenu";
import FileHistorySidebar from "./FileHistorySidebar";
import ModeNavigation from "./ModeNavigation";
import Onboarding from "./Onboarding";
import OutputBotomNavigation from "./OutputBotomNavigation";
import ParaphraseOutput from "./ParaphraseOutput";
import UpdateComponent from "./UpdateComponent";
import UserInputBox from "./UserInputBox";
import VerticalMenu from "./VerticalMenu";

import { useAutoFreeze } from "@/hooks/useAutoFreeze";
import { useSTEMFreeze } from "@/hooks/useSTEMFreeze";
import { STEMSafeBadge } from "@/components/tools/common/STEMSafeToggle";
import { InlineUsageBadge } from "@/components/tools/common/UsageTracker";
import useKeyboardShortcuts from "@/hooks/useKeyboardShortcuts";
import { useParaphrasedMutation } from "@/redux/api/tools/toolsApi";
import { setParaphraseValues } from "@/redux/slices/inputOutput";
import {
  setActiveHistory,
  setFileHistories,
  setFileHistoriesMeta,
  setFileHistoryGroups,
  setHistories,
  setHistoryGroups,
  setIsFileHistoryLoading,
} from "@/redux/slices/paraphraseHistorySlice";
import MultipleFileUpload from "../common/MultipleFileUpload";
import UserActionInput from "../common/UserActionInput";
import AutoFreezeSettings from "./AutoFreezeSettings";
import AutoParaphraseSettings from "./AutoParaphraseSettings";
import InlineStatusChip from "./InlineStatusChip";
import { buildParaphraseInlineError } from "./paraphrase-modernization";
import {
  assessParaphraseQuality,
  findMatchingParaphrasePreset,
  PARAPHRASE_VARIATION_PRESETS,
} from "./paraphrase-refinement";
import SocketDebug from "../../common/SocketDebug";
import SimplifiedParaphrasePanel from "./SimplifiedParaphrasePanel";
import VariationPresetBar from "./VariationPresetBar";
import {
  normalizePunctuationSpacing,
  SYNONYMS,
  initialFrozenWords,
  initialFrozenPhrase,
  isModeLockedForUser,
} from "./paraphraseUtils";

const ParaphraseContend = () => {
  const { paraphraseQuotations, automaticStartParaphrasing } = useSelector(
    (state) => state.settings.paraphraseOptions,
  );

  const { useYellowHighlight } = useSelector(
    (state) => state.settings.interfaceOptions,
  );

  const [showDemo, setShowDemo] = useState(false);
  useEffect(() => {
    const shown = localStorage.getItem("onboarding") || false;
    if (!shown) {
      setShowDemo(true);
    }
  }, []);

  const [activeHistoryDetails, setActiveHistoryDetails] = useState(null);

  const [selectedSynonyms, setSelectedSynonymsState] = useState(SYNONYMS[20]);
  const setSelectedSynonyms = (...args) => {
    setActiveHistoryDetails(null);
    dispatch(setActiveHistory({}));
    return setSelectedSynonymsState(...args);
  };

  const [showLanguageDetect, setShowLanguageDetect] = useState(false);
  const { accessToken } = useSelector((state) => state.auth);
  const [outputHistoryIndex, setOutputHistoryIndex] = useState(0);
  const [highlightSentence, setHighlightSentence] = useState(0);
  const [selectedMode, setSelectedModeState] = useState("Standard");
  const setSelectedMode = (...args) => {
    setActiveHistoryDetails(null);
    dispatch(setActiveHistory({}));
    return setSelectedModeState(...args);
  };

  const [outputWordCount, setOutputWordCount] = useState(0);
  const [outputHistory, setOutputHistory] = useState([]);
  const [outputContend, setOutputContend] = useState("");
  const { user } = useSelector((state) => state.auth);
  const frozenWords = useSetState(initialFrozenWords);
  const frozenPhrases = useSetState(initialFrozenPhrase);
  const [recommendedFreezeWords, setRecommendedFreezeWords] = useState([]);
  const [language, setLanguageState] = useState("English (US)");
  const setLanguage = (...args) => {
    setActiveHistoryDetails(null);
    dispatch(setActiveHistory({}));
    return setLanguageState(...args);
  };
  const sampleText = useMemo(() => {
    const langKey =
      language && language.startsWith("English") ? "English" : language;
    return trySamples.paraphrase[langKey] || null;
  }, [language]);

  const hasSampleText = Boolean(sampleText); // To conditionally show the Try Sample button
  const [isLoading, setIsLoading] = useState(false);
  const { wordLimit } = useWordLimit("paraphrase");
  const [userInput, setUserInputState] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      const draft = localStorage.getItem("paraphrase_draft");
      const ts = localStorage.getItem("paraphrase_draft_ts");
      if (draft && ts) {
        const age = Date.now() - Number(ts);
        if (age < 24 * 60 * 60 * 1000) return draft;
        localStorage.removeItem("paraphrase_draft");
        localStorage.removeItem("paraphrase_draft_ts");
      }
    } catch {}
    return "";
  });
  const setUserInput = (...args) => {
    setActiveHistoryDetails(null);
    dispatch(setActiveHistory({}));
    return setUserInputState(...args);
  };
  const userInputValue = useDebounce(userInput, 800);
  const [socketId, setSocketId] = useState(null);
  const [paraphrased] = useParaphrasedMutation();
  const [eventId, setEventId] = useState(null);
  // Use refs to avoid closure issues in socket listeners
  const eventIdRef = useRef(null);
  const socketIdRef = useRef(null);
  const socketRef = useRef(null);
  const isMobile = useResponsive("down", "md");
  const isDesktop = useResponsive("up", "lg");
  const [result, setResult] = useState([]);
  const [historyResult, setHistoryResult] = useState([]);

  const dispatch = useDispatch();
  const outputRef = useRef(null);
  const [showMessage, setShowMessage] = useState({
    show: false,
    Component: null,
  });
  const [processing, setProcessing] = useState({
    loading: false,
    success: false,
  });
  const [statusChip, setStatusChip] = useState(null);
  const [inlineError, setInlineError] = useState(null);
  const [paraphraseRequestCounter, setParaphraseRequestCounter] = useState(0);
  const enableSimplifiedParaphraseUI =
    process.env.NEXT_PUBLIC_ENABLE_PARAPHRASE_SIMPLIFIED !== "false";

  const hasOutput = result?.length > 0 && outputContend.trim()?.length > 0; // Checking if we have actual output content
  const [confirmationDialog, setConfirmationDialog] = useState({
    open: false,
    word: "",
    count: 0,
    action: null, // Will store the function to execute on confirm
  }); // this is for freezing word confirmation

  const {
    activeHistory,
    isUpdatedHistory,
    isUpdatedFileHistory,
    fileHistories,
  } = useSelector((state) => state.paraphraseHistory);

  const paidUser =
    user?.package === "pro_plan" ||
    user?.package === "value_plan" ||
    user?.package === "unlimited";

  const { paraphraseOptions } = useSelector((state) => state.settings);

  const {
    autoFrozenTerms,
    userDisabledTerms,
    isDetecting: isAutoFreezeDetecting,
    stats: autoFreezeStats,
    disableTerm: disableAutoFreezeTerm,
    enableTerm: enableAutoFreezeTerm,
    isAutoFrozen,
    getTermInfo,
  } = useAutoFreeze({
    userInput,
    language,
    frozenWords,
    onAutoFreeze: (terms) => {
      // ✅ Auto-freeze detected terms with normalization
      terms.forEach((term) => {
        const normalizedTerm = term.toLowerCase().trim().replace(/\s+/g, " ");

        // Check if it's a phrase or single word
        if (normalizedTerm.includes(" ")) {
          if (!frozenPhrases.has(normalizedTerm)) {
            frozenPhrases.add(normalizedTerm);
          }
        } else {
          if (!frozenWords.has(normalizedTerm)) {
            frozenWords.add(normalizedTerm);
          }
        }
      });
    },
    debounceMs: 2500,
    enableLLM: paidUser, // Only using LLM for paid users
    shouldAutoFreeze: paraphraseOptions.autoFreeze, // checks if auto freeze should be enabled or not.
  });

  const {
    stemStats,
    hasStemContent,
  } = useSTEMFreeze({
    userInput,
    frozenPhrases,
    enabled: paraphraseOptions.stemSafeMode !== false,
    debounceMs: 1500,
  });

  // Define keyboard shortcuts
  useKeyboardShortcuts({
    // Ctrl/Cmd + Enter: Paraphrase
    "ctrl+enter": () => {
      if (userInput && !isLoading && !processing.loading) {
        handleSubmit();
      }
    },

    // Ctrl/Cmd + Shift + C: Clear all
    "ctrl+shift+c": () => {
      handleClear("", "all");
    },

    // Ctrl/Cmd + K: Copy output
    "ctrl+k": () => {
      if (outputContend) {
        navigator.clipboard.writeText(outputContend);
        toast.success("Output copied to clipboard!");
      }
    },

    // Ctrl/Cmd + Shift + L: Change language (cycle through)
    "ctrl+shift+l": () => {
      const languages = ["English (US)", "English (UK)", "Bangla"];
      const currentIndex = languages.indexOf(language);
      const nextIndex = (currentIndex + 1) % languages.length;
      setLanguage(languages[nextIndex]);
    },

    // Ctrl/Cmd + 1-4: Switch modes
    "ctrl+1": () => setSelectedMode("Standard"),
    "ctrl+2": () => setSelectedMode("Fluency"),
    "ctrl+3": () => setSelectedMode("Humanize"),
    "ctrl+4": () => setSelectedMode("Formal"),

    // Escape: Clear output only
    escape: () => {
      if (result?.length > 0) {
        handleClear("", "output");
      }
    },

    // Ctrl/Cmd + H: Navigate history (cycle)
    "ctrl+h": () => {
      if (outputHistory.length > 0) {
        setOutputHistoryIndex((prev) => (prev + 1) % outputHistory.length);
      }
    },
  });

  // Helper function to count word occurrences in text
  const countWordOccurrences = (text, word) => {
    if (!text || !word) return 0;

    const lowerText = text.toLowerCase();
    const lowerWord = word.toLowerCase();

    // Using word boundaries to match whole words only
    const regex = new RegExp(
      `\\b${lowerWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "gi",
    );
    const matches = lowerText.match(regex);

    return matches ? matches.length : 0;
  };

  // Modified function to handle freezing with confirmation
  const handleFreezeWord = (word) => {
    const normalizedWord = word.toLowerCase().trim().replace(/\s+/g, " ");
    const count = countWordOccurrences(userInput, word);


    if (count > 1) {
      // Show confirmation dialog
      setConfirmationDialog({
        open: true,
        word: normalizedWord,
        count: count,
        action: () => {
          frozenWords.add(normalizedWord);
          setConfirmationDialog({
            open: false,
            word: "",
            count: 0,
            action: null,
          });

          setTimeout(() => {
            frozenWords.add(normalizedWord);
            toast.success(`Frozen all ${count} instances successfully`);
          }, 100);
        },
      });
    } else {
      // Directly freeze if only one occurrence
      frozenWords.add(normalizedWord);
      toast.success("Frozen successfully");
    }
  };

  // Similar function for phrases
  const handleFreezePhrase = (phrase) => {
    const normalizedPhrase = phrase.toLowerCase().trim().replace(/\s+/g, " ");
    const count = countWordOccurrences(userInput, phrase);


    if (count > 1) {
      setConfirmationDialog({
        open: true,
        word: phrase,
        count: count,
        action: () => {
          // frozenPhrases.add(phrase.toLowerCase());
          frozenPhrases.add(normalizedPhrase);
          setConfirmationDialog({
            open: false,
            word: "",
            count: 0,
            action: null,
          });
        },
      });
    } else {
      frozenPhrases.add(normalizedPhrase);
    }
  };

  // Dispatch userInput to Redux
  useEffect(() => {
    dispatch(
      setParaphraseValues({ type: "input", values: { text: userInput } }),
    );
  }, [userInput, dispatch]);

  // Auto-save input draft to localStorage
  useEffect(() => {
    if (!userInput) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem("paraphrase_draft", userInput);
        localStorage.setItem("paraphrase_draft_ts", Date.now().toString());
      } catch {}
    }, 1000);
    return () => clearTimeout(timer);
  }, [userInput]);

  useEffect(() => {
    if (!!activeHistory?._id) return;

    if (!userInput) return;

    let timer;
    const detectLang = detectLanguage(userInput);
    if (detectLang !== language) {
      setLanguage(detectLang);
      setShowLanguageDetect(true);
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        setShowLanguageDetect(false);
      }, 3000);
    }
  }, [userInput]);

  useEffect(() => {
    if (!outputHistory.length) {
      return;
    }

    const historyData = outputHistory[outputHistoryIndex];

    if (historyData) {
      setResult(historyData);
    }
  }, [outputHistoryIndex]);

  useEffect(() => {
    if (!enableSimplifiedParaphraseUI) return;

    if (processing.loading || isLoading) {
      setStatusChip({ status: "loading", label: "Paraphrasing..." });
      return;
    }

    if (inlineError) {
      setStatusChip({
        status: "error",
        label: inlineError.chipLabel || inlineError.message,
      });
      return;
    }

    if (processing.success && outputContend?.trim()) {
      setStatusChip({ status: "success", label: "Done" });
      const timer = setTimeout(() => setStatusChip(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [
    enableSimplifiedParaphraseUI,
    inlineError,
    isLoading,
    outputContend,
    processing.loading,
    processing.success,
  ]);

  const reportClientError = (scope, error, messageOverride) => {
    const message = messageOverride || error?.message || "Unknown paraphrase client error";
    logger.error("[paraphrase-ui] client error", error, {
      scope,
      userId: user?.id || user?._id || null,
      inputLength: userInput?.length || 0,
      browser: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      timestamp: new Date().toISOString(),
      message,
    });
  };

  const qualityAssessment = useMemo(
    () => assessParaphraseQuality(userInput, outputContend),
    [userInput, outputContend],
  );

  const activeVariationPreset = useMemo(
    () => findMatchingParaphrasePreset(selectedMode, selectedSynonyms),
    [selectedMode, selectedSynonyms],
  );

  const handleApplyVariationPreset = (preset) => {
    setSelectedMode(preset.mode);
    setSelectedSynonyms(preset.synonymLabel);
    setShowMessage({ show: false, Component: null });
  };

  const historyGroupsByPeriod = (histories = []) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const groups = histories?.reduce((acc, entry) => {
      const d = new Date(entry.timestamp);
      const m = d.getMonth();
      const y = d.getFullYear();
      const monthName = d.toLocaleString("default", { month: "long" });
      const key =
        m === currentMonth && y === currentYear
          ? "This Month"
          : `${monthName} ${y}`;

      if (!acc[key]) acc[key] = [];
      acc?.[key]?.push({
        _id: entry._id,
        text: entry.text,
        time: entry.timestamp,
      });
      return acc;
    }, {});

    const result = [];

    if (groups?.["This Month"]) {
      result.push({ period: "This Month", history: groups["This Month"] });
      delete groups["This Month"];
    }
    Object.keys(groups)
      .sort((a, b) => {
        const [ma, ya] = a.split(" ");
        const [mb, yb] = b.split(" ");
        const da = new Date(`${ma} 1, ${ya}`);
        const db = new Date(`${mb} 1, ${yb}`);
        return db - da;
      })
      .forEach((key) => {
        result.push({ period: key, history: groups?.[key] });
      });

    return result;
  };

  const fetchHistory = async () => {
    const API_BASE = ENV.api_url;

    try {
      const res = await fetch(`${API_BASE}/history`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      });
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      const groups = historyGroupsByPeriod(data || []);

      dispatch(setHistories(data));
      dispatch(setHistoryGroups(groups));
    } catch (err) {
      console.error(err);
    }
  };

  // Effect to update outputContend and outputWordCount when result changes
  useEffect(() => {
    if (result?.length > 0) {
      const plainText = extractPlainText(result);
      setOutputContend(plainText);
      setOutputWordCount(
        plainText.split(/\s+/).filter((w) => w.length > 0).length,
      );
    } else {
      setOutputContend("");
      setOutputWordCount(0);
      dispatch(
        setParaphraseValues({ type: "output", values: { text: "", data: [] } }),
      ); // Clear output in Redux
    }
  }, [result, dispatch]); // Add dispatch to dependency array

  // State to track completed events and reload history;
  const [completedEvents, setCompletedEvents] = useState({
    plain: false,
    tagging: false,
    synonyms: false,
  });

  // Fixed frontend socket handling - based on your working version
  useEffect(() => {
    if (!!activeHistory?._id) return;

    // Reset completion flags
    setCompletedEvents({ plain: false, tagging: false, synonyms: false });

    const socket = io(ENV.paraphrase_socket_url, {
      path: `/${ENV.paraphrase_redirect_prefix}/socket.io`,
      transports: ["polling", "websocket"],
      auth: { token: accessToken },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    // Store socket instance in ref for direct access
    socketRef.current = socket;

    socket.on("connect", () => {
      // Update both state and ref synchronously
      setSocketId(socket.id);
      socketIdRef.current = socket.id;
      // Clear eventIdRef on reconnect to prevent processing old events
      eventIdRef.current = null;
      setEventId(null);
    });

    socket.on("disconnect", () => {
      setSocketId("");
      socketIdRef.current = null;
      // Clear eventIdRef on disconnect
      eventIdRef.current = null;
      setEventId(null);
    });

    let accumulatedText = "";
    // Track which indices have been processed to avoid duplicates
    const processedIndices = {
      tagging: new Set(),
      synonyms: new Set(),
    };

    function mapBackendIndexToResultIndex(backendIndex, result) {
      const sentenceSlots = [];
      result.forEach((seg, idx) => {
        if (!(seg.length === 1 && seg[0].type === "newline")) {
          sentenceSlots.push(idx);
        }
      });
      return sentenceSlots[backendIndex] ?? -1;
    }

    // ═══════════════════════════════════════════════════════════
    // PLAIN TEXT HANDLER
    // ═══════════════════════════════════════════════════════════
    socket.on("paraphrase-plain", (data) => {

      if (data === ":end:") {
        const wc = accumulatedText.split(/\s+/).filter((w) => w.length > 0).length;
        trackToolUsed("paraphrase", wc);
        accumulatedText = "";
        setIsLoading(false);
        setCompletedEvents((prev) => ({ ...prev, plain: true }));
        return;
      }

      // First chunk - clear old results
      if (accumulatedText === "") {
        setResult([]);
        processedIndices.tagging.clear();
        processedIndices.synonyms.clear();
      }

      accumulatedText += data.replace(/[{}]/g, "");

      setOutputContend(accumulatedText);
      setOutputWordCount(
        accumulatedText.split(/\s+/).filter((w) => w.length > 0).length,
      );

      // Rebuild result with proper sentence structure
      const lines = accumulatedText.split(/\r?\n/);
      const sentenceSeparator =
        language === "Bangla" ? /(?:।\s+|\.\r?\n+)/ : /(?:\.\s+|\.\r?\n+)/;
      const newResult = [];

      lines.forEach((line) => {
        if (!line.trim()) {
          newResult.push([{ word: "\n", type: "newline", synonyms: [] }]);
        } else {
          line
            .split(sentenceSeparator)
            .filter(Boolean)
            .forEach((sentence) => {
              const words = sentence
                .trim()
                .split(/\s+/)
                .map((w) => ({ word: w, type: "none", synonyms: [] }));
              newResult.push(words);
            });
        }
      });

      setResult(newResult);
      dispatch(
        setParaphraseValues({
          type: "output",
          values: { text: accumulatedText },
        }),
      );
    });

    // ═══════════════════════════════════════════════════════════
    // TAGGING HANDLER - CRITICAL FIX
    // ═══════════════════════════════════════════════════════════
    socket.on("paraphrase-tagging", (raw) => {
      if (raw === ":end:") {
        setCompletedEvents((prev) => ({ ...prev, tagging: true }));
        return;
      }

      let parsed, backendIndex, eid;
      try {
        const payload = JSON.parse(raw);
        backendIndex = payload.index;
        eid = payload.eventId;
        parsed = payload.data;

        // Use ref to get current eventId value (avoids closure issues)
        if (eid !== eventIdRef.current) {
          return;
        }

        // Prevent duplicate processing
        if (processedIndices.tagging.has(backendIndex)) {
          return;
        }
        processedIndices.tagging.add(backendIndex);
      } catch (err) {
        return;
      }


      setResult((prev) => {
        if (!prev || prev.length === 0) {
          return prev;
        }

        const updated = [...prev];
        const targetIdx = mapBackendIndexToResultIndex(backendIndex, prev);

        if (targetIdx < 0) {
          return prev;
        }

        if (!Array.isArray(parsed)) {
          return prev;
        }

        updated[targetIdx] = parsed.map((item) => ({
          ...item,
          word: item.word.replace(/[{}]/g, ""),
        }));

        return updated;
      });
    });

    // ═══════════════════════════════════════════════════════════
    // SYNONYMS HANDLER - CRITICAL FIX
    // ═══════════════════════════════════════════════════════════
    socket.on("paraphrase-synonyms", (raw) => {
      if (raw === ":end:") {
        setProcessing({ success: true, loading: false });
        setCompletedEvents((prev) => ({ ...prev, synonyms: true }));
        return;
      }

      let analysis, backendIndex, eid;
      try {
        const payload = JSON.parse(raw);
        backendIndex = payload.index;
        eid = payload.eventId;
        analysis = payload.data;

        // Use ref to get current eventId value (avoids closure issues)
        if (eid !== eventIdRef.current) {
          return;
        }

        // Prevent duplicate processing
        if (processedIndices.synonyms.has(backendIndex)) {
          return;
        }
        processedIndices.synonyms.add(backendIndex);
      } catch (err) {
        return;
      }


      setResult((prev) => {
        if (!prev || prev.length === 0) {
          return prev;
        }

        const updated = [...prev];
        const targetIdx = mapBackendIndexToResultIndex(backendIndex, prev);

        if (targetIdx < 0) {
          return prev;
        }

        if (!Array.isArray(analysis) || analysis.length === 0) {
          return prev;
        }

        updated[targetIdx] = analysis.map((item) => ({
          ...item,
          word: item.word.replace(/[{}]/g, ""),
        }));

        return updated;
      });
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("paraphrase-plain");
      socket.off("paraphrase-tagging");
      socket.off("paraphrase-synonyms");
      socket.disconnect();
      socketRef.current = null;
      socketIdRef.current = null;
    };
  }, [language, accessToken]);

  useEffect(() => {
    if (!accessToken) return;

    fetchHistory();
  }, [accessToken]);

  // File History Processes

  const fileHistoryGroupsByPeriod = (histories = []) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const groups = histories?.reduce((acc, entry) => {
      const d = new Date(entry?.timestamp);
      const m = d.getMonth();
      const y = d.getFullYear();
      const monthName = d.toLocaleString("default", { month: "long" });
      const key =
        m === currentMonth && y === currentYear
          ? "This Month"
          : `${monthName} ${y}`;

      if (!acc[key]) acc[key] = [];
      acc?.[key]?.push({
        ...(entry || {}),
      });
      return acc;
    }, {});

    const result = [];

    if (groups?.["This Month"]) {
      result.push({ period: "This Month", history: groups["This Month"] });
      delete groups["This Month"];
    }
    Object.keys(groups)
      .sort((a, b) => {
        const [ma, ya] = a.split(" ");
        const [mb, yb] = b.split(" ");
        const da = new Date(`${ma} 1, ${ya}`);
        const db = new Date(`${mb} 1, ${yb}`);
        return db - da;
      })
      .forEach((key) => {
        result.push({ period: key, history: groups?.[key] });
      });

    return result;
  };

  const fetchFileHistories = async ({
    page = 1,
    limit = 10,
    reset = false,
    search = "",
  } = {}) => {
    const API_BASE =
      ENV.api_url +
      `/${ENV.paraphrase_redirect_prefix}/api`;

    try {
      if (!accessToken) return;
      dispatch(setIsFileHistoryLoading(true));

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search: search.trim() }),
      });

      const res = await fetch(
        `${API_BASE}/files/file-histories?${queryParams}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!res.ok) console.error("Failed to fetch file history");

      const { data = [], meta = {} } = await res.json();

      if (reset) {
        const groups = fileHistoryGroupsByPeriod(data || []);
        dispatch(setFileHistories(data || []));
        dispatch(setFileHistoryGroups(groups || []));
        dispatch(setFileHistoriesMeta(meta || {}));
      } else {
        const allHistories = [...(fileHistories || []), ...(data || [])];
        const groups = fileHistoryGroupsByPeriod(allHistories || []);
        dispatch(setFileHistories(allHistories || []));
        dispatch(setFileHistoryGroups(groups || []));
        dispatch(setFileHistoriesMeta(meta || {}));
      }
    } catch (err) {
      console.error("Error fetching file histories:", err);
    } finally {
      dispatch(setIsFileHistoryLoading(false));
    }
  };

  useEffect(() => {
    if (!accessToken) return;

    fetchFileHistories({ reset: true });
  }, [isUpdatedFileHistory, accessToken]);

  function handleClear(_, action = "all") {
    if (action === "all") {
      setUserInput("");
      frozenWords.reset(initialFrozenWords);
      frozenPhrases.reset(initialFrozenPhrase);
      dispatch(setParaphraseValues({ type: "input", values: { text: "" } }));
      dispatch(
        setParaphraseValues({ type: "output", values: { text: "", data: [] } }),
      );
      setResult([]);
      setOutputHistory([]);
      try {
        localStorage.removeItem("paraphrase_draft");
        localStorage.removeItem("paraphrase_draft_ts");
      } catch {}
    } else if (action === "output") {
      // Only clear output, preserve input
      setResult([]);
      setOutputHistory([]);
      dispatch(
        setParaphraseValues({ type: "output", values: { text: "", data: [] } }),
      );
    }
    setParaphraseRequestCounter((prev) => prev + 1);
  }

  useEffect(() => {
    if (!!activeHistory?._id) return;

    // If user *wants* to paraphrase quotations, we need to *un*-freeze any
    // previously frozen quoted phrases.
    if (paraphraseQuotations) {
      for (const phrase of frozenPhrases.set) {
        // match only strings that start AND end with a double-quote
        if (/^".+"$/.test(phrase)) {
          frozenPhrases.remove(phrase);
        }
      }
      return; // and skip the auto-freeze step
    }

    // Otherwise (they DON'T want quotations paraphrased), auto-freeze them:
    const words = userInput
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    const finalText = words.slice(0, wordLimit).join(" ");

    if (words.length <= wordLimit) {
      const quotedPhrases = [...finalText?.matchAll(/"[^"]+"/g)]?.map(
        (m) => m[0],
      );
      for (const phrase of quotedPhrases) {
        frozenPhrases.add(phrase.trim());
      }
    }
  }, [userInputValue, paraphraseQuotations]);

  const handleSubmit = async (value) => {
    try {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("shothik_tool_submit", { detail: { tool: "paraphrase" } }));
      }

      if (showMessage.show) {
        setShowMessage({ show: false, Component: null });
      }

      setCompletedEvents({
        plain: false,
        tagging: false,
        synonyms: false,
      }); // For restarting flags.
      setInlineError(null);
      // track event
      if (!value) {
        trackEvent("click", "paraphrase", "paraphrase_click", 1);
      }

      // Get socketId from ref (always current) or socket instance directly
      const currentSocketId = socketIdRef.current || socketRef.current?.id;
      if (!currentSocketId) {
        const socketError = {
          message: "Connection lost. Please refresh the page and try again.",
        };
        reportClientError("socket-missing", socketError, socketError.message);
        setInlineError(buildParaphraseInlineError(socketError, value || userInput));
        return;
      }

      setActiveHistory({});
      setActiveHistoryDetails(null);

      let payload;

      setIsLoading(true);
      setResult([]);
      setOutputHistoryIndex(0);
      setProcessing({ success: false, loading: true });
      setParaphraseRequestCounter((prev) => prev + 1); // Increment counter on new request
      // use the full raw Markdown string for payload
      const textToParaphrase = value || userInput;


      // but enforce word-limit on a plain-text version
      // strip common markdown tokens for counting
      const plainTextForCount = textToParaphrase
        .replace(/(```[\s\S]*?```)|(`[^`]*`)/g, "$1") // keep code blocks, but...
        .replace(/[#*_>\-\[\]\(\)~`]/g, "") // remove markdown markers
        .trim();
      const wordCount = plainTextForCount
        .split(/\s+/)
        .filter((w) => w.length > 0).length;
      if (wordCount > wordLimit) {
        throw { error: "LIMIT_REQUEST", message: "Words limit exceeded" };
      }

      // now build your payload using the untouched Markdown
      // Use currentSocketId from ref (always up-to-date) instead of state
      const randomNumber = Math.floor(Math.random() * 1e10);
      const newEventId = `${currentSocketId}-${randomNumber}`;
      // Update both state and ref synchronously
      setEventId(newEventId);
      eventIdRef.current = newEventId;

      const freeze = [
        ...(frozenWords?.values || []),
        ...(frozenPhrases?.values || []),
      ]
        .filter(Boolean)
        .join(", ");
      payload = {
        text: textToParaphrase,
        freeze,
        language: language,
        mode: selectedMode ? selectedMode.toLowerCase() : "standard",
        synonym: selectedSynonyms ? selectedSynonyms.toLowerCase() : "basic",
        socketId: currentSocketId, // Use ref value, not state
        eventId: newEventId, // Always use the newly generated eventId
      };

      // Emit event directly via socket
      if (socketRef.current) {
        socketRef.current.emit("paraphrase", payload);
      } else {
        const socketError = {
          message: "Connection lost. Please refresh the page and try again.",
        };
        toast.error(socketError.message);
        reportClientError("socket-emit", socketError, socketError.message);
        setInlineError(buildParaphraseInlineError(socketError, textToParaphrase));
        setProcessing({ success: false, loading: false });
        setIsLoading(false);
        return;
      }

      if (isMobile && outputRef.current) {
        outputRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    } catch (error) {
      reportClientError("submit", error);
      if (error?.name === "UsageLimitError" || error?.code === "USAGE_LIMIT_EXCEEDED") {
        dispatch(setShowAlert(true));
        dispatch(setAlertMessage(`You've reached your ${error.tier || "free"} plan limit (${error.used || 0}/${error.limit || 0}). Upgrade your plan for more usage.`));
        setInlineError(buildParaphraseInlineError(error, value || userInput));
        setProcessing({ success: false, loading: false });
        setIsLoading(false);
        return;
      }
      const actualError = error?.data?.error;
      if (/LIMIT_REQUEST|PACAKGE_EXPIRED/.test(actualError)) {
        dispatch(setShowAlert(true));
        dispatch(setAlertMessage(error?.data?.message));
      } else if (actualError === "UNAUTHORIZED") {
        dispatch(setShowLoginModal(true));
      } else {
        toast.error(error?.data?.message || error.message);
      }
      setInlineError(buildParaphraseInlineError(error, value || userInput));
      setProcessing({ success: false, loading: false });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!!activeHistory?._id) return;
    // only auto-start if the setting is ON

    // Check if current mode is locked for user
    const isLocked = isModeLockedForUser(selectedMode, user?.package);

    // If mode is locked, show message and don't auto-paraphrase
    if (isLocked) {
      setShowMessage({ show: true, Component: selectedMode });
      if (result?.length > 0) {
        handleClear("", "output"); // Clear output if any
      }
      return;
    }

    // Clear message if mode is not locked
    if (!isLocked && showMessage.show) {
      setShowMessage({ show: false, Component: null });
    }

    // only auto-start if the setting is ON
    if (!automaticStartParaphrasing) {
      if (result?.length > 0) {
        toast.info("Click Rephrase to view the updated result.");
        handleClear("", "output");
      }
      return;
    }

    // Trigger paraphrase if language changes and there is user input
    if (language && userInputValue) {
      if (!processing.loading) {
        handleSubmit(userInputValue);
      } else {
        toast.info("Please wait while paraphrasing is in progress...");
        handleClear("", "output");
      }
    }
  }, [
    automaticStartParaphrasing,
    userInputValue,
    language,
    selectedMode,
    selectedSynonyms,
    user?.package,
  ]); // All the dependencies that should trigger re-paraphrasing are listed here.

  useEffect(() => {
    const API_BASE =
      ENV.api_url +
      `/${ENV.paraphrase_redirect_prefix}/api`;

    const getHistoryDetails = async () => {
      setIsLoading(true);

      try {
        const res = await fetch(`${API_BASE}/history/${activeHistory?._id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
          },
        });
        if (!res.ok) return console.error("Failed to fetch history details");
        const data = await res.json();


        setActiveHistoryDetails(data);

        const capitalize = (str) =>
          typeof str === "string" && str.length > 0
            ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
            : str;

        if (data?.payload?.language) setLanguageState(data?.payload?.language);
        if (data?.payload?.mode)
          setSelectedModeState(capitalize(data.payload.mode));
        if (data?.payload?.synonym)
          setSelectedSynonymsState(capitalize(data.payload.synonym));
        if (data?.payload?.text) setUserInputState(data?.payload?.text);
        frozenWords.reset(data?.payload?.freeze?.split(",") || []);

        if (data?.response) {
          function mapBackendIndexToResultIndex(backendIndex, result) {
            const sentenceSlots = [];
            result.forEach((seg, idx) => {
              if (!(seg.length === 1 && seg[0].type === "newline"))
                sentenceSlots.push(idx);
            });
            return sentenceSlots[backendIndex] ?? -1;
          }

          if (data?.response?.plain) {
            const accumulatedText = data?.response?.plain || "";

            setOutputContend(accumulatedText);

            const lines = accumulatedText.split(/\r?\n/);
            const sentenceSeparator =
              language === "Bangla"
                ? /(?:।\s+|\.\r?\n+)/
                : /(?:\.\s+|\.\r?\n+)/;

            const newResult = [];
            lines.forEach((line) => {
              if (!line.trim()) {
                newResult.push([{ word: "\n", type: "newline", synonyms: [] }]);
              } else {
                line
                  .split(sentenceSeparator)
                  .filter(Boolean)
                  .forEach((sentence) => {
                    const words = sentence
                      .trim()
                      .split(/\s+/)
                      ?.map((w) => ({
                        word: w,
                        type: "none",
                        synonyms: [],
                      }));
                    newResult.push(words);
                  });
              }
            });
            setResult(newResult);
            dispatch(
              setParaphraseValues({
                type: "output",
                values: { text: accumulatedText },
              }),
            );
          }

          if (data?.response?.tagging) {
            data?.response?.tagging?.forEach((item, index) => {
              let parsed = item?.data || [];
              let backendIndex = item?.index;
              let eid;

              setResult((prev) => {
                const updated = [...prev];
                const targetIdx = mapBackendIndexToResultIndex(
                  backendIndex,
                  prev,
                );
                if (targetIdx < 0) {
                  return prev;
                }

                updated[targetIdx] = parsed?.map((item) => ({
                  ...item,
                  word: item.word.replace(/[{}]/g, ""),
                }));
                return updated;
              });
            });
          }

          if (data?.response?.synonyms) {
            data?.response?.synonyms?.forEach((item, index) => {
              let parsed = item?.data || [];
              let backendIndex = item?.index;
              let eid;

              setResult((prev) => {
                const updated = [...prev];
                const targetIdx = mapBackendIndexToResultIndex(
                  backendIndex,
                  prev,
                );
                if (targetIdx < 0) {
                  return prev;
                }

                updated[targetIdx] = parsed?.map((item) => ({
                  ...item,
                  word: item.word.replace(/[{}]/g, ""),
                }));
                return updated;
              });
            });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (!!activeHistory?._id) {
      getHistoryDetails();
    }
  }, [activeHistory]);

  function extractPlainText(array) {
    // Check if input is an array
    if (!Array.isArray(array)) {
      return null;
    }

    let allSegments = []; // Renamed for clarity, as it holds both sentences and newlines

    // Iterate through each segment (which can be a sentence array or a newline indicator)
    for (const segment of array) {
      // Check if segment is an array
      if (!Array.isArray(segment)) {
        console.error("Each segment must be an array");
        return null;
      }

      // Handle newline segments separately to preserve their structure
      if (segment.length === 1 && segment[0].type === "newline") {
        allSegments.push("\n");
        continue; // Move to the next segment
      }

      const wordsInCurrentSegment = [];
      // Process each word object in the current segment
      for (const wordObj of segment) {
        // Validate word object structure
        if (!wordObj || typeof wordObj !== "object") {
          console.error("Invalid word object in segment");
          return null;
        }
        // Check if word property exists and is a string
        if (typeof wordObj.word !== "string") {
          console.error("Word property must be a string");
          return null;
        }
        wordsInCurrentSegment.push(wordObj.word);
      }
      // Join words within the current segment with a single space
      allSegments.push(wordsInCurrentSegment.join(" "));
    }

    // Join all processed segments (sentences and newlines) with a space.
    // This ensures words are correctly spaced. The normalizePunctuationSpacing
    // function will then handle any excess spaces and punctuation-specific spacing.
    let plainText = allSegments.join(" ");

    // Apply the punctuation spacing normalization as the final cleanup step
    plainText = normalizePunctuationSpacing(plainText);

    return plainText;
  }

  // Frozen words logic
  const stableFrozenWords = useMemo(() => {
    // Created a sorted array from the set and join it into a string.
    // This string will only change if the contents of the set change.
    return Array.from(frozenWords.set).sort().join(",");
  }, [frozenWords]); // This calculation only re-runs when frozenWords changes

  // This effect is to extract freeze recommendations from userQuery
  useEffect(() => {
    if (!userInput) {
      setRecommendedFreezeWords([]);
      return;
    }

    // 

    // A simple function to get unique, non-trivial words
    const getWords = userInput
      .toLowerCase()
      .replace(/[.,!?"']/g, "") // Remove basic punctuation
      .split(/\s+/)
      .filter((word) => word.length > 3); // Filter out very short words

    const uniqueWords = [...new Set(getWords)];

    // Filter out any words that are already in the frozen set.
    const availableWords = uniqueWords.filter(
      (word) => !frozenWords.set.has(word),
    );

    // Select up to 5 random words for recommendation
    const randomWords = availableWords
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    // 

    setRecommendedFreezeWords(randomWords);
  }, [userInputValue, stableFrozenWords]); // This effect runs whenever userInput, frozenWords changes

  return (
    <div className="flex w-full overflow-hidden pt-2">
      {!isMobile && (
        <div className="mr-2 w-min flex-0 transition-[width] duration-200">
          <FileHistorySidebar fetchFileHistories={fetchFileHistories} />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-0">
        {showDemo && !isMobile ? <Onboarding /> : null}

        <div className="hidden w-full flex-none items-center md:flex">
          <LanguageMenu
            isLoading={isLoading || processing.loading}
            setLanguage={setLanguage}
            language={language}
          />
          <div className="ml-auto hidden items-center gap-2 md:flex lg:gap-4">
            <InlineUsageBadge tool="paraphrase" />
            <STEMSafeBadge active={hasStemContent && paraphraseOptions.stemSafeMode !== false && paidUser} stemStats={stemStats} />
            <AutoFreezeSettings />
            <AutoParaphraseSettings />
          </div>
        </div>

        {process.env.NODE_ENV === "development" && <SocketDebug />}
        <div className="flex w-full flex-col gap-5 lg:gap-8">
          <Card className="border-border mt-0 flex w-full min-w-0 flex-1 flex-col gap-0 overflow-visible rounded-[12px] rounded-tl-none border py-0">
            <div className="border-border flex items-center border-b px-2 py-1 md:hidden">
              <LanguageMenu
                isLoading={isLoading}
                setLanguage={setLanguage}
                language={language}
              />
              <Menubar className="ml-auto border-0 bg-transparent p-0 shadow-none">
                <MenubarMenu>
                  <MenubarTrigger className="p-2">
                    <MoreVertical className="h-4 w-4" />
                  </MenubarTrigger>
                  <MenubarContent
                    align="end"
                    className="!max-w-[5rem] px-2 pt-1 pb-2"
                  >
                    <VerticalMenu
                      selectedMode={selectedMode}
                      setSelectedMode={setSelectedMode}
                      outputText={result}
                      setOutputText={setResult}
                      freezeWords={[
                        ...(frozenWords?.values || []),
                        ...(frozenPhrases?.values || []),
                      ]
                        .filter(Boolean)
                        .join(", ")}
                      text={userInput}
                      selectedLang={language}
                      highlightSentence={highlightSentence}
                      setHighlightSentence={setHighlightSentence}
                      plainOutput={extractPlainText(result)}
                      selectedSynonymLevel={selectedSynonyms}
                      mobile={isMobile}
                      fetchFileHistories={fetchFileHistories}
                    />
                  </MenubarContent>
                </MenubarMenu>
              </Menubar>
            </div>

            <div className="hidden lg:block">
              {isDesktop && (
                <ModeNavigation
                  selectedMode={selectedMode}
                  setSelectedMode={setSelectedMode}
                  userPackage={user?.package}
                  selectedSynonyms={selectedSynonyms}
                  setSelectedSynonyms={setSelectedSynonyms}
                  SYNONYMS={SYNONYMS}
                  setShowMessage={setShowMessage}
                  isLoading={processing.loading}
                  accessToken={accessToken}
                  dispatch={dispatch}
                  setShowLoginModal={setShowLoginModal}
                />
              )}
            </div>

            <Separator className="hidden py-0 lg:block" />

            {enableSimplifiedParaphraseUI ? (
              <VariationPresetBar
                presets={PARAPHRASE_VARIATION_PRESETS}
                activePresetId={activeVariationPreset?.id}
                onApplyPreset={handleApplyVariationPreset}
              />
            ) : null}

            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div
                className={cn(
                  "relative flex flex-col pb-1",
                  "border-b lg:border-r lg:border-b-0",
                  "border-border rounded-bl-lg",
                  "bg-card dark:bg-transparent",
                  "h-[calc(100vh-380px)] max-h-[500px] min-h-[450px]",
                )}
              >
                <UserInputBox
                  wordLimit={wordLimit}
                  setUserInput={setUserInputState}
                  userInput={userInput}
                  frozenPhrases={frozenPhrases}
                  frozenWords={frozenWords}
                  user={user}
                  useYellowHighlight={useYellowHighlight}
                  highlightSentence={highlightSentence}
                  language={language}
                  hasOutput={hasOutput}
                  onFreezeWord={handleFreezeWord}
                  onFreezePhrase={handleFreezePhrase}
                />

                {!userInput ? (
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <div className="pointer-events-auto flex flex-col items-center">
                      <UserActionInput
                        setUserInput={setUserInputState}
                        sampleText={sampleText}
                        disableTrySample={!hasSampleText}
                        isMobile={isMobile}
                      />
                    </div>
                  </div>
                ) : null}

                <WordCounter
                  freeze_props={{
                    recommendedWords: recommendedFreezeWords,
                    frozenWords: Array.from(frozenWords.set),
                    frozenPhrases: Array.from(frozenPhrases.set),
                    onAddWords: (words) =>
                      words.forEach((w) => handleFreezeWord(w)),
                    onAddPhrases: (phrases) =>
                      phrases.forEach((p) => handleFreezePhrase(p)),
                    onRemoveWord: (w) => frozenWords.remove(w),
                    onRemovePhrase: (p) => frozenPhrases.remove(p),
                    onClearAll: () => {
                      frozenWords.reset(initialFrozenWords);
                      frozenPhrases.reset(initialFrozenPhrase);
                    },
                  }}
                  btnText={enableSimplifiedParaphraseUI ? "Paraphrase" : outputContend ? "Rephrase" : "Paraphrase"}
                  handleClearInput={() => handleClear("", "all")}
                  handleSubmit={handleSubmit}
                  isLoading={isLoading}
                  btnDisabled={isAutoFreezeDetecting}
                  userInput={userInput}
                  userPackage={user?.package}
                  toolName="paraphrase"
                  btnIcon={isMobile ? null : <FileIcon className="h-4 w-4" />}
                  dontDisable={true}
                  sticky={320}
                  freeze_modal={true}
                  detectingFreezeTerms={isAutoFreezeDetecting}
                />

                {enableSimplifiedParaphraseUI && statusChip ? (
                  <div className="px-4 pb-2">
                    <InlineStatusChip status={statusChip.status} label={statusChip.label} />
                  </div>
                ) : null}

                {showLanguageDetect && (
                  <div className="border-border bg-background absolute bottom-20 left-5 flex items-center gap-2 rounded-md border p-2">
                    <p className="text-sm">Detected Language:</p>
                    <Button
                      variant="outline"
                      size="sm"
                      data-rybbit-event="Language Choose"
                      data-rybbit-prop={language}
                    >
                      {language}
                    </Button>
                  </div>
                )}
              </div>

              <div
                ref={outputRef}
                className={cn(
                  "relative flex flex-col",
                  "h-[calc(100vh-380px)] max-h-[500px] min-h-[450px]",
                  "overflow-hidden",
                  "border-border rounded-br-lg border-t md:border-t-0",
                  "bg-card dark:bg-transparent",
                )}
              >
                <div className="border-border relative z-20 block border-b lg:hidden">
                  {!isDesktop && (
                    <ModeNavigation
                      selectedMode={selectedMode}
                      setSelectedMode={setSelectedMode}
                      userPackage={user?.package}
                      selectedSynonyms={selectedSynonyms}
                      setSelectedSynonyms={setSelectedSynonyms}
                      SYNONYMS={SYNONYMS}
                      setShowMessage={setShowMessage}
                      isLoading={processing.loading}
                      accessToken={accessToken}
                      dispatch={dispatch}
                      setShowLoginModal={setShowLoginModal}
                    />
                  )}
                </div>

                {enableSimplifiedParaphraseUI ? (
                  <SimplifiedParaphrasePanel
                    output={outputContend}
                    inlineError={inlineError}
                    onRetry={() => handleSubmit(userInput)}
                    qualityAssessment={qualityAssessment}
                    accessToken={accessToken}
                    inputText={userInput}
                    selectedMode={selectedMode}
                    selectedSynonyms={selectedSynonyms}
                    writingStudioIntent={activeVariationPreset?.intent || "book"}
                  />
                ) : (
                  <>
                    <ParaphraseOutput
                      data={result}
                      setData={setResult}
                      synonymLevel={selectedSynonyms}
                      dataModes={modes}
                      userPackage={user?.package}
                      selectedLang={language}
                      highlightSentence={highlightSentence}
                      setHighlightSentence={setHighlightSentence}
                      setOutputHistory={setOutputHistory}
                      input={userInput}
                      freezeWords={[
                        ...(frozenWords?.values || []),
                        ...(frozenPhrases?.values || []),
                      ]
                        .filter(Boolean)
                        .join(", ")}
                      socketId={socketId}
                      language={language}
                      setProcessing={setProcessing}
                      eventId={eventId}
                      setEventId={setEventId}
                      paraphraseRequestCounter={paraphraseRequestCounter}
                      eventIdRef={eventIdRef}
                      socketIdRef={socketIdRef}
                    />

                    {result?.length ? (
                      <OutputBotomNavigation
                        handleClear={() => handleClear("", "output")}
                        highlightSentence={highlightSentence}
                        outputContend={outputContend}
                        outputHistory={outputHistory}
                        outputHistoryIndex={outputHistoryIndex}
                        outputWordCount={outputWordCount}
                        inputWordCount={userInput.trim() ? userInput.trim().split(/\s+/).filter(Boolean).length : 0}
                        proccessing={processing}
                        sentenceCount={result.length}
                        setHighlightSentence={setHighlightSentence}
                        setOutputHistoryIndex={setOutputHistoryIndex}
                      />
                    ) : null}
                  </>
                )}

                {showMessage.show &&
                  isModeLockedForUser(showMessage.Component, user?.package) ? (
                  <UpdateComponent Component={showMessage.Component} />
                ) : null}
              </div>
            </div>
          </Card>

          {/* Mobile menu moved to DropdownMenu in header */}
        </div>
      </div>

      <div className="ml-2 hidden w-min flex-0 transition-[width] duration-200 md:block lg:mt-7">
        <VerticalMenu
          selectedMode={selectedMode}
          outputText={result}
          setOutputText={setResult}
          setSelectedMode={setSelectedMode}
          freezeWords={[
            ...(frozenWords?.values || []),
            ...(frozenPhrases?.values || []),
          ]
            .filter(Boolean)
            .join(", ")}
          plainOutput={extractPlainText(result)}
          text={userInput}
          selectedLang={language}
          highlightSentence={highlightSentence}
          setHighlightSentence={setHighlightSentence}
          selectedSynonymLevel={selectedSynonyms}
          fetchFileHistories={fetchFileHistories}
        />
      </div>

      <MultipleFileUpload
        isMobile={isMobile}
        setInput={() => { }}
        paidUser={paidUser}
        freezeWords={[]}
        selectedMode={selectedMode}
        shouldShowButton={false}
      />

      <Dialog
        open={confirmationDialog.open}
        onOpenChange={(open) =>
          setConfirmationDialog(
            open
              ? confirmationDialog
              : { open: false, word: "", count: 0, action: null },
          )
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Freeze Multiple Occurrences?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p>
              The word/phrase appears{" "}
              <strong>{confirmationDialog.count} times</strong> in your text.
            </p>
            <p>
              Freezing this will prevent all {confirmationDialog.count}{" "}
              occurrences from being paraphrased. Do you want to continue?
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() =>
                setConfirmationDialog({
                  open: false,
                  word: "",
                  count: 0,
                  action: null,
                })
              }
            >
              Cancel
            </Button>
            <Button onClick={confirmationDialog.action}>
              Freeze All {confirmationDialog.count}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ParaphraseContend;
