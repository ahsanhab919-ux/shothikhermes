import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useState } from "react";
import AgentResponseDisplay from "./AgentResponseDisplay";

// Simple diff highlighting: highlight lines that differ between responses
function getDiffLines(responses) {
  if (responses.length < 2) return [];
  const linesArr = responses.map((r) =>
    (typeof r === "string" ? r : r.text || "").split("\n"),
  );
  const maxLines = Math.max(...linesArr.map((lines) => lines.length));
  const diffLines = new Array(maxLines).fill(false);
  for (let i = 0; i < maxLines; i++) {
    const lineSet = new Set(linesArr.map((lines) => lines[i] || ""));
    if (lineSet.size > 1) diffLines[i] = true;
  }
  return diffLines;
}

const AgentComparisonView = ({
  comparisons = [],
  highlightDiffs: highlightDiffsProp,
  onToggleDiffs,
}) => {
  const [highlightDiffs, setHighlightDiffs] = useState(false);
  const useHighlight =
    highlightDiffsProp !== undefined ? highlightDiffsProp : highlightDiffs;
  const responses = comparisons.map((c) =>
    typeof c.response === "string" ? c.response : c.response?.text || "",
  );
  const diffLines = useHighlight ? getDiffLines(responses) : [];

  return (
    <div>
      <div className="mb-2 flex items-center">
        <h6 className="flex-1 text-lg font-semibold">Agent Comparison</h6>
        {onToggleDiffs ? (
          <div className="flex items-center space-x-2">
            <Switch
              checked={useHighlight}
              onCheckedChange={onToggleDiffs}
              id="highlight-diffs-controlled"
            />
            <Label
              htmlFor="highlight-diffs-controlled"
              className="cursor-pointer"
            >
              Highlight Differences
            </Label>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Switch
              checked={highlightDiffs}
              onCheckedChange={setHighlightDiffs}
              id="highlight-diffs-uncontrolled"
            />
            <Label
              htmlFor="highlight-diffs-uncontrolled"
              className="cursor-pointer"
            >
              Highlight Differences
            </Label>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {comparisons.map((comp, idx) => (
          <div key={comp.agentName || idx}>
            <div className="mb-1">
              <p className="mb-1 text-base font-medium">
                {comp.agentName || `Agent ${idx + 1}`}
              </p>
              <AgentResponseDisplay
                response={comp.response}
                type={comp.type}
                language={comp.language}
              />
              {/* Simple diff highlighting: show lines in red if they differ */}
              {useHighlight &&
                typeof comp.response === "string" &&
                diffLines.length > 0 && (
                  <div className="mt-1">
                    {comp.response.split("\n").map((line, i) => (
                      <p
                        key={i}
                        className={cn(
                          "rounded px-1 text-sm",
                          diffLines[i] ? "bg-destructive/20" : "bg-transparent",
                        )}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentComparisonView;
