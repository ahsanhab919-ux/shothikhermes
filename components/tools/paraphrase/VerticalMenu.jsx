"use client";
import SvgColor from "@/components/common/SvgColor";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import Image from "next/image";
import React, { memo, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import FileHistorySidebar from "./FileHistorySidebar";
import PlagiarismSidebar from "./PlagiarismSidebar";
import SettingsSidebar from "./settings/SettingsSidebar";

// Memoize ActionButton to prevent re-renders
const ActionButton = memo(
  ({
    id,
    title,
    icon,
    onClick,
    disabled,
    isPaidUser,
    showCrown,
    mobile,
    showTooltip = false,
    tooltipText,
  }) => {
    const words = useMemo(() => title.split(" "), [title]);

    const content = (
      <div
        onClick={!disabled ? onClick : undefined}
        className={cn(
          "w-full select-none",
          "flex flex-row items-center md:flex-col",
          mobile ? "justify-between gap-3 px-2 py-1" : "justify-between gap-2",
          disabled ? "cursor-not-allowed" : "cursor-pointer",
        )}
      >
        <div className="relative flex shrink-0 items-center justify-center">
          <Button
            id={id}
            variant="ghost"
            size="icon"
            className="text-foreground h-5 w-5 cursor-pointer p-0"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) onClick();
            }}
          >
            <SvgColor src={icon} className="text-foreground size-[20px]" />
          </Button>
          {!isPaidUser && showCrown && (
            <Image
              src="/premium_crown.svg"
              alt="premium crown"
              width={16}
              height={16}
              className={cn(
                "pointer-events-none absolute",
                mobile
                  ? "right-0 bottom-0 translate-x-1/2 translate-y-1/2"
                  : "-right-1 -bottom-1",
              )}
            />
          )}
        </div>

        <span
          className={cn(
            "text-foreground inline-block flex-1 text-start text-xs leading-tight whitespace-nowrap md:text-center md:whitespace-pre-line",
          )}
        >
          {mobile
            ? title
            : words.map((w, i) => (
                <React.Fragment key={i}>
                  {w}
                  {i < words.length - 1 && "\n"}
                </React.Fragment>
              ))}
        </span>
      </div>
    );

    if (showTooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{content}</TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-sm">{tooltipText || title}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return content;
  },
);

ActionButton.displayName = "ActionButton";

const VerticalMenu = ({
  selectedMode,
  setSelectedMode,
  outputText,
  setOutputText,
  freezeWords,
  text,
  selectedLang,
  highlightSentence,
  setHighlightSentence,
  plainOutput,
  selectedSynonymLevel,
  mobile = false,
  fetchFileHistories,
}) => {
  const [showSidebar, setShowSidebar] = useState(false);
  const { demo } = useSelector((state) => state.settings);
  const { user } = useSelector((state) => state.auth);
  const paidUser = user?.package && user.package !== "free";

  // 

  // Memoize mock data to prevent recreation
  const mockPlagiarismData = useMemo(() => {
    if (demo === "plagiarism_high") {
      return {
        score: 100,
        results: [
          {
            id: 1,
            source: "Example Source 1",
            matches: [
              {
                text: "This is a highly plagiarized sentence.",
                original: "This is a highly plagiarized sentence.",
              },
            ],
          },
          {
            id: 2,
            source: "Example Source 2",
            matches: [
              {
                text: "Another copied phrase.",
                original: "Another copied phrase.",
              },
            ],
          },
        ],
      };
    } else if (demo === "plagiarism_low") {
      return {
        score: 0,
        results: [],
      };
    }
    return { score: null, results: [] };
  }, [demo]);

  // Memoize computed values
  const disableActions = useMemo(
    () => !demo && (!plainOutput || !plainOutput.trim()),
    [demo, plainOutput],
  );

  // On mobile, free users can always click (to see upgrade prompt)
  // On desktop, respect disableActions for tooltip UX
  const shouldDisablePremiumActions = useMemo(() => {
    // If user is paid, respect normal disable logic
    if (paidUser) return disableActions;

    // If mobile and free user, never disable (let them see upgrade prompt)
    if (mobile && !paidUser) return false;

    // Desktop free users: respect disable logic (tooltip shows reason)
    return disableActions;
  }, [disableActions, paidUser, mobile]);

  const currentSentence = useMemo(() => {
    if (outputText && highlightSentence >= 0 && outputText[highlightSentence]) {
      return outputText[highlightSentence].map((w) => w.word).join(" ");
    }
    return "";
  }, [outputText, highlightSentence]);

  return (
    <>
      <div
        className={cn(
          "relative z-10",
          "mt-1",
          mobile ? "max-h-[90vh] w-full px-2" : "max-h-[638px] w-full px-0",
          "flex flex-col",
          mobile ? "gap-3.5" : "gap-5.5",
        )}
      >
        {/* Center icons */}
        <div
          className={cn(
            "flex flex-col",
            mobile ? "w-full items-start gap-2" : "w-auto items-center gap-3",
          )}
        >
          <div id="paraphrase_plagiarism" className="w-full">
            <ActionButton
              id="paraphrase_plagiarism_button"
              title="Check Plagiarism"
              icon="/icons/plagiarism.svg"
              onClick={() => setShowSidebar("plagiarism")}
              // disabled={disableActions}
              disabled={shouldDisablePremiumActions}
              isPaidUser={paidUser}
              showCrown={true}
              mobile={mobile}
              showTooltip={true}
              tooltipText={
                disableActions
                  ? "Paraphrase text to see plagiarism."
                  : "Plagiarism"
              }
              data-rybbit-event="clicked_upgrade_plan"
            />
          </div>
          <div id="paraphrase_history" className="w-full">
            <ActionButton
              id="paraphrase_history_button"
              title="History"
              icon="/icons/history.svg"
              onClick={() => setShowSidebar("history")}
              disabled={false}
              isPaidUser={paidUser}
              showCrown={true}
              mobile={mobile}
              showTooltip={true}
              tooltipText={"History"}
            />
          </div>
          <div id="paraphrase_compare" className="w-full">
            <ActionButton
              id="paraphrase_compare_button"
              title="Compare Modes"
              icon="/icons/compare-modes.svg"
              onClick={() => setShowSidebar("compare")}
              // disabled={disableActions}
              disabled={shouldDisablePremiumActions}
              isPaidUser={paidUser}
              showCrown={true}
              mobile={mobile}
              showTooltip={true}
              tooltipText={
                disableActions
                  ? "Paraphrase text to see compare mode."
                  : "Compare modes"
              }
            />
          </div>
          <div id="paraphrase_tone" className="w-full">
            <ActionButton
              id="paraphrase_tone_button"
              title="Tone"
              icon="/icons/tone.svg"
              onClick={() => setShowSidebar("tone")}
              // disabled={disableActions}
              disabled={shouldDisablePremiumActions}
              isPaidUser={paidUser}
              showCrown={true}
              mobile={mobile}
              showTooltip={true}
              tooltipText={
                disableActions ? "Paraphrase text to see tone." : "Tone"
              }
            />
          </div>

          {/* File History Buttons - Only show on mobile (below md breakpoint) */}
          <div className="mt-2 w-full md:hidden">
            <FileHistorySidebar fetchFileHistories={fetchFileHistories} />
          </div>
        </div>

        {/* Bottom icons */}
        <div
          className={cn(
            "mt-2 flex flex-col",
            mobile ? "w-full items-start gap-2" : "w-auto items-center gap-3",
          )}
        >
          <div id="paraphrase_settings" className="w-full">
            <ActionButton
              title="Settings"
              id="paraphrase_settings_button"
              icon="/icons/settings.svg"
              onClick={() => setShowSidebar("settings")}
              disabled={false}
              showCrown={false}
              mobile={mobile}
              showTooltip={true}
            />
          </div>
          <div id="paraphrase_feedback" className="w-full">
            <ActionButton
              id="paraphrase_feedback_button"
              title="Feedback"
              icon="/icons/feedback.svg"
              onClick={() => setShowSidebar("feedback")}
              disabled={false}
              showCrown={false}
              mobile={mobile}
              showTooltip={true}
            />
          </div>
          <div id="paraphrase_shortcuts" className="w-full">
            <ActionButton
              id="paraphrase_shortcuts_button"
              title="Hotkeys"
              icon="/icons/hotkeys.svg"
              onClick={() => setShowSidebar("shortcuts")}
              disabled={false}
              showCrown={false}
              mobile={mobile}
              showTooltip={true}
            />
          </div>
        </div>
      </div>

      {/* Hidden button for onboarding to close sidebar */}
      <Button
        id="settings_sidebar_x_button"
        onClick={() => setShowSidebar(false)}
        className="pointer-events-none absolute -z-50 h-0 w-0 opacity-0"
      ></Button>

      <Button
        id="plagiarism_sidebar_x_button"
        onClick={() => setShowSidebar(false)}
        className="pointer-events-none absolute -z-50 h-0 w-0 opacity-0"
      ></Button>

      {/* Sheet to replace Drawer */}
      <Sheet
        open={!!showSidebar}
        onOpenChange={(open) => {
          if (!open) {
            setShowSidebar(false);
          }
        }}
      >
        <SheetContent
          side={mobile ? "bottom" : "right"}
          className={cn(
            mobile
              ? "inset-x-0! bottom-0! h-[90vh]! max-h-[90vh]! w-full max-w-full gap-0 rounded-t-xl"
              : "max-w-[380px] min-w-[400px] gap-4",
            "overflow-hidden p-0",
          )}
        >
          {["plagiarism", "history", "tone", "compare"].includes(
            showSidebar,
          ) && (
            <PlagiarismSidebar
              open={showSidebar}
              onClose={() => setShowSidebar((prev) => !prev)}
              active={showSidebar}
              setActive={setShowSidebar}
              score={mockPlagiarismData.score}
              results={mockPlagiarismData.results}
              selectedMode={selectedMode}
              setSelectedMode={setSelectedMode}
              outputText={outputText}
              setOutputText={setOutputText}
              text={text}
              freezeWords={freezeWords}
              selectedLang={selectedLang}
              sentence={currentSentence}
              selectedSynonymLevel={selectedSynonymLevel}
              highlightSentence={highlightSentence}
              plainOutput={plainOutput}
              mobile={mobile}
              disableActions={disableActions}
            />
          )}

          {["settings", "feedback", "shortcuts"].includes(showSidebar) && (
            <SettingsSidebar
              open={showSidebar}
              onClose={() => setShowSidebar((prev) => !prev)}
              tab={showSidebar}
              setTab={setShowSidebar}
              mobile={mobile}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default memo(VerticalMenu);
