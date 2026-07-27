"use client";

import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  CloudDownload,
  Info,
  Share,
} from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { pdfDownload } from "../helpers/pdfDownload";
import { getColorByPerplexity } from "../helpers/pdfHelper";
import {
  colorDefinitions,
  colorDefinitionsAI,
  colorDefinitionsHuman,
} from "../helpers/pdfStyles";

// const widths = [130, 80, 60, 60, 80, 130];
const widths = ["24.07%", "14.81%", "11.11%", "11.11%", "14.81%", "24.07%"];

const AIColor = ({ colors, perplexity, highlight_sentence_for_ai, isDark }) => {
  const color = getColorByPerplexity(
    highlight_sentence_for_ai,
    perplexity,
    isDark,
  );

  return (
    <div className="flex items-center gap-1">
      {colors?.map((item, index) => (
        <div
          key={index}
          className={`h-5 w-5 rounded-full transition-colors duration-200`}
          style={{
            backgroundColor: item === color ? color : "#E0E0E0",
          }}
        />
      ))}
    </div>
  );
};

const Accordion = ({ colorList, data, title, isDark }) => {
  const [isExpanded, setIsExpanded] = useState(-1);

  return (
    <div className="flex flex-1 flex-col bg-muted/20 px-4 py-2 rounded-lg mb-2 last:mb-0">
      <h3 className="mb-1 text-lg font-semibold">{title}</h3>
      <div className="relative h-full flex-1">
        <div>
          {data?.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-2 py-2"
            >
              <AIColor
                highlight_sentence_for_ai={item?.highlight_sentence_for_ai}
                colors={Object.values(colorList)}
                perplexity={item.perplexity}
                isDark={isDark}
              />
              <div className="flex w-full flex-1 items-start justify-between gap-2">
                <p
                  className={`text-sm leading-6 transition-all duration-300 ${
                    isExpanded !== index
                      ? "line-clamp-1 overflow-hidden text-ellipsis"
                      : ""
                  }`}
                >
                  {item?.sentence}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setIsExpanded((prev) => (prev === index ? -1 : index))
                  }
                  className="h-6 w-6 min-w-0 shrink-0 p-0"
                  aria-label={isExpanded === index ? "Collapse section" : "Expand section"}
                >
                  {isExpanded === index ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const OutputResult = ({ handleOpen, result, history, isDark }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await pdfDownload({
        content: result,
        logo: "/shothik_light_logo.png",
      });
      toast.success("PDF downloaded successfully");
    } catch (error) {
      toast.error("Failed to download PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-background text-foreground flex h-full flex-1 flex-col" aria-live="polite">
      {/* Header */}
      <div className="flex !h-12 items-center gap-2 border-b px-4 md:justify-end">
        {history?._id && (
          <button
            onClick={handleOpen}
            aria-label="Share AI detection results"
            className="text-foreground hover:text-primary hover:bg-primary/5 flex h-9 cursor-pointer items-center gap-1 rounded-full bg-muted/50 px-4 text-sm transition-colors duration-300"
          >
            <Share className="h-4 w-4" />
            <span>Share</span>
          </button>
        )}

        <button
          onClick={handleDownload}
          disabled={isDownloading}
          aria-label="Download AI detection report as PDF"
          className="text-foreground hover:text-primary hover:bg-primary/5 flex h-9 cursor-pointer items-center gap-1 rounded-full bg-muted/50 px-4 text-sm transition-colors duration-300 disabled:opacity-60"
        >
          <CloudDownload className="h-4 w-4" />
          <span>{isDownloading ? "Downloading..." : "Download"}</span>
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto py-2">
        {/* Main section */}
        <div className="border-border border-b px-4 py-2">
          <div className="my-2 flex flex-col items-center justify-start gap-3 md:flex-row lg:flex-row">
            <div className="relative flex size-32 items-center justify-center">
              <div
                className="absolute h-full w-full rounded-full border-8"
                style={{ borderColor: colorDefinitions.humanHigh }}
              />
              <div
                className="absolute h-full w-full rounded-full border-8"
                style={{
                  borderColor: colorDefinitions.aiHigh,
                  clipPath: `inset(${100 - result.ai_percentage}% 0 0 0)`,
                }}
              />
              <p
                className={`text-lg font-semibold ${
                  result.ai_percentage > 50 ? "text-warning" : "text-primary"
                }`}
              >
                {result.ai_percentage > 50 ? "AI" : "Human"}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-row flex-wrap items-center gap-2">
                <p className="text-muted-foreground whitespace-nowrap">
                  We are
                </p>
                <span className="border-border border-b font-bold whitespace-nowrap uppercase">
                  highly confident
                </span>
                <p className="text-muted-foreground whitespace-nowrap">
                  this text is
                </p>
              </div>
              <div className="flex justify-start">
                <div className="bg-primary/10 text-primary rounded-full px-2 py-1 text-sm font-bold">
                  {result.assessment}
                </div>
              </div>
              <div className="border-border text-muted-foreground flex items-center gap-2 rounded-md border px-4 py-1">
                <Info className="h-4 w-4" />
                <p>
                  <span role="status">{parseInt(result.ai_percentage ?? 0)}% Probability AI
                  generated</span>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="text-lg font-semibold">
              Enhanced Sentence Detection
            </h4>
            <p className="text-muted-foreground text-sm">
              Sentences that have the biggest influence on the probability
              score.
            </p>
          </div>

          <div className="my-4">
            <div className="flex h-[20px] w-full overflow-hidden rounded">
              {[
                ...Object.values(colorDefinitionsAI).reverse(),
                ...Object.values(colorDefinitionsHuman),
              ].map((color, index) => (
                <div
                  key={index}
                  style={{ backgroundColor: color, width: widths[index] }}
                />
              ))}
            </div>
            <div className="mt-1 flex justify-between">
              <span
                className="text-sm font-medium"
                style={{ color: colorDefinitions.aiHigh }}
              >
                AI
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: colorDefinitions.humanHigh }}
              >
                Human
              </span>
            </div>
          </div>
        </div>

        {/* Accordions */}

        <div className="flex flex-1 flex-col">
          {result?.aiSentences?.length > 0 && (
            <Accordion
              colorList={Object.values(colorDefinitionsAI)}
              data={result.aiSentences}
              title="Top sentences driving AI probability"
              isDark={isDark}
            />
          )}
          {result?.humanSentences?.length > 0 && (
            <Accordion
              colorList={Object.values(colorDefinitionsHuman)}
              data={result?.humanSentences}
              title="Top sentences driving Human probability"
              isDark={isDark}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default OutputResult;
