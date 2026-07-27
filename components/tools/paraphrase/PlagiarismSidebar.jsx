// PlagiarismSidebar.jsx
import { useSelector } from "react-redux";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import compare from "@/public/icons/compare-modes.svg";
import history from "@/public/icons/history.svg";
import plagiarism from "@/public/icons/plagiarism.svg";
import tone from "@/public/icons/tone.svg";
import CompareTab from "./actions/CompareTab"; // to come
import HistoryTab from "./actions/HistoryTab"; // to come
import PlagiarismTab from "./actions/PlagiarismTab";
import ToneTab from "./actions/ToneTab"; // to come
import UpgradePrompt from "./UpgradePrompt";

const tabs = [
  { id: "plagiarism", iconSrc: plagiarism, component: PlagiarismTab },
  { id: "history", iconSrc: history, component: HistoryTab },
  { id: "compare", iconSrc: compare, component: CompareTab },
  { id: "tone", iconSrc: tone, component: ToneTab },
];

const PlagiarismSidebar = ({
  open,
  onClose,
  active,
  setActive,
  score,
  results,
  selectedMode,
  setSelectedMode,
  outputText,
  setOutputText,
  text,
  freezeWords,
  selectedLang,
  sentence,
  highlightSentence,
  plainOutput,
  selectedSynonymLevel,
  disableActions,
}) => {
  const { user } = useSelector((state) => state.auth);
  const paidUser = user?.package && user.package !== "free";

  // open is a string like "plagiarism" when open, or false when closed
  if (!open) return null;

  const ActiveTab = tabs.find((t) => t.id === active)?.component;

  return (
    <div className="bg-background flex h-full w-full flex-col overflow-hidden">
      {/* Drag handle for mobile bottom sheet */}
      <div className="flex shrink-0 justify-center pt-2 pb-1 md:hidden">
        <div className="bg-muted-foreground/30 h-1.5 w-12 rounded-full" />
      </div>

      {/* top nav with bottom border */}
      <div className="border-border flex shrink-0 items-center justify-between border-b px-4 pt-2 pb-3">
        <div className="flex flex-1 justify-around">
          {tabs.map((t) => (
            <div
              key={t.id}
              onClick={
                // disableActions && t.id !== "history"
                //   ? null
                //   :
                () => setActive(t.id)
              }
              className={cn(
                "flex flex-1 flex-col items-center",
                disableActions && t.id !== "history"
                  ? "cursor-not-allowed"
                  : "cursor-pointer",
              )}
            >
              <Button
                variant="ghost"
                size="icon"
                // disabled={disableActions && t.id !== "history"}
                className={cn(
                  active === t.id ? "text-primary" : "text-muted-foreground",
                )}
              >
                {/* <SvgColor src={t.iconSrc} className="h-6 w-6 bg-transparent" /> */}
                <Image
                  src={t.iconSrc}
                  priority={true}
                  width={24}
                  height={24}
                  alt=""
                  className="h-6 w-6"
                />
              </Button>
              {active === t.id && (
                <div className="border-primary mt-0.5 w-6 border-b-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* active tab content - scrollable area */}
      <div className="-webkit-overflow-scrolling-touch flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        <div className="min-h-full px-4 pt-4 pb-6">
          {!paidUser ? (
            <UpgradePrompt onClose={onClose} />
          ) : (
            ActiveTab && (
              <ActiveTab
                onClose={onClose}
                selectedMode={selectedMode}
                setSelectedMode={setSelectedMode}
                score={score}
                results={results}
                outputText={outputText}
                setOutputText={setOutputText}
                text={text}
                freezeWords={freezeWords}
                selectedLang={selectedLang}
                sentence={sentence}
                highlightSentence={highlightSentence}
                plainOutput={plainOutput}
                selectedSynonymLevel={selectedSynonymLevel}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default PlagiarismSidebar;
