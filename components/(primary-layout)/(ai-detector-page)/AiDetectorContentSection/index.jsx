"use client";

import { trySamples } from "@/_mock/trySamples";
import { trackEvent } from "@/analysers/eventTracker";
import LoadingScreen from "@/components/common/LoadingScreen";
import ShareAiDetectorModal from "@/components/share/ShareAiDetectorModal";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useIsDark from "@/hooks/ui/useIsDark";
import useScreenSize from "@/hooks/ui/useScreenSize";
import useLoadingText from "@/hooks/useLoadingText";
import { cn } from "@/lib/utils";
import {
  useGetShareAidetectorContendQuery,
  useGetUsesLimitQuery,
  useScanAidetectorMutation,
} from "@/redux/api/tools/toolsApi";
import {
  setIsSectionbarOpen,
  setSections,
  setSectionsGroups,
  setSectionsMeta,
  setSelectedSection,
} from "@/redux/slices/ai-detector-slice";
import { setShowLoginModal } from "@/redux/slices/auth";
import { setAlertMessage, setShowAlert } from "@/redux/slices/tools";
import {
  fetchAiDetectorSection,
  fetchAiDetectorSections,
} from "@/services/ai-detector.service";
import { preprocessText, detectSTEMContent } from "@/services/stemPreprocessor";
import { useTranslation } from "@/i18n";
import { FileText } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import AiDetectorSectionbar from "./AiDetectorSectionbar";
import { getColorByPerplexity } from "./helpers/pdfHelper";
import InitialInputActions from "./InitialInputActions";
import InputActions from "./InputActions";
import OutputResult from "./OutputResult";
import SampleText from "./SampleText";
import UsesLimitBar from "./UsesLimitBar";

const dataGroupsByPeriod = (histories = []) => {
  if (!Array.isArray(histories) || histories.length === 0) return [];

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const groups = histories.reduce((acc, entry) => {
    if (!entry?.timestamp) return acc;

    const d = new Date(entry.timestamp);
    const m = d.getMonth();
    const y = d.getFullYear();
    const monthName = d.toLocaleString("default", { month: "long" });
    const key =
      m === currentMonth && y === currentYear
        ? "This Month"
        : `${monthName} ${y}`;

    if (!acc?.[key]) acc[key] = [];
    acc?.[key]?.push({
      ...(entry || {}),
      _id: entry?._id,
      text: entry?.text,
      time: entry?.timestamp,
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

const AiDetectorContentSection = () => {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(null);

  const [openSampleDrawer, setOpenSampleDrawer] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const [scanAidetector] = useScanAidetectorMutation();

  const [enableEdit, setEnableEdit] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const searchParams = useSearchParams();
  const share_id = searchParams.get("share_id");
  const sectionId = searchParams.get("section");
  const dispatch = useDispatch();
  const loadingText = useLoadingText(isLoading);
  const isDark = useIsDark();
  const { width } = useScreenSize();

  const minCharacters = 250;
  const [mobileTab, setMobileTab] = useState("editor");
  const isMobile = width <= 1024;

  const [excludeLatex, setExcludeLatex] = useState(false);
  const [excludeCode, setExcludeCode] = useState(false);

  const stemDetection = useMemo(() => {
    if (!text) return { hasLatex: false, hasCode: false, latexCount: 0, codeBlockCount: 0 };
    return detectSTEMContent(text);
  }, [text]);

  useEffect(() => {
    const detection = detectSTEMContent(text);
    if (detection.hasLatex && !excludeLatex) {
      setExcludeLatex(true);
    }
    if (detection.hasCode && !excludeCode) {
      setExcludeCode(true);
    }
  }, [text, excludeLatex, excludeCode]);

  const preprocessResult = useMemo(() => {
    return preprocessText(text, {
      excludeLatex,
      excludeCode,
      excludeReferences: false,
      excludeQuotes: false,
    });
  }, [text, excludeLatex, excludeCode]);

  const { user } = useSelector((state) => state.auth);
  const router = useRouter();

  const [isCurrentSection, setIsCurrentSection] = useState(false);

  const {
    isCheckLoading,
    isRecommendationLoading,
    language,
    // text,
    score,
    scores,
    issues,
    selectedIssue,
    recommendations,
    isSidebarOpen,
    isSectionbarOpen,
    sections,
    selectedSection,
    selectedTab,
  } = useSelector((state) => state.ai_detector) || {};

  const { data: shareContend, isLoading: isContendLoading } =
    useGetShareAidetectorContendQuery(share_id, {
      skip: !share_id,
    });

  const { data: limit, refetch } = useGetUsesLimitQuery({
    service: "ai-detector",
  });
  const [sessionContent, setSessionContent] = useState(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("ai-detect-content");
      if (stored) setSessionContent(JSON.parse(stored));
    } catch {}
  }, []);

  const pathname = usePathname();

  const setResultToState = (result) => {
    if (!result) return;
    setResult({
      ...result,
      aiSentences: result?.sentences?.filter(
        (sentence) => sentence?.highlight_sentence_for_ai,
      ),
      humanSentences: result?.sentences?.filter(
        (sentence) => !sentence.highlight_sentence_for_ai,
      ),
    });
  };

  // URL parameter management
  const setSectionId = useCallback(
    (newId) => {
      if (!newId) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set("section", newId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const removeSectionId = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("section");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (!shareContend) return;
    const { result, history } = shareContend;

    if (!result) return;

    setText(history?.text || "");
    setHistory(history);
    setResultToState(history?.result || result);

    setEnableEdit(false);
  }, [shareContend]);

  const handleSubmit = async (input = null) => {
    try {
      if (!enableEdit) {
        setEnableEdit(true);
        return;
      }

      if (!input) return;

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("shothik_tool_submit", { detail: { tool: "ai-detector" } }));
      }

      trackEvent("click", "ai-detector", "ai-detector_click", 1);

      setIsLoading(true);
      const textToScan = (excludeLatex || excludeCode)
        ? preprocessResult.processedText || input
        : input;
      const res = await scanAidetector({
        text: textToScan,
      }).unwrap();
      const { result, history } = res;
      if (!result) throw { data: { message: t('tools.aiDetector.scanFailed') } };

      setText(history?.text || "");
      setHistory(history);
      setResultToState(result || history?.result);
      setEnableEdit(false);

      if (isMobile) setMobileTab("results");

      refetch();

      if (sessionContent) {
        sessionStorage.removeItem("ai-detect-content");
      }

      const { _id } = res?.section || {};
      if (_id && (!sectionId || _id !== sectionId)) {
        setIsCurrentSection(true);
        dispatch(
          setSections([
            { ...(res?.section || {}), last_history: history },
            ...sections,
          ]),
        );
        dispatch(setSelectedSection(res?.section));
        setSectionId(_id);
      }
    } catch (err) {
      const error = err?.data;
      if (/LIMIT_REQUEST|PACAKGE_EXPIRED/.test(error?.error)) {
        dispatch(setShowAlert(true));
        dispatch(setAlertMessage(error?.message));
      } else if (error?.error === "UNAUTHORIZED") {
        dispatch(setShowLoginModal(true));
      } else {
        toast.error(error?.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  function handleSampleText(keyName) {
    const text = trySamples.ai_detector[keyName];
    if (text) {
      setText(text);
      setOpenSampleDrawer(false);
    }
  }

  // Clear function
  const handleClear = useCallback(() => {
    setText("");
    setResult(null);
    setHistory(null);
    setEnableEdit(true);
    setMobileTab("editor");
  }, []);

  // Section management
  const handleNewSection = useCallback(() => {
    handleClear();
    dispatch(setSelectedSection({}));
    removeSectionId();
    toast.info(t('tools.aiDetector.newChatOpened'));
  }, [handleClear, dispatch, removeSectionId]);

  const handleSelectSection = useCallback(
    (section) => {
      handleClear();
      setIsCurrentSection(true);
      dispatch(setSelectedSection(section || {}));

      const { text, result, last_history } = section;

      if (result) {
        setText(last_history?.text || text || "");
        setHistory(last_history || null);
        setResultToState(last_history?.result || result);
        setEnableEdit(false);
      }

      if (section?._id && section._id !== sectionId) {
        setSectionId(section._id);
      }
    },
    [handleClear, setIsCurrentSection, dispatch, setSectionId],
  );

  const fetchSections = useCallback(
    async ({ page = 1, limit = 10, search = "", reset = false } = {}) => {
      try {
        const { data, meta } = await fetchAiDetectorSections({
          page,
          limit,
          search,
        });

        if (reset) {
          const groups = dataGroupsByPeriod(data || []);
          dispatch(setSections(data || []));
          dispatch(setSectionsGroups(groups));
          dispatch(setSectionsMeta(meta || {}));
        } else {
          const allData = [...(sections || []), ...(data || [])];
          const groups = dataGroupsByPeriod(allData);
          dispatch(setSections(allData));
          dispatch(setSectionsGroups(groups));
          dispatch(setSectionsMeta(meta || {}));
        }
      } catch (err) {
      }
    },
    [sections, dispatch],
  );

  // Load section by ID
  useEffect(() => {
    if (!sectionId) {
      dispatch(setSelectedSection({}));
      return;
    }

    if (isCurrentSection) return;

    if (selectedSection?._id === sectionId) return;


    const setCurrentSection = async () => {
      try {
        const { success, data } = await fetchAiDetectorSection(sectionId);
        if (success && data) {
          dispatch(setSelectedSection(data));
          setText(data?.text);

          const { result, last_history } = data || {};

          setHistory(last_history || null);
          setResultToState(last_history?.result || result || null);
          setEnableEdit(false);

        }
      } catch (err) {
      }
    };

    setCurrentSection();
  }, [sectionId]);

  useEffect(() => {
    if (sessionContent) {
      setText(sessionContent);
      handleSubmit(sessionContent);
      sessionStorage.removeItem("ai-detect-content");
    }

    return () => {
      sessionStorage.removeItem("ai-detect-content");
    };
  }, [sessionContent]);

  if (isContendLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <div className="overflow-x-hidden p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          {/* Section Bar */}
          <div className="bg-card hidden h-fit rounded-xl shadow-sm p-3 lg:block">
            <div className="flex flex-col gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="cursor-pointer"
                      aria-label="View detection history"
                      onClick={() => dispatch(setIsSectionbarOpen(true))}
                    >
                      <Image
                        src="/icons/history.svg"
                        alt="History"
                        width={20}
                        height={20}
                        className="size-5"
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="text-sm">{t('tools.aiDetector.viewHistory')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="cursor-pointer"
                      aria-label={t('tools.aiDetector.startNewDetection')}
                      onClick={() => handleNewSection()}
                    >
                      <Image
                        src="/icons/new-chat.svg"
                        alt="New Chat"
                        width={24}
                        height={24}
                        className="size-6"
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="text-sm">{t('tools.aiDetector.startNewChat')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Main Section */}
          <div className="relative flex flex-1 flex-col gap-3 overflow-x-hidden">
            {isMobile && result && (
              <div className="flex w-full rounded-xl bg-muted/50 p-1 shadow-sm"
                   role="tablist" aria-label="AI Detector views">
                <button
                  id="ai-editor-tab"
                  role="tab"
                  aria-selected={mobileTab === "editor"}
                  aria-controls="ai-editor-panel"
                  tabIndex={mobileTab === "editor" ? 0 : -1}
                  className={cn(
                    "flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                    mobileTab === "editor"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setMobileTab("editor")}
                >
                  {t('common.editor')}
                </button>
                <button
                  id="ai-results-tab"
                  role="tab"
                  aria-selected={mobileTab === "results"}
                  aria-controls="ai-results-panel"
                  tabIndex={mobileTab === "results" ? 0 : -1}
                  className={cn(
                    "flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                    mobileTab === "results"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setMobileTab("results")}
                >
                  {t('common.results')}
                  {result && (
                    <span className="bg-primary/10 text-primary ml-1.5 rounded-full px-1.5 py-0.5 text-xs">
                      {parseInt(result.ai_percentage ?? 0)}%
                    </span>
                  )}
                </button>
              </div>
            )}

            <div className="grid flex-1 grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-0">
            {/* Left Section */}
            <div
              id="ai-editor-panel"
              role={isMobile ? "tabpanel" : undefined}
              aria-labelledby={isMobile ? "ai-editor-tab" : undefined}
              className={cn(
                "bg-card text-card-foreground relative rounded-xl shadow-sm lg:self-stretch lg:rounded-r-none",
                isMobile && result && mobileTab !== "editor" ? "hidden" : ""
              )}
            >
              <div
                className={cn(
                  "flex flex-col overflow-hidden rounded-xl",
                  isMobile
                    ? "h-[calc(100vh-340px)] max-h-[600px] min-h-[400px]"
                    : "h-[calc(100vh-328px)] max-h-[600px] min-h-[400px]",
                  "lg:h-[calc(100vh-280px)] lg:max-h-[600px] lg:min-h-[400px]",
                )}
              >
                <div className="h-12 shrink-0 bg-muted/30 px-3 lg:hidden">
                  <div className="flex h-full items-center justify-between gap-6">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className="cursor-pointer"
                            aria-label="View detection history"
                            onClick={() => dispatch(setIsSectionbarOpen(true))}
                          >
                            <Image
                              src="/icons/history.svg"
                              alt="History"
                              width={20}
                              height={20}
                              className="size-5"
                            />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="text-sm">{t('tools.aiDetector.viewHistory')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className="cursor-pointer"
                            aria-label={t('tools.aiDetector.startNewDetection')}
                            onClick={() => handleNewSection()}
                          >
                            <Image
                              src="/icons/new-chat.svg"
                              alt="New Chat"
                              width={24}
                              height={24}
                              className="size-6"
                            />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="text-sm">{t('tools.aiDetector.startNewChat')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    {enableEdit ? (
                      <>
                        <textarea
                          name="input"
                          aria-label="Enter text for AI detection"
                          role="textbox"
                          placeholder="Enter your text here..."
                          className="placeholder:text-muted-foreground h-full w-full flex-1 resize-none overflow-x-hidden overflow-y-auto bg-transparent p-4 text-sm break-words outline-none lg:text-base"
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          disabled={isLoading}
                          style={{
                            wordWrap: "break-word",
                            overflowWrap: "break-word",
                          }}
                        />
                      </>
                    ) : (
                      <div
                        className="size-full max-h-[500px] flex-1 overflow-x-hidden overflow-y-auto p-4 break-words lg:max-h-[530px]"
                        style={{
                          wordWrap: "break-word",
                          overflowWrap: "break-word",
                        }}
                      >
                        {result &&
                          result?.sentences?.map((item, index) => {
                            const sentence = item.sentence || '';
                            const isLast = index === result.sentences.length - 1;
                            // Ensure proper spacing: add space after sentence if it doesn't already have one
                            // and it's not the last sentence and there's no line break
                            const needsSpace = !isLast && 
                                             sentence.trim() && 
                                             !sentence.endsWith(' ') && 
                                             !item.hasLineBreak && 
                                             !item.hasParagraphBreak;
                            
                            return (
                              <Fragment key={index}>
                                <span
                                  onClick={() => setEnableEdit(true)}
                                  className="break-words"
                                  style={{
                                    backgroundColor: getColorByPerplexity(
                                      item.highlight_sentence_for_ai,
                                      item.perplexity,
                                      isDark,
                                    ),
                                    wordWrap: "break-word",
                                    overflowWrap: "break-word",
                                  }}
                                >
                                  {sentence}
                                </span>
                                {needsSpace && <span> </span>}
                                {/* Preserve line breaks and paragraph gaps */}
                                {item.hasParagraphBreak && (
                                  <>
                                    <br />
                                    <br />
                                  </>
                                )}
                                {item.hasLineBreak && !item.hasParagraphBreak && <br />}
                              </Fragment>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  {!text && !share_id && (
                    <div className="absolute right-4 bottom-6 left-4 mx-auto flex flex-col items-center justify-center gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {1024 >= width && !result && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="shrink-0 whitespace-nowrap"
                              onClick={() => setOpenSampleDrawer(true)}
                            >
                              <FileText className="size-4" />
                              Sample Text
                            </Button>
                            <span>Or</span>
                          </>
                        )}
                        <InitialInputActions
                          className={""}
                          setInput={(text) => {
                            setText(text);
                          }}
                          showPaste={true}
                          showInsertDocument={true}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {text && (stemDetection.hasLatex || stemDetection.hasCode) && enableEdit && (
                  <div className={cn(
                    "flex shrink-0 flex-wrap items-center gap-3 border-t px-4 py-2",
                    width <= 1024 ? "gap-2 px-2 sm:px-4" : ""
                  )}>
                    {stemDetection.hasLatex && (
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={excludeLatex}
                          onChange={(e) => setExcludeLatex(e.target.checked)}
                          className="accent-primary h-4 w-4 rounded"
                          aria-label="Exclude LaTeX formulas from AI detection"
                        />
                        <span className="text-muted-foreground text-xs whitespace-nowrap">
                          Exclude LaTeX ({stemDetection.latexCount})
                        </span>
                      </label>
                    )}
                    {stemDetection.hasCode && (
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={excludeCode}
                          onChange={(e) => setExcludeCode(e.target.checked)}
                          className="accent-primary h-4 w-4 rounded"
                          aria-label="Exclude code blocks from AI detection"
                        />
                        <span className="text-muted-foreground text-xs whitespace-nowrap">
                          Exclude Code ({stemDetection.codeBlockCount})
                        </span>
                      </label>
                    )}
                  </div>
                )}

                {text && (
                  <div className="bg-muted/30">
                    <InputActions
                      className={"h-12 py-1"}
                      toolName="ai-detector"
                      userPackage={user?.package}
                      isLoading={isLoading}
                      input={text}
                      setInput={setText}
                      label={enableEdit ? "Scan" : "Edit"}
                      loadingText={loadingText}
                      onClear={handleClear}
                      onSubmit={() => handleSubmit(text)}
                    />
                  </div>
                )}

                {limit && !text && (
                  <div className="bg-muted/30">
                    <UsesLimitBar
                      className={"h-12 py-1"}
                      text={text}
                      min={minCharacters}
                      limit={limit}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right Section */}
            {(!isMobile || (isMobile && (result || mobileTab === "results"))) ? (
              <div
                id="ai-results-panel"
                role={isMobile ? "tabpanel" : undefined}
                aria-labelledby={isMobile ? "ai-results-tab" : undefined}
                aria-live="polite"
                className={cn(
                  "bg-card text-card-foreground relative overflow-x-hidden overflow-y-hidden rounded-xl shadow-sm lg:self-stretch lg:rounded-l-none",
                  isMobile && result && mobileTab !== "results" ? "hidden" : ""
                )}
              >
                <div
                  className={cn(
                    "flex flex-col rounded-xl",
                    isMobile
                      ? "h-[calc(100vh-340px)] max-h-[600px] min-h-[400px]"
                      : "h-[calc(100vh-328px)] max-h-[600px] min-h-[400px]",
                    "lg:h-[calc(100vh-280px)] lg:max-h-[600px] lg:min-h-[400px]",
                  )}
                >
                  {result ? (
                    <OutputResult
                      handleOpen={() => setShowShareModal(true)}
                      result={result}
                      history={history}
                      isDark={isDark}
                    />
                  ) : (
                    <SampleText
                      handleSampleText={handleSampleText}
                      setOpen={setOpenSampleDrawer}
                      isOpen={openSampleDrawer}
                    />
                  )}
                </div>
              </div>
            ) : (
              <SampleText
                handleSampleText={handleSampleText}
                setOpen={setOpenSampleDrawer}
                isOpen={openSampleDrawer}
              />
            )}
            </div>
          </div>

          {history?._id && (
            <ShareAiDetectorModal
              open={showShareModal}
              onClose={() => setShowShareModal(false)}
              historyId={history._id}
              defaultTab={1}
            />
          )}
        </div>
      </div>
      <AiDetectorSectionbar
        fetchSections={fetchSections}
        handleNewSection={handleNewSection}
        handleSelectSection={handleSelectSection}
        sectionId={sectionId}
        setSectionId={setSectionId}
        removeSectionId={removeSectionId}
      />
    </>
  );
};

export default AiDetectorContentSection;
