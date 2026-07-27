import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  CloudDownload,
  Info,
  Share,
} from "lucide-react";
import { useState } from "react";
import {
  convertLogoToDataURL,
  generateAiDetectorPDF,
} from "./helpers/generateAiDetectorPDF";

const humanColorName = {
  humanLow: "#10b91d4d",
  humanMedium: "#10b91d99",
  humanHigh: "#10b91d",
};

const aiColorName = {
  aiLow: "#f5c33b4d",
  aiMedium: "#f5c33bcc",
  aiHigh: "#f5c33b",
};

const colorName = {
  ...humanColorName,
  ...aiColorName,
};

const colorValue = {
  // Human text thresholds (lower numbers = more human-like)
  humanHigh: 40, // Least human-like threshold
  humanMedium: 75, // Medium human-like threshold
  humanLow: 100, // Most human-like threshold

  // AI text thresholds (higher numbers = more AI-like)
  aiLow: 100, // Least AI-like threshold
  aiMedium: 250, // Medium AI-like threshold
  aiHigh: 400, // Most AI-like threshold
};
const widths = [130, 80, 60, 60, 80, 130];

export const getColorByPerplexity = (highlight_sentence_for_ai, perplexity) => {
  const p = parseInt(perplexity);


  if (highlight_sentence_for_ai) {
    // AI text thresholds (higher perplexity = more AI-like)
    if (p >= colorValue.aiHigh) return colorName.aiHigh;
    if (p >= colorValue.aiMedium) return colorName.aiMedium;
    if (p >= colorValue.aiLow) return colorName.aiLow;

    return colorName.aiLow; // default to low
  } else {
    // Human text thresholds (lower perplexity = more human-like)
    if (p <= colorValue.humanHigh) return colorName.humanHigh;
    if (p <= colorValue.humanMedium) return colorName.humanMedium;
    if (p <= colorValue.humanLow) return colorName.humanLow;

    return colorName.humanLow;
  }
};

const OutputResult = ({ handleOpen, outputContend }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      // Convert logo to base64 (update the path to your actual logo path)
      // If you don't have a logo or want to skip it, pass null as second parameter
      let logoDataUrl = null;
      try {
        // Update this path to your actual logo location
        logoDataUrl = await convertLogoToDataURL("/shothik_light_logo.png");
      } catch (error) {
        console.warn("Logo could not be loaded, proceeding without logo");
      }

      await generateAiDetectorPDF(outputContend, logoDataUrl);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className="border-border overflow-x-hidden border">
      <div className="border-border flex justify-end gap-2 border-b px-4 py-2">
        <Button
          onClick={handleOpen}
          variant="outline"
          size="sm"
          className="border-border hover:text-primary rounded-full"
        >
          <Share className="mr-2 h-4 w-4" />
          Share
        </Button>
        <Button
          onClick={handleDownload}
          disabled={isDownloading}
          variant="outline"
          size="sm"
          className="border-border hover:text-primary rounded-full disabled:opacity-60"
        >
          <CloudDownload className="mr-2 h-4 w-4" />
          {isDownloading ? "Downloading..." : "Download"}
        </Button>
      </div>

      {/* ai ditector highlight */}
      <div className="border-border overflow-x-hidden border-b px-4 py-2">
        <div className="my-4 flex flex-col gap-6 md:flex-row lg:flex-row lg:items-center lg:justify-start">
          <div className="relative flex h-[150px] w-[150px] shrink-0 items-center justify-center">
            <svg className="h-[150px] w-[150px] -rotate-90 transform">
              <circle
                cx="75"
                cy="75"
                r="70"
                fill="none"
                stroke={colorName.humanHigh}
                strokeWidth="8"
              />
              <circle
                cx="75"
                cy="75"
                r="70"
                fill="none"
                stroke={colorName.aiHigh}
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 70}`}
                strokeDashoffset={`${
                  2 * Math.PI * 70 * (1 - outputContend.ai_percentage / 100)
                }`}
              />
            </svg>
            <div
              className={cn(
                "absolute text-center text-xl font-semibold",
                outputContend.ai_percentage > 50
                  ? "text-yellow-600"
                  : "text-primary",
              )}
            >
              {outputContend.ai_percentage > 50 ? "AI" : "Human"}
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2 md:whitespace-nowrap">
              <span className="text-muted-foreground md:whitespace-nowrap">
                We are{" "}
              </span>
              <span className="border-border inline-block border-b text-base font-bold uppercase">
                highly confident
              </span>
              <span className="text-muted-foreground md:whitespace-nowrap">
                {" "}this text is
              </span>
            </div>
            <div className="flex w-full justify-center lg:justify-start">
              <Badge
                variant="outline"
                className="border-purple-400/30 bg-purple-500/10 break-words px-3 py-1 text-base font-bold text-purple-700"
              >
                {outputContend.assessment}
              </Badge>
            </div>
            <div className="border-border text-muted-foreground flex items-center gap-2 rounded-lg border px-3 py-2">
              <Info className="h-4 w-4 shrink-0" />
              <span className="break-words">
                {parseInt(outputContend.ai_percentage ?? 0)}% Probability AI
                generated
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-lg font-semibold break-words">Enhanced Sentence Detection</h3>
          <p className="text-muted-foreground break-words">
            Sentences that have the biggest influence on the probability score.
          </p>
        </div>

        <div className="my-4">
          <div className="flex h-5 w-full gap-[2px] overflow-hidden rounded">
            {[
              ...Object.values(aiColorName).reverse(),
              ...Object.values(humanColorName),
            ].map((color, index) => (
              <div
                key={index}
                className="h-full"
                style={{ backgroundColor: color, width: widths[index] }}
              />
            ))}
          </div>
          <div className="mt-1.5 flex justify-between">
            <span
              className="text-sm font-medium"
              style={{ color: colorName.aiHigh }}
            >
              AI
            </span>
            <span
              className="text-sm font-medium"
              style={{ color: colorName.humanHigh }}
            >
              Human
            </span>
          </div>
        </div>
      </div>

      <Accortion
        colorList={Object.values(aiColorName)}
        data={outputContend.aiSentences}
        title="Top sentences driving AI probability"
      />
      <Accortion
        colorList={Object.values(humanColorName)}
        data={outputContend.humanSentences}
        title="Top sentences driving Human probability"
      />
    </Card>
  );
};

const Accortion = ({ colorList, data, title, children }) => {
  const [isExpanded, setIsExpanded] = useState(-1);

  return (
    <div className="max-h-[200px] overflow-x-hidden overflow-y-auto border-b px-4 py-2 last:border-b-0 md:max-h-[174px]">
      <h3 className="text-lg font-semibold break-words">{title}</h3>
      {children}

      {data.map((item, index) => (
        <div
          key={index}
          className="border-border flex items-start gap-4 border-b py-4 last:border-b-0"
        >
          <AIColor
            highlight_sentence_for_ai={item.highlight_sentence_for_ai}
            colors={Object.values(colorList)}
            perplexity={item.perplexity}
          />
          <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
            <p
              className={cn(
                "break-words overflow-hidden leading-6 transition-all duration-300 ease-in-out",
                isExpanded !== index ? "line-clamp-1" : "line-clamp-none",
              )}
            >
              {item.sentence}
            </p>

            <Button
              onClick={() =>
                setIsExpanded((prev) => {
                  if (prev === index) {
                    return -1;
                  } else {
                    return index;
                  }
                })
              }
              variant="ghost"
              size="icon-sm"
              className="h-auto w-auto p-0"
            >
              {isExpanded === index ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

function AIColor({ colors, perplexity, highlight_sentence_for_ai }) {
  const color = getColorByPerplexity(highlight_sentence_for_ai, perplexity);

  return (
    <div className="flex items-center gap-1">
      {colors.map((item, index) => (
        <div
          key={index}
          className="h-5 w-5 rounded-full"
          style={{
            backgroundColor: item === color ? color : "#E0E0E0",
          }}
        />
      ))}
    </div>
  );
}

export default OutputResult;
