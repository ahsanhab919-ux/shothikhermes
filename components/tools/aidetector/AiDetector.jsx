"use client";
import { trySamples } from "@/_mock/trySamples";
import { trackEvent } from "@/analysers/eventTracker";
import { trackToolUsed } from "@/lib/posthog";
import LoadingScreen from "@/components/common/LoadingScreen";
import UserActionInput from "@/components/tools/common/UserActionInput";
import WordCounter from "@/components/tools/common/WordCounter";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import useResponsive from "@/hooks/ui/useResponsive";
import useLoadingText from "@/hooks/useLoadingText";
import { cn } from "@/lib/utils";
import {
  useGetShareAidetectorContendQuery,
  useGetUsesLimitQuery,
  useScanAidetectorMutation,
} from "@/redux/api/tools/toolsApi";
import { setShowLoginModal } from "@/redux/slices/auth";
import { setAlertMessage, setShowAlert } from "@/redux/slices/tools";
import { useSearchParams } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import OutputResult, { getColorByPerplexity } from "./OutputResult";
import SampleText from "./SampleText";
import ShareURLModal from "./ShareURLModal";

function formatNumber(number) {
  if (!number) return 0;
  const length = number.toString().length;
  if (length >= 4) {
    return number.toLocaleString("en-US");
  }
  return number.toString();
}

const AiDetector = () => {
  const [openSampleDrawer, setOpenSampleDrawer] = useState(false);
  const { sidebar } = useSelector((state) => state.settings);
  const [showShareModal, setshowShareModal] = useState(false);
  const [outputContend, setOutputContend] = useState(null);
  const [scanAidetector] = useScanAidetectorMutation();
  const { user } = useSelector((state) => state.auth);
  const [enableEdit, setEnableEdit] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState("");
  const isMobile = useResponsive("down", "sm");
  const isMd = useResponsive("down", "md");
  const isMini = sidebar === "compact";
  const params = useSearchParams();
  const share_id = params.get("share_id");
  const dispatch = useDispatch();
  const loadingText = useLoadingText(isLoading);
  const { data: shareContend, isLoading: isContendLoading } =
    useGetShareAidetectorContendQuery(share_id, {
      skip: !share_id,
    });
  const { data: userLimit, refetch } = useGetUsesLimitQuery({
    service: "ai-detector",
  });
  const sessionContent = JSON.parse(
    sessionStorage.getItem("ai-detect-content"),
  );

  // 

  useEffect(() => {
    if (!shareContend) return;
    const data = shareContend?.result;
    if (!data) return;
    setOutputContend({
      ...data,
      aiSentences: data.sentences.filter(
        (sentence) => sentence.highlight_sentence_for_ai,
      ),
      humanSentences: data.sentences.filter(
        (sentence) => !sentence.highlight_sentence_for_ai,
      ),
    });
    setEnableEdit(false);
  }, [shareContend]);

  function handleClear() {
    setOutputContend(null);
    setUserInput("");
    setEnableEdit(true);
  }
  // inputData -> only used when we want to pass input data from other component|function
  async function handleSubmit(inputData = null) {
    try {
      // handle edit;
      if (!enableEdit) {
        setEnableEdit(true);
        return;
      }

      //track event
      trackEvent("click", "ai-detector", "ai-detector_click", 1);

      setIsLoading(true);
      const res = await scanAidetector({
        text: inputData ? inputData : userInput,
      }).unwrap();
      const data = res?.result;
      if (!data) throw { message: "Something went wrong" };
      setOutputContend({
        ...data,
        aiSentences: data.sentences.filter(
          (sentence) => sentence.highlight_sentence_for_ai,
        ),
        humanSentences: data.sentences.filter(
          (sentence) => !sentence.highlight_sentence_for_ai,
        ),
      });
      setEnableEdit(false);
      refetch();
      const inputText = inputData ? inputData : userInput;
      const wc = inputText.split(/\s+/).filter((w) => w.length > 0).length;
      trackToolUsed("ai-detector", wc);
      // If we have generated output based on session content then we need to clear the session storage
      if (sessionContent) {
        sessionStorage.removeItem("ai-detect-content");
      }
    } catch (err) {
      if (err?.name === "UsageLimitError" || err?.code === "USAGE_LIMIT_EXCEEDED") {
        dispatch(setShowAlert(true));
        dispatch(setAlertMessage(`You've reached your ${err.tier || "free"} plan limit. Upgrade your plan for more usage.`));
        setIsLoading(false);
        return;
      }
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
  }

  function handleSampleText(keyName) {
    const text = trySamples.ai_detector[keyName];
    if (text) {
      setUserInput(text);
      setOpenSampleDrawer(false);
    }
  }

  // This use effect is a connection to other features that checks on session storage for "ai-detect-content", if we find it then we set it to user input and call the handleSubmit function to process it.
  // Once we call this and get the output result we remove it from the session storage

  // 
  useEffect(() => {
    if (sessionContent) {
      setUserInput(sessionContent);
      handleSubmit(sessionContent); // passing the content to handleSubmit function so that we don't have to wait for the next useEffect cycle to get the updated userInput value
      sessionStorage.removeItem("ai-detect-content");
    }

    return () => {
      sessionStorage.removeItem("ai-detect-content");
    };
  }, [sessionContent]); // no need to include handle submit

  if (isContendLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="mt-2">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="col-span-1 lg:col-span-1">
          <Card
            className={cn(
              "relative flex flex-col border py-0 shadow-lg",
              isMobile ? "h-[400px]" : "h-[600px]",
            )}
          >
            {enableEdit ? (
              <Textarea
                name="input"
                rows={isMobile ? 13 : 22}
                placeholder="Enter your text here..."
                value={loadingText ? loadingText : userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="flex-grow resize-none border-0 focus-visible:ring-0"
              />
            ) : (
              <div className="h-full overflow-auto p-2">
                {outputContend &&
                  outputContend.sentences.map((item, index) => (
                    <Fragment key={index}>
                      <span
                        onClick={() => setEnableEdit(true)}
                        style={{
                          backgroundColor: getColorByPerplexity(
                            item.highlight_sentence_for_ai,
                            item.perplexity,
                          ),
                        }}
                      >
                        {item.sentence}
                      </span>
                    </Fragment>
                  ))}
              </div>
            )}

            {!userInput ? (
              <>
                {!share_id ? (
                  <UserActionInput
                    setUserInput={setUserInput}
                    isMobile={isMobile}
                    disableTrySample={true}
                  />
                ) : null}
              </>
            ) : null}
            {userInput ? (
              <div className="border-border border-t px-2">
                <WordCounter
                  btnText={enableEdit ? "Scan" : "Edit"}
                  toolName="ai-detector"
                  userInput={userInput}
                  isLoading={isLoading}
                  handleClearInput={handleClear}
                  handleSubmit={handleSubmit}
                  userPackage={user?.package}
                  sticky={0}
                />
              </div>
            ) : null}

            {userLimit && !userInput ? (
              <UsesLimit userLimit={userLimit} />
            ) : null}
          </Card>

          {userLimit && userInput ? <UsesLimit userLimit={userLimit} /> : null}
        </div>

        <div className="col-span-1 lg:col-span-1">
          {outputContend ? (
            <OutputResult
              handleOpen={() => setshowShareModal(true)}
              outputContend={outputContend}
            />
          ) : (
            <SampleText
              handleSampleText={handleSampleText}
              isMini={isMini}
              isMobile={isMd}
              setOpen={setOpenSampleDrawer}
              isDrawer={openSampleDrawer}
            />
          )}
        </div>
      </div>

      {outputContend ? (
        <ShareURLModal
          open={showShareModal}
          handleClose={() => setshowShareModal(false)}
          title="AI Detection Report"
          content={outputContend}
          hashtags={["Shothik AI", "AI Detector"]}
        />
      ) : null}
    </div>
  );
};

function UsesLimit({ userLimit }) {
  const progressPercentage = () => {
    if (!userLimit) return 0;

    const totalWords = userLimit.totalWordLimit;
    const remainingWords = userLimit.remainingWord;
    const progress = (remainingWords / totalWords) * 100;
    return progress;
  };

  return (
    <div className="flex items-end justify-end p-2">
      <div className="w-[220px] sm:w-[250px]">
        <Progress value={progressPercentage()} className="h-1.5" />
        <p className="text-xs sm:text-sm">
          {formatNumber(userLimit?.totalWordLimit)} words /{" "}
          {formatNumber(userLimit?.remainingWord)} words left
        </p>
      </div>
    </div>
  );
}

export default AiDetector;
