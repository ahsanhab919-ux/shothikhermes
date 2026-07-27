import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "react-toastify";

import { ENV } from "@/config/env";
import logger from "@/lib/logger";

const FEEDBACK_REASONS = [
  "Too similar",
  "Lost meaning",
  "Too formal",
  "Needs more variation",
];

export default function ParaphraseFeedbackBar({
  accessToken,
  inputText,
  outputText,
  selectedMode,
  selectedSynonyms,
}) {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const submitFeedback = async (sentiment, reason = "") => {
    if (!outputText?.trim() || submitted || sending) return;

    setSending(true);
    try {
      const response = await fetch(
        `${ENV.api_url}/${ENV.paraphrase_redirect_prefix}/api/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({
            message: [
              `Quick feedback: ${sentiment}`,
              reason ? `Reason: ${reason}` : null,
              `Mode: ${selectedMode}`,
              `Variation: ${selectedSynonyms}`,
              `Input length: ${inputText?.length || 0}`,
              `Output length: ${outputText?.length || 0}`,
            ]
              .filter(Boolean)
              .join(" | "),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to submit feedback.");
      }

      toast.success("Feedback captured. Thanks for helping improve the paraphraser.");
      setSubmitted(true);
    } catch (error) {
      logger.error("[paraphrase-ui] feedback submit failed", error, {
        inputLength: inputText?.length || 0,
        outputLength: outputText?.length || 0,
        selectedMode,
        selectedSynonyms,
      });
      toast.error("Could not submit feedback right now.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Was this paraphrase useful?</p>
          <p className="text-xs text-muted-foreground">
            Quick feedback helps tune variation quality and future rewriting guidance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => submitFeedback("positive")}
            disabled={submitted || sending}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            <ThumbsUp className="h-4 w-4" />
            Helpful
          </button>
          <button
            type="button"
            onClick={() => submitFeedback("negative")}
            disabled={submitted || sending}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            <ThumbsDown className="h-4 w-4" />
            Needs work
          </button>
        </div>
      </div>

      {!submitted ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {FEEDBACK_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => submitFeedback("negative", reason)}
              disabled={sending}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-card disabled:opacity-50"
            >
              {reason}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs font-medium text-emerald-600">
          Feedback saved for this result.
        </p>
      )}
    </div>
  );
}
