import { ENV } from "@/config/env";
import useIsDark from "@/hooks/ui/useIsDark";
import { cn } from "@/lib/utils";
import {
  useParaphraseForTaggingMutation,
  useReportForSentenceMutation,
} from "@/redux/api/tools/toolsApi";
import { maskSTEMRegions, unmaskSTEMRegions } from "@/services/stemPreprocessor";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import EditableOutput from "./EditableOutput";
import RephraseSentenceNav from "./RephraseSentenceNav";
import RephraseSentences from "./RephraseSentences";
import Synonyms from "./Synonyms";

const ParaphraseOutput = ({
  data,
  input,
  setData,
  synonymLevel,
  userPackage,
  selectedLang,
  highlightSentence,
  setOutputHistory,
  freezeWords,
  socketId,
  language,
  setProcessing,
  eventId,
  setEventId,
  setHighlightSentence,
  paraphraseRequestCounter,
  eventIdRef,
  socketIdRef,
}) => {
  const [paraphraseForTagging] = useParaphraseForTaggingMutation();
  const [reportForSentence] = useReportForSentenceMutation();
  const [rephraseMode, setRephraseMode] = useState("Standard");
  const [showRephrase, setShowRephrase] = useState(false);
  const [rephraseData, setRephraseData] = useState([]);
  const [isPending, setIsPending] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [sentence, setSentence] = useState("");
  const isDark = useIsDark();

  // CRITICAL: Use ref to track current request to prevent stale closures
  const currentRequestRef = useRef(paraphraseRequestCounter);

  const synonymInit = {
    synonyms: [],
    sentenceIndex: -1,
    wordIndex: -1,
    showRephraseNav: false,
  };
  const [synonymsOptions, setSynonymsOptions] = useState(synonymInit);

  // Effect to clear rephrase suggestions when a new main paraphrase request is made
  useEffect(() => {
    currentRequestRef.current = paraphraseRequestCounter;
    setRephraseData([]);
    setShowRephrase(false);
    setSynonymsOptions(synonymInit);
  }, [paraphraseRequestCounter]);

  const replaceSynonym = (newWord) => {
    setData((prevData) => {
      const newData = prevData.map((sentence, sIndex) =>
        sIndex === synonymsOptions.sentenceIndex
          ? sentence.map((wordObj, wIndex) =>
              wIndex === synonymsOptions.wordIndex
                ? { ...wordObj, word: newWord }
                : wordObj,
            )
          : sentence,
      );

      return newData;
    });
    setSynonymsOptions(synonymInit);
  };

  const handleWordClick = (event, synonyms, sentenceIndex, wordIndex) => {
    event.stopPropagation();

    setAnchorEl(event.currentTarget);
    setSynonymsOptions({
      synonyms,
      sentenceIndex,
      wordIndex,
      showRephraseNav: true,
    });

    const sentenceArr = data[sentenceIndex];
    let sentence = "";
    for (let i = 0; i < sentenceArr.length; i++) {
      const word = sentenceArr[i].word;
      if (/^[.,]$/.test(word)) {
        sentence += word;
      } else {
        sentence += (sentence ? " " : "") + word;
      }
    }
    setSentence(sentence);
  };

  const replaceSentence = async (sentenceData) => {
    // Parse and remove {} markers from freeze words
    const parsedSentenceData = sentenceData.map((wordObj) => ({
      ...wordObj,
      word: wordObj.word.replace(/[{}]/g, ""),
    }));

    let newData = [...data];
    newData[synonymsOptions.sentenceIndex] = parsedSentenceData;
    setData(newData);
    setOutputHistory((prevHistory) => {
      const arr = [];
      if (!prevHistory.length) {
        arr.push(data);
      }
      arr.push(newData);
      return [...prevHistory, ...arr];
    });

    setShowRephrase(false);

    try {
      setProcessing({ success: false, loading: true });

      let sentence = "";
      const sentenceArray = newData[synonymsOptions.sentenceIndex];
      for (let i = 0; i < sentenceArray.length; i++) {
        const word = sentenceArray[i].word;
        if (/^[.,]$/.test(word)) {
          sentence += word;
        } else {
          sentence += (sentence ? " " : "") + word;
        }
      }

      const randomNumber = Math.floor(Math.random() * 10000000000);
      const currentSocketId = socketIdRef.current || socketId;
      const newEventId = `${currentSocketId}-${randomNumber}`;
      setEventId(newEventId);
      eventIdRef.current = newEventId;

      const payload = {
        sentence,
        socketId,
        index: synonymsOptions.sentenceIndex,
        language,
        eventId: newEventId,
      };

      await paraphraseForTagging(payload).unwrap();
    } catch (error) {
      console.error("Error replacing sentence:", error);
      setProcessing({ success: false, loading: false });
    }
    setSynonymsOptions(synonymInit);
  };

  const sendReprt = async () => {
    try {
      const inputs = input.replace(/<[^>]+>/g, "");
      const separator = selectedLang === "Bengali" ? "।" : ".";
      const sentences = inputs.split(separator);
      const output = data[synonymsOptions.sentenceIndex]
        ?.map((word) => word?.word)
        ?.join(" ");

      const payload = {
        input: sentences[synonymsOptions.sentenceIndex],
        output,
      };
      const { data: res } = await reportForSentence(payload).unwrap();

      toast.success(res?.data?.message || "Report send successfully");
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        "Unknown error. Please try again later.";
      toast.error(msg);
    }
  };

  const handleCopy = async () => {
    const msg = "Sentence copied to clipboard";
    const text = data[synonymsOptions.sentenceIndex]
      ?.map((word) => word?.word)
      ?.join(" ");
    await navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  async function rephraseSentence() {
    try {
      if (!sentence || !selectedLang) {
        return;
      }

      setIsPending(true);
      setShowRephrase(true);
      setRephraseData([]);

      const { maskedText, mapping, regionCount } = maskSTEMRegions(sentence);
      const hasSTEM = regionCount > 0;

      const url =
        ENV.api_url +
        `/${ENV.paraphrase_redirect_prefix}/api` +
        "/paraphrase-with-variantV2";

      const token = localStorage.getItem("accessToken");

      const stemPlaceholders = hasSTEM
        ? Object.keys(mapping).join(", ")
        : "";
      const combinedFreezeWords = [freezeWords, stemPlaceholders]
        .filter(Boolean)
        .join(", ");

      const payload = {
        text: hasSTEM ? maskedText : sentence,
        mode: rephraseMode ? rephraseMode.toLowerCase() : "standard",
        synonymLevel: synonymLevel ? synonymLevel.toLowerCase() : "basic",
        model: "sai-nlp-boost",
        language: selectedLang,
        freezeWord: combinedFreezeWords,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token ? "Bearer " + token : "",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw { message: error.message, error: error.error };
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      setIsPending(false);
      if (reader) {
        let text = "";
        const separator = selectedLang === "Bengali" ? "।" : ". ";
        const pattern = /\{[^}]+\}|\S+/g;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const buffer = decoder.decode(value, { stream: true });
          text += buffer.replaceAll("\n", " ");

          let unmaskedText = text;
          if (hasSTEM) {
            const hasPartialPlaceholder = /\[STEM_\d*$/.test(text);
            if (!hasPartialPlaceholder) {
              const unmaskResult = unmaskSTEMRegions(text, mapping);
              if (unmaskResult.validationPassed) {
                unmaskedText = unmaskResult.text;
              }
            }
          }

          let sentences = unmaskedText.split(separator);
          sentences = sentences.map((sentence) => {
            let result = sentence.match(pattern) || [];
            result = result.map((item) => {
              return {
                word: item,
                type: /\{[^}]+\}/.test(item) ? "freeze" : "none",
                synonyms: [],
              };
            });
            result.push({ word: separator.trim(), type: "none", synonyms: [] });
            return result;
          });
          sentences = sentences.filter((item) => item.length > 1);

          setRephraseData(sentences);
        }
      }
    } catch (error) {
      console.error("Rephrase error:", error);
      toast.error(error?.message);
    }
  }

  // This useEffect should trigger rephraseSentence when the selected sentence or rephrase mode changes
  useEffect(() => {
    if (sentence && showRephrase) {
      rephraseSentence();
    }
  }, [sentence, rephraseMode]);

  return (
    <div className={cn("flex-1 overflow-y-auto p-4")} aria-label="Paraphrased output" role="region">
      <EditableOutput
        isDark={isDark}
        data={data}
        setSynonymsOptions={setSynonymsOptions}
        setSentence={setSentence}
        setAnchorEl={setAnchorEl}
        highlightSentence={highlightSentence}
        setHighlightSentence={setHighlightSentence}
      />

      <Synonyms
        synonyms={synonymsOptions.synonyms}
        open={!!synonymsOptions.synonyms.length}
        handleClose={() =>
          setSynonymsOptions((prev) => {
            return {
              ...synonymInit,
              sentenceIndex: prev.sentenceIndex,
              showRephraseNav: prev.showRephraseNav,
            };
          })
        }
        anchorEl={anchorEl}
        replaceSynonym={replaceSynonym}
      />
      <RephraseSentenceNav
        anchorEl={anchorEl}
        open={synonymsOptions.showRephraseNav}
        rephraseSentence={rephraseSentence}
        handleCopy={handleCopy}
        sendReprt={sendReprt}
        handleClose={() =>
          setSynonymsOptions((prev) => {
            return { ...prev, showRephraseNav: false };
          })
        }
      />
      <RephraseSentences
        open={showRephrase}
        anchorEl={anchorEl}
        handleClose={() => setShowRephrase(false)}
        userPackage={userPackage}
        replaceSentence={replaceSentence}
        rephraseData={rephraseData}
        isPending={isPending}
        setRephraseMode={setRephraseMode}
        rephraseMode={rephraseMode}
      />
    </div>
  );
};

export default ParaphraseOutput;
