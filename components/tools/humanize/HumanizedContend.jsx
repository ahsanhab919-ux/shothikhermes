"use client";

import { trySamples } from "@/_mock/trySamples";
import { trackEvent } from "@/analysers/eventTracker";
import { trackToolUsed } from "@/lib/posthog";
import InitialInputActions from "@/components/(primary-layout)/(summarize-page)/SummarizeContentSection/InitialInputActions";
import ButtonInsertDocumentText from "@/components/buttons/ButtonInsertDocumentText";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import useResponsive from "@/hooks/ui/useResponsive";
import useDebounce from "@/hooks/useDebounce";
import useLoadingText from "@/hooks/useLoadingText";
import useWordLimit from "@/hooks/useWordLimit";
import { cn } from "@/lib/utils";
import { useGetAllHistoryQuery } from "@/redux/api/humanizeHistory/humanizeHistory";
import { useHumanizeContendMutation } from "@/redux/api/tools/toolsApi";
import { setShowLoginModal } from "@/redux/slices/auth";
import { setAlertMessage, setShowAlert } from "@/redux/slices/tools";
import { History, Keyboard, MessageSquare, MoreVertical, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import LanguageMenu from "../grammar/LanguageMenu";
import SettingsSidebar from "../paraphrase/settings/SettingsSidebar";
import AlertDialogMessage from "./AlertDialogMessage";
import AnimatedLoader from "./AnimatedLoader";
import GPTsettings from "./GPTsettings";
import GPTsettingSidebar from "./GPTsettingSidebar";
import HumanizeScrores from "./HumanizeScrores";
import InputBottom from "./InputBottom";
import Navigations from "./Navigations";
import OutputNavigation from "./OutputNavigation";
import TopNavigation from "./TopNavigation";

const LENGTH = {
  20: "Basic",
  40: "Intermediate",
  60: "Advanced",
  80: "Expert",
};

const HumanizedContend = () => {
  const [currentLength, setCurrentLength] = useState(LENGTH[20]);
  const [showShalowAlert, setShalowAlert] = useState(false);
  const [outputContent, setOutputContent] = useState([]);
  const [humanizeContend] = useHumanizeContendMutation();
  const miniLabel = useResponsive("between", "md", "xl");
  const { user } = useSelector((state) => state.auth);
  const { automaticStartHumanize } = useSelector(
    (state) => state.settings.humanizeOptions,
  );

  // Humanize history
  const { data: allHumanizeHistory, refetch: refetchAllHumanizeHistory } =
    useGetAllHistoryQuery();

  const [language, setLanguage] = useState("English (US)");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const loadingText = useLoadingText(isLoading);
  const [showIndex, setShowIndex] = useState(0);
  const isMobile = useResponsive("down", "sm");
  const { wordLimit } = useWordLimit("bypass");
  const [update, setUpdate] = useState(false);
  const [model, setModel] = useState("Panda");
  const [scores, setScores] = useState([]);
  const [isRestoredFromHistory, setIsRestoredFromHistory] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  // Ref to track if we're currently restoring from history
  const isRestoring = useRef(false);

  const sampleText = useMemo(() => {
    const langkey =
      language && language.startsWith("English") ? "English" : language;
    return trySamples.humanize[langkey] || null;
  }, [language]);
  const hasSampleText = Boolean(sampleText);

  function handleClear() {
    setUserInput("");
    setScores([]);
    setShowIndex(0);
    setOutputContent([]);
    setIsRestoredFromHistory(false);
  }

  const handleAiDetectors = (text) => {
    if (!text) return;

    setLoadingAi(true);

    sessionStorage.setItem("ai-detect-content", JSON.stringify(text));
    router.push("/ai-detector");
  };

  /**
   * Check if history entry parameters match current settings
   */
  const canRestoreFromHistory = (entry) => {
    if (!entry || !entry.outputs || entry.outputs.length === 0) {
      return false;
    }


    const modelMatches = entry.model?.toLowerCase() === model.toLowerCase();
    const levelMatches = entry.level === currentLength;
    const languageMatches = entry.language === language;

    return modelMatches && levelMatches && languageMatches;
  };

  /**
   * Handle history entry selection with smart restoration
   */
  const handleHistorySelect = (entry) => {
    try {
      // Set the restoring flag to prevent auto-humanize from triggering
      isRestoring.current = true;

      const canRestore = canRestoreFromHistory(entry);

      if (canRestore) {
        // Restore everything from history
        setUserInput(entry.text);
        setOutputContent(entry.outputs);
        setScores(
          entry.outputs.map((output) => output.aiPercentage || output.score),
        );
        setShowIndex(0);
        setIsRestoredFromHistory(true);

        // Show success feedback
        toast.success("Content restored from history");
      } else {
        // Parameters don't match - only set input and clear outputs
        setUserInput(entry.text);
        setOutputContent([]);
        setScores([]);
        setShowIndex(0);
        setIsRestoredFromHistory(false);

        // Inform user about parameter mismatch
        const mismatchReasons = [];
        if (entry.model?.toLowerCase() !== model.toLowerCase()) {
          mismatchReasons.push(`model changed from ${entry.model} to ${model}`);
        }
        if (entry.level !== currentLength) {
          mismatchReasons.push(
            `level changed from ${entry.level} to ${currentLength}`,
          );
        }
        if (entry.language !== language) {
          mismatchReasons.push(
            `language changed from ${entry.language} to ${language}`,
          );
        }

        if (mismatchReasons.length > 0) {
          toast.info(
            `Settings changed (${mismatchReasons.join(", ")}). Please regenerate.`,
          );
        }
      }

      // Reset the flag after a short delay to allow state updates to complete
      setTimeout(() => {
        isRestoring.current = false;
      }, 100);
    } catch (error) {
      console.error("Error restoring history:", error);
      toast.error("Failed to restore history entry");
      isRestoring.current = false;
    }
  };

  const handleSubmit = useCallback(async () => {
    try {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("shothik_tool_submit", { detail: { tool: "humanize" } }));
      }

      trackEvent("click", "humanize", "humanize_click", 1);

      setLoadingAi(true);
      setIsLoading(true);
      setOutputContent([]);
      setScores([]);
      setShowIndex(0);
      setIsRestoredFromHistory(false);

      let text = userInput;

      const payload = {
        text,
        model: model.toLowerCase(), // Ensure model is lowercase: "panda" or "raven"
        level: currentLength,
        language,
      };

      const data = await humanizeContend(payload).unwrap();

      if (!data.output?.length) {
        throw {
          data: { error: "NOT_FOUND", message: "No humanized content found. Please try again with different text." },
        };
      }


      // const scores = data.output.map((item) => item.score); // human scroe
      const scores = data.output.map(
        (item) => item?.aiPercentage || item?.score,
      ); // ai score
      // 
      setOutputContent(data.output);
      setScores(scores);
      setUpdate((prev) => !prev);

      const wc = userInput.split(/\s+/).filter((w) => w.length > 0).length;
      trackToolUsed("humanize", wc);

      // After generating humanized content, refetch history to maintain fresh data
      refetchAllHumanizeHistory();
    } catch (err) {
      if (err?.name === "UsageLimitError" || err?.code === "USAGE_LIMIT_EXCEEDED") {
        dispatch(setShowAlert(true));
        dispatch(setAlertMessage(`You've reached your ${err.tier || "free"} plan limit. Upgrade your plan for more usage.`));
        setLoadingAi(false);
        setIsLoading(false);
        return;
      }
      const error = err?.data;
      const reg = /LIMIT_REQUEST|PACAKGE_EXPIRED|WORD_COUNT_LIMIT_REQUEST/;
      if (reg.test(error?.error)) {
        dispatch(setShowAlert(true));
        dispatch(setAlertMessage(error?.message));
      } else if (error?.error === "UNAUTHORIZED") {
        dispatch(setShowLoginModal(true));
      } else {
        toast.error(error?.message);
      }
    } finally {
      setLoadingAi(false);
      setIsLoading(false);
    }
  }, [
    userInput,
    model,
    currentLength,
    language,
    humanizeContend,
    dispatch,
    refetchAllHumanizeHistory,
  ]);

  const debounceHumanizeProcess = useDebounce(userInput, 1000);

  /**
   * Auto-humanize effect with restoration protection
   */
  useEffect(() => {
    // Skip if automatic start is disabled
    if (!automaticStartHumanize) return;

    // Skip if we're currently restoring from history
    if (isRestoring.current) return;

    // Skip if already have outputs (restored or generated)
    if (outputContent.length > 0) return;

    // Only trigger if there's user input
    if (userInput) {
      handleSubmit();
    }
  }, [
    automaticStartHumanize,
    debounceHumanizeProcess,
    handleSubmit,
    outputContent.length,
  ]);

  /**
   * Effect to auto-trigger humanize when model changes (Panda/Raven tabs)
   * This helps users immediately see the difference between models
   */
  const prevSettingsRef = useRef({ model, currentLength, language });
  const isFirstRender = useRef(true);
  const modelChangeTriggeredRef = useRef(false);

  useEffect(() => {
    // Skip on initial mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevSettingsRef.current = { model, currentLength, language };
      return;
    }

    // Check if settings actually changed
    const modelChanged = prevSettingsRef.current.model !== model;
    const levelChanged =
      prevSettingsRef.current.currentLength !== currentLength;
    const languageChanged = prevSettingsRef.current.language !== language;
    const settingsChanged = modelChanged || levelChanged || languageChanged;

    if (!settingsChanged) {
      return;
    }

    // Check if model is locked (Raven for free users)
    const isModelLocked =
      model === "Raven" && !/value_plan|pro_plan|unlimited/.test(user?.package);

    // Clear output when settings change
    if (outputContent.length > 0) {
      setOutputContent([]);
      setScores([]);
      setShowIndex(0);
      setIsRestoredFromHistory(false);
    }

    // Auto-trigger humanize when model or level changes (if conditions are met)
    const shouldAutoTrigger =
      (modelChanged || levelChanged) && // Auto-trigger on model or level change
      userInput?.trim() && // User has input text
      !isRestoring.current && // Not restoring from history
      !isLoading; // Not already loading

    if (shouldAutoTrigger) {
      // Use a small delay to ensure state updates are complete
      modelChangeTriggeredRef.current = true;
      setTimeout(() => {
        if (modelChangeTriggeredRef.current) {
          handleSubmit();
          modelChangeTriggeredRef.current = false;
        }
      }, 100);
    }

    // Update ref for next comparison
    prevSettingsRef.current = { model, currentLength, language };
  }, [
    model,
    currentLength,
    language,
    userInput,
    user?.package,
    outputContent.length,
    isLoading,
    handleSubmit,
  ]);

  return (
    <div className="flex flex-col">
      <div className="flex w-full">
        <div className="w-full">
          {/* Language Menu - Desktop: Above cards, Mobile: Inside card */}
          <div className="hidden w-full flex-none items-center md:flex">
            <LanguageMenu
              isLoading={isLoading}
              setLanguage={setLanguage}
              language={language}
            />
          </div>

          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            <div>
              <Card className="relative flex h-[calc(100vh-280px)] max-h-[600px] min-h-[400px] flex-col gap-0 overflow-visible rounded-none rounded-r-xl rounded-bl-xl shadow-sm p-0">
                {/* Language Menu - Mobile: Inside card */}
                <div className="border-border flex items-center border-b px-2 py-1 md:hidden">
                  <LanguageMenu
                    isLoading={isLoading}
                    setLanguage={setLanguage}
                    language={language}
                  />
                  <div className="ml-auto">
                    <DropdownMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="cursor-pointer"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        align="end" 
                        className="w-56 rounded-lg shadow-lg"
                        sideOffset={8}
                      >
                        <DropdownMenuItem
                          onClick={() => {
                            setShowSidebar("gpt-history");
                            setMobileMenuOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          <History className="mr-2 h-4 w-4" />
                          <span>History</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setShowSidebar("settings");
                            setMobileMenuOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setShowSidebar("feedback");
                            setMobileMenuOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          <span>Feedback</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setShowSidebar("shortcuts");
                            setMobileMenuOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          <Keyboard className="mr-2 h-4 w-4" />
                          <span>Hotkeys</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <TopNavigation
                  model={model}
                  setModel={setModel}
                  setShalowAlert={setShalowAlert}
                  userPackage={user?.package}
                  LENGTH={LENGTH}
                  currentLength={currentLength}
                  setCurrentLength={setCurrentLength}
                />
                <Textarea
                  name="input"
                  aria-label="Enter text to humanize"
                  role="textbox"
                  rows={13}
                  placeholder="Enter your text here..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  disabled={showShalowAlert}
                  className={cn(
                    "flex-grow resize-none border-0 focus-visible:ring-0",
                    "text-left break-words whitespace-normal",
                    "text-base md:text-base",
                  )}
                />
                {!userInput ? (
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <div className="pointer-events-auto flex flex-col items-center">
                      <InitialInputActions
                        className={"flex-nowrap"}
                        setInput={(text) => {
                          setUserInput(text);
                        }}
                        sample={sampleText}
                        showSample={hasSampleText}
                        showPaste={true}
                        showInsertDocument={false}
                      />
                      <div className="mt-1">
                        <ButtonInsertDocumentText
                          key="insert-document"
                          onApply={(value) => setUserInput(value)}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <InputBottom
                    handleClear={handleClear}
                    isLoading={isLoading}
                    isMobile={isMobile}
                    miniLabel={miniLabel}
                    userInput={userInput}
                    userPackage={user?.package}
                    setWordCount={setWordCount}
                  />
                )}
              </Card>

              <Navigations
                hasOutput={outputContent.length}
                isLoading={isLoading}
                isMobile={isMobile}
                miniLabel={miniLabel}
                model={model}
                userInput={userInput}
                wordCount={wordCount}
                wordLimit={wordLimit}
                handleAiDitectors={handleAiDetectors}
                handleSubmit={handleSubmit}
                loadingAi={loadingAi}
                userPackage={user?.package}
                update={update}
              />

              {scores.length ? (
                <HumanizeScrores
                  isMobile={isMobile}
                  loadingAi={loadingAi}
                  scores={scores}
                  showIndex={showIndex}
                />
              ) : null}
            </div>

            <div>
              {/* output */}
              <Card className="relative h-[calc(100vh-280px)] max-h-[600px] min-h-[400px] overflow-y-auto shadow-sm p-4">
                {/* Restored from history indicator */}
                {/* {isRestoredFromHistory && outputContent.length > 0 && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      zIndex: 1,
                    }}
                  >
                    <Chip
                      label="📚 Restored from history"
                      size="small"
                      color="info"
                      variant="outlined"
                      sx={{ fontSize: "0.75rem" }}
                    />
                  </Box>
                )} */}

                <div aria-live="polite">
                {outputContent[showIndex] ? (
                  <p className="text-base whitespace-pre-line">
                    {outputContent[showIndex].text}
                  </p>
                ) : (
                  <>
                    {isLoading ? (
                      <div className="flex h-full items-center justify-center" role="status">
                        <AnimatedLoader isLoading={isLoading} />
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Humanized Content</p>
                    )}
                  </>
                )}
                </div>

                {showShalowAlert ? (
                  <AlertDialogMessage onClose={() => setShalowAlert(false)} />
                ) : null}
              </Card>

              {outputContent.length ? (
                <OutputNavigation
                  isMobile={isMobile}
                  outputs={outputContent.length}
                  selectedContend={outputContent[showIndex]?.text}
                  setShowIndex={setShowIndex}
                  showIndex={showIndex}
                  handleAiDetectors={handleAiDetectors}
                  loadingAi={loadingAi}
                />
              ) : null}
            </div>
          </div>
        </div>

        {/* GPT options (e.g: history, settings) */}
        {/* This will be for DESKTOP */}
        <div className="mt-8 ml-4 hidden w-min flex-none md:block">
          <GPTsettings
            handleHistorySelect={handleHistorySelect}
            allHumanizeHistory={allHumanizeHistory?.data}
            refetchHistory={refetchAllHumanizeHistory}
          />
        </div>

        {/* Mobile sidebar for options */}
        <Sheet open={!!showSidebar} onOpenChange={() => setShowSidebar(false)}>
          <SheetContent
            side="right"
            className="w-full sm:max-w-[400px] [&>button.absolute]:hidden"
          >
            {["gpt-history"].includes(showSidebar) && (
              <GPTsettingSidebar
                open={showSidebar}
                onClose={() => setShowSidebar(false)}
                active={showSidebar}
                setActive={setShowSidebar}
                allHumanizeHistory={allHumanizeHistory?.data}
                refetchHistory={refetchAllHumanizeHistory}
                handleHistorySelect={handleHistorySelect}
              />
            )}

            {["settings", "feedback", "shortcuts"].includes(showSidebar) && (
              <SettingsSidebar
                open={showSidebar}
                onClose={() => setShowSidebar(false)}
                tab={showSidebar}
                setTab={setShowSidebar}
                mobile={true}
                fromComp="humanize"
              />
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default HumanizedContend;
