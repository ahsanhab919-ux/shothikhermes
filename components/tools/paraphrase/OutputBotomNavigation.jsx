import { Button as ShadButton } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip as ShadTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useResponsive from "@/hooks/ui/useResponsive";
import { cn } from "@/lib/utils";
import { setActiveHistory } from "@/redux/slices/paraphraseHistorySlice";
import {
  ChevronDown,
  ChevronUp,
  Copy as CopyIcon,
  Download,
  FileDown,
  FileText,
  FileType,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { downloadFile } from "../common/downloadfile";

const OutputBotomNavigation = ({
  setHighlightSentence,
  highlightSentence,
  sentenceCount,
  outputWordCount,
  inputWordCount = 0,
  proccessing,
  setOutputHistoryIndex,
  outputHistoryIndex,
  outputHistory,
  handleClear,
  outputContend,
}) => {
  const isMobile = useResponsive("down", "sm");
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [formatMenuAnchor, setFormatMenuAnchor] = useState(null);

  const dispatch = useDispatch();

  const handleDownloadClick = () => {
    setDownloadModalOpen(true);
  };

  const handleCloseModal = () => {
    setDownloadModalOpen(false);
    setFormatMenuAnchor(null);
  };

  const handleFormatMenuOpen = (event) => {
    setFormatMenuAnchor(event.currentTarget);
  };

  const handleFormatMenuClose = () => {
    setFormatMenuAnchor(null);
  };

  const { activeHistory, activeHistoryIndex, histories, historyGroups } =
    useSelector((state) => state.paraphraseHistory);

  const setActiveHistoryByIndex = (index) => {
    const history = histories[index];
    if (history) {
      dispatch(setActiveHistory(history));
    }
  };

  const handleDownloadFormat = async (format) => {
    try {
      let fontData = null;

      if (format === "pdf") {
        // Try loading font as base64 directly
        try {
          const fontResponse = await fetch("/fonts/bangla-font.ttf");
          if (fontResponse.ok) {
            const arrayBuffer = await fontResponse.arrayBuffer();
            fontData = arrayBuffer;
          }
        } catch (fontError) {
        }
      }

      await downloadFile(outputContend, "paraphrase", format, fontData);
      toast.success(`Text Downloaded as ${format.toUpperCase()}`);
      handleCloseModal();
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed");
    }
  };

  async function handleCopy() {
    await navigator.clipboard.writeText(outputContend);
    toast.success("Copied to clipboard");
  }

  async function handleRichCopy() {
    try {
      const htmlContent = outputContend
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/__(.*?)__/g, "<strong>$1</strong>")
        .replace(/_(.*?)_/g, "<em>$1</em>")
        .replace(/~~(.*?)~~/g, "<s>$1</s>")
        .replace(/`(.*?)`/g, "<code>$1</code>")
        .replace(/^### (.*$)/gm, "<h3>$1</h3>")
        .replace(/^## (.*$)/gm, "<h2>$1</h2>")
        .replace(/^# (.*$)/gm, "<h1>$1</h1>")
        .split("\n")
        .map((line) => {
          if (line.startsWith("<h")) return line;
          return line ? `<p>${line}</p>` : "<br/>";
        })
        .join("");

      const blob = new Blob([htmlContent], { type: "text/html" });
      const textBlob = new Blob([outputContend], { type: "text/plain" });

      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": blob,
          "text/plain": textBlob,
        }),
      ]);
      toast.success("Copied with formatting");
    } catch {
      await navigator.clipboard.writeText(outputContend);
      toast.success("Copied to clipboard");
    }
  }

  const modalStyle = {};

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex flex-row flex-wrap items-center justify-between gap-y-1 px-2 pb-1 md:pb-2",
          "mt-auto min-h-min shrink-0",
        )}
      >
        <div className="flex flex-row items-center gap-1">
          <div className="flex flex-row items-center gap-1">
            <ShadTooltip>
              <TooltipTrigger asChild>
                <ShadButton
                  variant="ghost"
                  size="icon"
                  onClick={() => setHighlightSentence((prev) => prev - 1)}
                  disabled={highlightSentence === 0}
                  aria-label="previous-sentence"
                  className="bg-primary/5 text-primary rounded-[5px]"
                >
                  <ChevronUp className="h-4 w-4" />
                </ShadButton>
              </TooltipTrigger>
              <TooltipContent>Previous sentence</TooltipContent>
            </ShadTooltip>

            <ShadTooltip>
              <TooltipTrigger asChild>
                <ShadButton
                  variant="ghost"
                  size="icon"
                  onClick={() => setHighlightSentence((prev) => prev + 1)}
                  disabled={highlightSentence === sentenceCount - 1}
                  aria-label="next-sentence"
                  className="bg-primary/5 text-primary rounded-[5px]"
                >
                  <ChevronDown className="h-4 w-4" />
                </ShadButton>
              </TooltipTrigger>
              <TooltipContent>Next sentence</TooltipContent>
            </ShadTooltip>

            <span className="hidden font-semibold sm:block">
              <b>{highlightSentence + 1}</b>/{sentenceCount} Sentences
            </span>
          </div>

          <span className="bg-primary hidden h-1.5 w-1.5 rounded-full sm:block" />

          <div className="flex flex-row items-center gap-1">
            <span className="font-semibold">{outputWordCount} words</span>
            <span className="text-muted-foreground text-xs">
              {outputContend ? outputContend.length.toLocaleString() : 0} chars
            </span>
            {inputWordCount > 0 && outputWordCount > 0 && (
              <span
                className={cn(
                  "rounded-sm px-1.5 py-0.5 text-xs font-medium",
                  Math.abs(((outputWordCount - inputWordCount) / inputWordCount) * 100) <= 15
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                )}
              >
                {outputWordCount >= inputWordCount ? "+" : ""}
                {Math.round(((outputWordCount - inputWordCount) / inputWordCount) * 100)}%
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-row items-center justify-end">
          <div>
            {proccessing.loading ? (
              <Image
                src="/loading-gif.gif"
                alt="loading"
                width={25}
                height={25}
              />
            ) : !proccessing.success && sentenceCount ? (
              <ShieldAlert className="text-destructive h-4 w-4" />
            ) : null}
          </div>
          {/* {!isMobile && (
            <div className="flex flex-row items-center gap-1">
              <ShadTooltip>
                <TooltipTrigger asChild>
                  <ShadButton
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setActiveHistoryByIndex(activeHistoryIndex + 1)
                    }
                    disabled={
                      !histories.length ||
                      activeHistoryIndex === histories.length - 1
                    }
                    aria-label="previous-history"
                    className="bg-primary/5 text-primary rounded-[5px]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </ShadButton>
                </TooltipTrigger>
                <TooltipContent>Previous history</TooltipContent>
              </ShadTooltip>

              <ShadButton
                variant="ghost"
                size="icon"
                aria-label="history"
                className={cn(
                  "bg-primary/5 rounded-[5px]",
                  activeHistory?._id
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                <History className="h-4 w-4" />
              </ShadButton>

              <ShadTooltip>
                <TooltipTrigger asChild>
                  <ShadButton
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setActiveHistoryByIndex(activeHistoryIndex - 1)
                    }
                    disabled={!histories.length || activeHistoryIndex < 1}
                    aria-label="next-history"
                    className="bg-primary/5 text-primary mr-0.5 rounded-[5px]"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </ShadButton>
                </TooltipTrigger>
                <TooltipContent>Next history</TooltipContent>
              </ShadTooltip>
            </div>
          )} */}

          <ShadTooltip>
            <TooltipTrigger asChild>
              <ShadButton
                variant="ghost"
                size="icon"
                onClick={() => handleClear("output")}
                aria-label="clear"
                className="rounded-[5px]"
              >
                <Trash2 className="h-5 w-5" />
              </ShadButton>
            </TooltipTrigger>
            <TooltipContent>Clear result</TooltipContent>
          </ShadTooltip>

          <ShadTooltip>
            <TooltipTrigger asChild>
              <ShadButton
                variant="ghost"
                size="icon"
                onClick={handleDownloadClick}
                aria-label="download"
                className="rounded-[5px]"
              >
                <Download className="h-5 w-5" />
              </ShadButton>
            </TooltipTrigger>
            <TooltipContent>Export</TooltipContent>
          </ShadTooltip>

          <ShadTooltip>
            <TooltipTrigger asChild>
              <ShadButton
                variant="ghost"
                size="icon"
                onClick={handleRichCopy}
                aria-label="copy-formatted"
                className="rounded-[5px]"
              >
                <CopyIcon className="h-5 w-5" />
              </ShadButton>
            </TooltipTrigger>
            <TooltipContent>Copy with Formatting</TooltipContent>
          </ShadTooltip>
        </div>
      </div>

      {/* Not Needed now, but can be used later. Don't remove it */}
      {/* {!!isMobile && (
        <div className="flex items-center justify-center">
          <div className="flex flex-row items-center gap-1">
            <ShadTooltip>
              <TooltipTrigger asChild>
                <ShadButton
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setActiveHistoryByIndex(activeHistoryIndex + 1)
                  }
                  disabled={
                    !histories.length ||
                    activeHistoryIndex === histories.length - 1
                  }
                  aria-label="previous-history"
                  className="bg-primary/5 text-primary rounded-[5px]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </ShadButton>
              </TooltipTrigger>
              <TooltipContent>Previous history</TooltipContent>
            </ShadTooltip>

            <ShadButton
              variant="ghost"
              size="icon"
              aria-label="history"
              className={cn(
                "bg-primary/5 rounded-[5px]",
                activeHistory?._id
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <History className="h-4 w-4" />
            </ShadButton>

            <ShadTooltip>
              <TooltipTrigger asChild>
                <ShadButton
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setActiveHistoryByIndex(activeHistoryIndex - 1)
                  }
                  disabled={!histories.length || activeHistoryIndex < 1}
                  aria-label="next-history"
                  className="bg-primary/5 text-primary mr-0.5 rounded-[5px]"
                >
                  <ChevronRight className="h-4 w-4" />
                </ShadButton>
              </TooltipTrigger>
              <TooltipContent>Next history</TooltipContent>
            </ShadTooltip>
          </div>
        </div>
      )} */}

      <Dialog open={downloadModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="w-[400px] rounded-md p-4 outline-none">
          <DialogHeader>
            <DialogTitle className="mb-3 text-center font-bold">
              Download Report
            </DialogTitle>
          </DialogHeader>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ShadButton
                variant="outline"
                onClick={handleFormatMenuOpen}
                className="w-full justify-between py-1.5 text-base"
              >
                Download
                <ChevronDown className="h-4 w-4" />
              </ShadButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full min-w-[200px]">
              <DropdownMenuItem onClick={() => handleDownloadFormat("pdf")}>
                <FileDown className="mr-2 h-4 w-4" />
                <span>.pdf</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadFormat("txt")}>
                <FileText className="mr-2 h-4 w-4" />
                <span>.txt</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownloadFormat("docx")}>
                <FileType className="mr-2 h-4 w-4" />
                <span>.docx</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default OutputBotomNavigation;
