import { Copy, RotateCcw } from "lucide-react";
import { toast } from "react-toastify";

import SendToWritingStudioButton from "@/components/tools/common/SendToWritingStudioButton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import ParaphraseFeedbackBar from "./ParaphraseFeedbackBar";

export default function SimplifiedParaphrasePanel({
  output,
  onRetry,
  inlineError,
  qualityAssessment,
  accessToken,
  inputText,
  selectedMode,
  selectedSynonyms,
  writingStudioIntent = "book",
}) {
  const handleCopy = async () => {
    if (!output?.trim()) return;
    await navigator.clipboard.writeText(output);
    toast.success("Paraphrased text copied");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Simplified output</p>
          <p className="text-xs text-muted-foreground">
            Clean, copy-ready paraphrased text with no extra preview steps.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleCopy} disabled={!output?.trim()}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>
          <SendToWritingStudioButton
            text={output}
            intent={writingStudioIntent}
            title="Paraphraser Output"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {qualityAssessment && output?.trim() ? (
          <div
            className={cn(
              "mb-4 rounded-2xl border p-4",
              qualityAssessment.label === "High confidence"
                ? "border-emerald-500/20 bg-emerald-500/10"
                : qualityAssessment.label === "Needs review"
                ? "border-amber-500/20 bg-amber-500/10"
                : "border-destructive/20 bg-destructive/10",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{qualityAssessment.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{qualityAssessment.summary}</p>
              </div>
              <div className="rounded-full border border-border bg-background/80 px-3 py-1 text-sm font-semibold text-foreground">
                Quality score: {qualityAssessment.score}
              </div>
            </div>
            {qualityAssessment.warnings?.length ? (
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {qualityAssessment.warnings.map((warning) => (
                  <li key={warning}>- {warning}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {inlineError ? (
          <div className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/10 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-destructive">Could not paraphrase this request</p>
                <p className="mt-1 text-sm text-destructive/90">{inlineError.message}</p>
                {inlineError.fragment ? (
                  <p className="mt-2 rounded-lg bg-background/80 px-3 py-2 text-xs text-foreground">
                    Problem area: <span className="font-medium">{inlineError.fragment}</span>
                  </p>
                ) : null}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </div>
        ) : null}

        <div className="min-h-[320px] rounded-2xl border border-border bg-background px-4 py-4">
          {output?.trim() ? (
            <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-foreground">
              {output}
            </pre>
          ) : (
            <div className="flex h-full min-h-[240px] items-center justify-center text-center text-sm text-muted-foreground">
              Start paraphrasing to see the simplified output here.
            </div>
          )}
        </div>

        {output?.trim() ? (
          <div className="mt-4">
            <ParaphraseFeedbackBar
              accessToken={accessToken}
              inputText={inputText}
              outputText={output}
              selectedMode={selectedMode}
              selectedSynonyms={selectedSynonyms}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
