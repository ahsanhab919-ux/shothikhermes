import { modes } from "@/_mock/tools/paraphrase";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import { cn } from "@/lib/utils";
import {
  useParaphraseForTaggingMutation,
  useReportForSentenceMutation,
} from "@/redux/api/tools/toolsApi";
import { ChevronRight, FileText, Flag, Gem, Lock, X } from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

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
}) => {
  const [paraphraseForTagging] = useParaphraseForTaggingMutation();
  const [reportForSentence] = useReportForSentenceMutation();
  const [rephraseMode, setRephraseMode] = useState("Standard");
  const [showRephrase, setShowRephrase] = useState(false);
  const [rephraseData, setRephraseData] = useState([]);
  const [isPending, setIsPending] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [sentence, setSentence] = useState("");
  const synonymInit = {
    synonyms: [],
    sentenceIndex: -1,
    wordIndex: -1,
    showRephraseNav: false,
  };
  const [synonymsOptions, setSynonymsOptions] = useState(synonymInit);

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
    let newData = [...data];
    newData[synonymsOptions.sentenceIndex] = sentenceData;
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
      const data = newData[synonymsOptions.sentenceIndex];
      for (let i = 0; i < data.length; i++) {
        const word = data[i].word;
        if (/^[.,]$/.test(word)) {
          sentence += word;
        } else {
          sentence += (sentence ? " " : "") + word;
        }
      }
      const randomNumber = Math.floor(Math.random() * 10000000000);
      setEventId(`${socketId}-${randomNumber}`);
      const payload = {
        sentence,
        socketId,
        index: synonymsOptions.sentenceIndex,
        language,
        eventId,
      };
      await paraphraseForTagging(payload).unwrap();
    } catch (error) {
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
      if (!sentence || !selectedLang) return;
      setIsPending(true);
      setShowRephrase(true);

      const url =
        process.env.NEXT_PUBLIC_API_URL_WITH_PREFIX +
        "/paraphrase-with-variantV2";
      const token = localStorage.getItem("accessToken");
      const payload = {
        text: sentence,
        mode: rephraseMode ? rephraseMode.toLowerCase() : "standard",
        synonymLevel: synonymLevel ? synonymLevel.toLowerCase() : "basic",
        model: "sai-nlp-boost",
        language: selectedLang,
        freezeWord: freezeWords,
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
        const saparator = selectedLang === "Bengali" ? "। " : ". ";
        const pattern = /\{[^}]+\}|\S+/g;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // Decode the chunk and add it to the buffer
          const buffer = decoder.decode(value, { stream: true });
          text += buffer.replaceAll("\n", " ");

          let sentences = text.split(saparator);
          sentences = sentences.map((sentence) => {
            let result = sentence.match(pattern) || [];
            result = result.map((item) => {
              return {
                word: item,
                type: /\{[^}]+\}/.test(item) ? "freeze" : "none",
                synonyms: [],
              };
            });
            result.push({ word: saparator.trim(), type: "none", synonyms: [] });
            return result;
          });
          sentences = sentences.filter((item) => item.length > 1);

          setRephraseData(sentences);
        }
      }
    } catch (error) {
      toast.error(error?.message);
    }
  }

  useEffect(() => {
    if (rephraseData.length) {
      rephraseSentence();
    }
  }, [rephraseMode]);

  return (
    <div className={cn("flex-grow overflow-y-auto p-2")}>
      {data.map((sentence, index) => (
        <span
          key={index}
          className={cn(
            highlightSentence === index && "bg-accent rounded-sm px-1 py-0.5",
          )}
        >
          {sentence &&
            sentence?.map((segment, i, arr) => (
              <span
                key={i}
                className={cn(
                  /NP/.test(segment.type)
                    ? "text-primary"
                    : /VP/.test(segment.type)
                      ? "text-secondary-foreground"
                      : /PP|CP|AdvP|AdjP/.test(segment.type)
                        ? "text-accent-foreground"
                        : /freeze/.test(segment.type)
                          ? "text-muted-foreground"
                          : "text-foreground",
                  !segment.child?.length && "hover:text-primary",
                  "cursor-pointer transition-colors duration-100",
                )}
                onClick={(event) =>
                  handleWordClick(event, segment.synonyms, index, i)
                }
              >
                {arr.length - 1 === i ||
                segment.word === "," ||
                segment.word === ";" ||
                segment?.word?.endsWith("'")
                  ? ""
                  : " "}
                {segment.word?.length > 1
                  ? segment.word?.replace(/[.।]$/, "")
                  : segment.word}
              </span>
            ))}
        </span>
      ))}

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

function Synonyms({ synonyms, open, handleClose, anchorEl, replaceSynonym }) {
  const ref = useOutsideClick(() => handleClose());
  const virtualRef = useMemo(() => ({ current: anchorEl }), [anchorEl]);

  return (
    <Popover open={open}>
      <PopoverAnchor virtualRef={virtualRef} />
      <PopoverContent
        align="start"
        side="bottom"
        onEscapeKeyDown={handleClose}
        onPointerDownOutside={handleClose}
        className={cn("z-[500] max-h-[300px] min-w-[200px] overflow-auto p-0")}
      >
        <div ref={ref} className={cn("max-h-[300px] overflow-auto")}>
          {synonyms.length
            ? synonyms?.map((synonym, index) => (
                <button
                  type="button"
                  onClick={() => replaceSynonym(synonym)}
                  key={`item-${index}`}
                  className={cn(
                    "group flex w-full items-center justify-between",
                    "min-h-8 px-3 py-2",
                    "hover:bg-accent hover:text-accent-foreground",
                    "cursor-pointer transition-colors",
                    "focus:bg-accent focus:outline-none",
                  )}
                >
                  <span className={cn("text-sm")}>{synonym}</span>
                  <ChevronRight
                    className={cn(
                      "text-muted-foreground h-4 w-4",
                      "hidden group-hover:block",
                    )}
                  />
                </button>
              ))
            : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function RephraseSentenceNav({
  open,
  anchorEl,
  handleClose,
  handleCopy,
  sendReprt,
  rephraseSentence,
}) {
  const ref = useOutsideClick(() => handleClose());
  const { showTooltips } = useSelector(
    (state) => state.settings.interfaceOptions,
  );
  const virtualRef = useMemo(() => ({ current: anchorEl }), [anchorEl]);

  return (
    <Popover open={open}>
      <PopoverAnchor virtualRef={virtualRef} />
      <PopoverContent
        align="start"
        side="top"
        onEscapeKeyDown={handleClose}
        onPointerDownOutside={handleClose}
        className={cn("z-[500] p-1.5")}
      >
        <div ref={ref}>
          {showTooltips && (
            <div
              className={cn(
                "bg-background rounded-md border",
                "flex items-center gap-1",
              )}
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={rephraseSentence}
                      variant="outlined"
                      size="sm"
                    >
                      Rephrase
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>See More Sentence</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleCopy}
                      variant="ghost"
                      size="icon"
                      className={cn("h-8 w-8")}
                      aria-label="Copy Sentence"
                    >
                      <FileText className={cn("h-4 w-4")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy Sentence</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={sendReprt}
                      variant="ghost"
                      size="icon"
                      className={cn("h-8 w-8")}
                      aria-label="Report Sentence"
                    >
                      <Flag className={cn("h-4 w-4")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Report Sentence</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function RephraseSentences(props) {
  const {
    open,
    anchorEl,
    handleClose,
    userPackage,
    replaceSentence,
    setRephraseMode,
    isPending,
    rephraseData,
    rephraseMode,
  } = props;

  const virtualRef = useMemo(() => ({ current: anchorEl }), [anchorEl]);

  if (!open) return null;

  return (
    <Popover open={open}>
      <PopoverAnchor virtualRef={virtualRef} />
      <PopoverContent
        align="start"
        side="bottom"
        onEscapeKeyDown={handleClose}
        onPointerDownOutside={handleClose}
        className={cn(
          "z-[500] p-0",
          "w-[320px] sm:w-[420px] lg:w-[635px]",
          "bg-popover text-popover-foreground border-border border",
          "rounded-md",
        )}
      >
        <div className={cn("flex items-center gap-2 pt-2 pr-2 pl-2")}>
          <div className={cn("flex-1 overflow-hidden")}>
            <Tabs
              value={rephraseMode}
              onValueChange={(val) => setRephraseMode(val)}
            >
              <TabsList
                className={cn(
                  "w-full justify-start gap-1",
                  "overflow-x-auto",
                  "[&>*]:shrink-0",
                  "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                )}
              >
                {modes.map((mode, index) => {
                  const isDisabled = !mode.package.includes(userPackage);

                  const trigger = (
                    <TabsTrigger
                      key={index}
                      value={mode.value}
                      disabled={isDisabled}
                      className={cn(
                        "h-8 px-3 py-1",
                        "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                        isDisabled && "cursor-not-allowed opacity-60",
                      )}
                    >
                      {isDisabled && <Lock className={cn("mr-1 h-3 w-3")} />}
                      {mode.value}
                    </TabsTrigger>
                  );

                  if (!isDisabled) return trigger;

                  return (
                    <TooltipProvider key={index}>
                      <Tooltip>
                        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
                        <TooltipContent
                          className={cn(
                            "max-w-[220px] text-center",
                            "bg-background text-foreground border-border border",
                          )}
                        >
                          <div className={cn("mb-2.5 space-y-2 text-center")}>
                            <h6 className={cn("mb-2 text-base font-semibold")}>
                              Upgrade
                            </h6>
                            <p className={cn("text-muted-foreground text-sm")}>
                              Access premium modes by upgrading your plan.
                            </p>
                            <Link href="/pricing" className={cn("block")}>
                              <Button
                                variant="default"
                                className={cn("mt-2 w-full")}
                                data-rybbit-event="clicked_upgrade_plan"
                              >
                                <Gem className={cn("mr-1 h-4 w-4")} />
                                Upgrade Plan
                              </Button>
                            </Link>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </TabsList>
            </Tabs>
          </div>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8")}
            aria-label="Close"
          >
            <X className={cn("h-4 w-4")} />
          </Button>
        </div>

        <div
          className={cn(
            "max-h-[200px] w-full overflow-auto",
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
        >
          {isPending ? (
            <div className={cn("space-y-2 px-2 py-2")}>
              <Skeleton className={cn("h-4 w-full")} />
              <Skeleton className={cn("h-4 w-11/12")} />
              <Skeleton className={cn("h-4 w-10/12")} />
            </div>
          ) : (
            rephraseData?.map((sentence, index) => {
              return (
                <Fragment key={index}>
                  <button
                    type="button"
                    onClick={() => replaceSentence(sentence)}
                    className={cn(
                      "w-full p-0 text-left",
                      "hover:bg-accent hover:text-accent-foreground",
                      "transition-colors focus:outline-none",
                    )}
                  >
                    <div className={cn("px-3 py-2")}>
                      {sentence &&
                        sentence?.map((segment, i, arr) => (
                          <span
                            key={i}
                            className={cn(
                              /NP/.test(segment.type)
                                ? "text-primary"
                                : /VP/.test(segment.type)
                                  ? "text-secondary-foreground"
                                  : /PP|CP|AdvP|AdjP/.test(segment.type)
                                    ? "text-accent-foreground"
                                    : /freeze/.test(segment.type)
                                      ? "text-muted-foreground"
                                      : "text-foreground",
                              "hover:text-primary cursor-pointer transition-colors duration-100",
                            )}
                          >
                            {arr.length - 1 === i ||
                            segment.word === "," ||
                            segment?.word?.endsWith("'")
                              ? ""
                              : " "}
                            {segment.word?.length > 1
                              ? segment.word
                                  ?.replace(/[{}]/g, "")
                                  .replace(/[.।]+$/, "")
                              : segment.word}
                          </span>
                        ))}
                    </div>
                  </button>
                  <Separator />
                </Fragment>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default ParaphraseOutput;
