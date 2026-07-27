"use client";
import { trySamples } from "@/_mock/trySamples";
import { trackEvent } from "@/analysers/eventTracker";
import { trackToolUsed } from "@/lib/posthog";
import InitialInputActions from "@/components/(primary-layout)/(summarize-page)/SummarizeContentSection/InitialInputActions";
import ButtonInsertDocumentText from "@/components/buttons/ButtonInsertDocumentText";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import useResponsive from "@/hooks/ui/useResponsive";
import useLoadingText from "@/hooks/useLoadingText";
import { cn } from "@/lib/utils";
import { setShowLoginModal } from "@/redux/slices/auth";
import { setAlertMessage, setShowAlert } from "@/redux/slices/tools";
import { useCallback, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import BottomBar from "./BottomBar";
import LanguageMenu from "./LanguageMenu";
import { Button } from "@/components/ui/button";
import SendToWritingStudioButton from "@/components/tools/common/SendToWritingStudioButton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Copy, Download } from "lucide-react";
import { downloadFile } from "../common/downloadfile";
import {
  translateText,
  LANGUAGE_CODE_MAP,
} from "@/services/translator.service";

const Translator = () => {
  const [outputContend, setOutputContend] = useState("");
  const { user, accessToken } = useSelector((state) => state.auth);
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const isMobile = useResponsive("down", "sm");
  const dispatch = useDispatch();
  const loadingText = useLoadingText(isLoading);
  const abortControllerRef = useRef(null);
  const [translateLang, setTranslateLang] = useState({
    fromLang: "Auto Detect",
    toLang: "English",
  });

  async function handleCopy() {
    await navigator.clipboard.writeText(outputContend);
    toast.success("Copied to clipboard");
  }
  const handleDownload = async () => {
    await downloadFile(outputContend, "translation");
    toast.success("Text Downloaded");
  };
  const prevToLangRef = useRef(translateLang.toLang);

  const sampleText = useMemo(() => {
    const isEnglish =
      translateLang.fromLang === "English" ||
      translateLang.fromLang === "English (US)" ||
      translateLang.fromLang?.startsWith("English");

    return isEnglish ? trySamples.translator.English : null;
  }, [translateLang.fromLang]);

  const hasSampleText = Boolean(sampleText);

  const resolveLangCode = useCallback((langName) => {
    if (!langName || langName === "Auto Detect") return "auto";
    return LANGUAGE_CODE_MAP[langName] || langName.toLowerCase().slice(0, 2);
  }, []);

  const doTranslate = useCallback(
    async (text, fromLang, toLang) => {
      if (!text?.trim()) return;
      if (!accessToken) {
        dispatch(setShowLoginModal(true));
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        trackEvent("click", "translator", "translator_click", 1);
        setOutputContend("");
        setIsLoading(true);
        setErrorMessage("");

        const sourceLang = resolveLangCode(fromLang);
        const targetLang = resolveLangCode(toLang);

        const result = await translateText(
          { text: text.trim(), sourceLang, targetLang },
          controller.signal,
        );

        if (result?.translated) {
          setOutputContend(result.translated);
        }

        const wc = text.split(/\s+/).filter((w) => w.length > 0).length;
        trackToolUsed("translator", wc);
      } catch (error) {
        if (error?.name === "AbortError") return;
        if (error?.status === 401) {
          dispatch(setShowLoginModal(true));
        } else if (error?.status === 429 || error?.status === 402) {
          dispatch(setShowAlert(true));
          dispatch(
            setAlertMessage(
              error?.userMessage ||
                error?.message ||
                "Usage limit reached. Please upgrade your plan.",
            ),
          );
        } else {
          const msg =
            error?.userMessage ||
            error?.message ||
            "Translation failed. Please try again.";
          setErrorMessage(msg);
          toast.error(msg);
        }
        setOutputContend("");
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken, dispatch, resolveLangCode],
  );

  const handleLanguageChange = (
    newLangStateOrUpdater,
    skipClearOutput = false,
  ) => {
    let newLangState;
    if (typeof newLangStateOrUpdater === "function") {
      newLangState = newLangStateOrUpdater(translateLang);
    } else {
      newLangState = newLangStateOrUpdater;
    }

    const targetLangChanged = prevToLangRef.current !== newLangState.toLang;
    const hasInput = userInput.trim().length > 0;
    const hadOutput = outputContend.trim().length > 0;

    prevToLangRef.current = newLangState.toLang;

    if (!skipClearOutput) {
      setOutputContend("");
    }

    if (typeof newLangStateOrUpdater === "function") {
      setTranslateLang(newLangStateOrUpdater);
    } else {
      setTranslateLang(newLangState);
    }

    if (targetLangChanged && !skipClearOutput && hadOutput) {
      if (hasInput) {
        setTimeout(() => {
          doTranslate(
            userInput.trim(),
            newLangState.fromLang,
            newLangState.toLang,
          );
        }, 100);
      } else {
        toast.info(
          "Target language changed — Click Translate to see the updated result",
          { position: "top-right", autoClose: 4000 },
        );
      }
    } else if (targetLangChanged && !skipClearOutput && !hadOutput) {
      toast.info(
        "Target language changed — Click Translate to see the result",
        { position: "top-right", autoClose: 4000 },
      );
    }
  };

  function handleInput(e) {
    const value = e.target.value;
    setUserInput(value);
  }

  function handleClear() {
    setUserInput("");
    setOutputContend("");
    setErrorMessage("");
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }

  async function handleSubmit() {
    if (!userInput?.trim()) {
      toast.warning("Please enter some text to translate");
      return;
    }
    doTranslate(userInput, translateLang.fromLang, translateLang.toLang);
  }

  const handleHumanize = async () => {
    if (!outputContend?.trim()) return;
    try {
      setIsHumanizing(true);
      const url = process.env.NEXT_PUBLIC_API_URL_WITH_PREFIX + "/fix-grammar";
      const payload = {
        data: outputContend,
        language: translateLang.toLang,
        mode: "Fixed",
        synonym: "Basic",
      };
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429 && errorData.code === "USAGE_LIMIT_EXCEEDED") {
          throw { name: "UsageLimitError", ...errorData };
        }
        throw errorData;
      }

      const stream = response.body;
      const decoder = new TextDecoderStream();
      const reader = stream.pipeThrough(decoder).getReader();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += value || "";
        setOutputContend(acc);
      }
      toast.success("Translation humanized successfully.");
    } catch (err) {
      const error = err?.response?.data || err;
      if (err?.name === "UsageLimitError" || err?.code === "USAGE_LIMIT_EXCEEDED") {
        dispatch(setShowAlert(true));
        dispatch(setAlertMessage(`You've reached your ${err.tier || "free"} plan limit. Upgrade your plan for more usage.`));
      } else if (/LIMIT_REQUEST|PACKAGE_EXPIRED/.test(error?.error)) {
        dispatch(setShowAlert(true));
        dispatch(setAlertMessage("Humanize limit exceeded, Please upgrade"));
      } else if (error?.error === "UNAUTHORIZED") {
        dispatch(setShowLoginModal(true));
      } else {
        toast.error(error?.message || "Humanize failed. Please try again.");
      }
    } finally {
      setIsHumanizing(false);
    }
  };

  function reverseText() {
    if (userInput && outputContend) {
      const tempInput = userInput;
      setUserInput(outputContend);
      setOutputContend(tempInput);
    } else if (outputContend && !userInput) {
      setUserInput(outputContend);
      setOutputContend("");
    }
  }

  const handleReverseTranslation = () => {
    const hadOutput = outputContend.trim().length > 0;
    const hadInput = userInput.trim().length > 0;
    const textToTranslate = outputContend.trim();

    const newLangState = {
      fromLang: translateLang.toLang,
      toLang: translateLang.fromLang,
    };

    reverseText();
    handleLanguageChange(newLangState, true);

    if (hadOutput && textToTranslate.length > 0) {
      setOutputContend("");
      setTimeout(() => {
        doTranslate(
          textToTranslate,
          newLangState.fromLang,
          newLangState.toLang,
        );
      }, 150);
    } else if (hadOutput && !hadInput) {
      toast.info(
        "Languages swapped — Click Translate to see the updated result",
        { position: "top-right", autoClose: 4000 },
      );
    }
  };

  const charCount = userInput.length;

  return (
    <Card
      className="rounded-xl border p-4 shadow-sm"
      role="region"
      aria-label="Text Translator"
    >
      <LanguageMenu
        isLoading={isLoading || isHumanizing}
        userInput={userInput}
        outputContend={outputContend}
        reverseText={reverseText}
        translateLang={translateLang}
        setTranslateLang={handleLanguageChange}
        handleReverseTranslation={handleReverseTranslation}
      />

      <div className="mt-2 grid grid-cols-1 items-stretch lg:grid-cols-2 lg:gap-4">
        <div
          className={cn(
            "relative h-[calc(100vh-380px)] max-h-[500px] min-h-[350px]",
            isMobile
              ? "flex flex-col overflow-hidden"
              : "overflow-x-hidden overflow-y-auto",
          )}
        >
          <div
            className={cn(
              "relative overflow-x-hidden overflow-y-auto",
              isMobile ? "min-h-0 flex-1" : "h-full",
            )}
          >
            <Textarea
              name="input"
              rows={isMobile ? 12 : 14}
              placeholder="Input your text here..."
              value={userInput}
              onChange={handleInput}
              aria-label="Source text input"
              className="border-border h-full w-full max-w-full resize-none rounded-lg p-4 wrap-break-word focus-visible:ring-0 focus-visible:ring-offset-0"
              style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
            />
            {!userInput && (
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
            )}
          </div>
          {userInput && (
            <div className="text-muted-foreground absolute bottom-2 right-3 text-xs">
              {charCount.toLocaleString()} characters
            </div>
          )}
          {isMobile && (
            <div className="bg-background border-t-border sticky bottom-0 z-10 border-t">
              <BottomBar
                handleClear={handleClear}
                handleHumanize={handleHumanize}
                handleSubmit={handleSubmit}
                isHumanizing={isHumanizing}
                isLoading={isLoading}
                outputContend={outputContend}
                userInput={userInput}
                userPackage={user?.package}
              />
            </div>
          )}
        </div>
        {isMobile && !userInput ? null : (
          <div className="relative h-[calc(100vh-380px)] max-h-[500px] min-h-[350px] overflow-x-hidden overflow-y-auto">
            <Textarea
              name="output"
              rows={isMobile ? 12 : 14}
              placeholder="Translated text"
              value={loadingText ? loadingText : outputContend}
              disabled
              aria-label="Translated text output"
              aria-live="polite"
              className="border-border text-foreground h-full w-full max-w-full resize-none rounded-lg p-4 break-words disabled:cursor-default disabled:opacity-100"
              style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
            />
            {errorMessage && !isLoading && (
              <div
                role="alert"
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-white/80 p-6 text-center dark:bg-black/80"
              >
                <p className="text-destructive text-sm font-medium">
                  {errorMessage}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage("");
                    handleSubmit();
                  }}
                  className="text-primary text-xs underline"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        )}
        <div className="flex flex-row items-center">
          {outputContend && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleDownload}
                    aria-label="Download translation"
                    variant="ghost"
                    size={isMobile ? "icon-sm" : "icon"}
                    className="rounded-[5px]"
                  >
                    <Download
                      className={cn(
                        "font-semibold",
                        isMobile ? "size-4" : "size-5",
                      )}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Export</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleCopy}
                    aria-label="Copy translated text"
                    variant="ghost"
                    size={isMobile ? "icon-sm" : "icon"}
                    className="rounded-[5px]"
                  >
                    <Copy className={cn(isMobile ? "size-4" : "size-5")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Copy Full Text</p>
                </TooltipContent>
              </Tooltip>
              <SendToWritingStudioButton
                text={outputContend}
                intent="assignment"
                title="Translator Output"
                variant="ghost"
                size={isMobile ? "sm" : "default"}
              />
            </>
          )}
        </div>
      </div>

      {!isMobile && (
        <BottomBar
          handleClear={handleClear}
          handleHumanize={handleHumanize}
          handleSubmit={handleSubmit}
          isHumanizing={isHumanizing}
          isLoading={isLoading}
          outputContend={outputContend}
          userInput={userInput}
          userPackage={user?.package}
        />
      )}
    </Card>
  );
};

export default Translator;
