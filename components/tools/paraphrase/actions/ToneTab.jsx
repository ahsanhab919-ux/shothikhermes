import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const redirectPrefix = "p-v2";
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL + "/" + redirectPrefix + "/api";

const METRICS = [
  { key: "casualFormal", labels: ["Casual", "Formal"] },
  { key: "unfriendlyFriendly", labels: ["Unfriendly", "Friendly"] },
  { key: "wordyConcise", labels: ["Wordy", "Concise"] },
  { key: "complexSimple", labels: ["Complex", "Simple"] },
];

const ToneTab = ({ text, plainOutput }) => {
  const { accessToken } = useSelector((state) => state.auth);

  const originalText = text;
  const paraphrasedText = plainOutput;

  const [scores, setScores] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!originalText || !paraphrasedText) return;

    setLoading(true);
    setError(null);

    async function fetchScores() {
      try {
        const res = await fetch(`${API_BASE}/tone/check`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ originalText, paraphrasedText }),
        });
        if (!res.ok) {
          throw new Error(`API returned status ${res.status}`);
        }
        const data = await res.json();
        setScores(data);
      } catch (err) {
        console.error("Error fetching tone scores", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchScores();
  }, [originalText, paraphrasedText, accessToken]);

  return (
    <div className="w-full px-2 py-1">
      {/* Header */}
      <div className="mb-1 text-sm font-bold">Tone</div>

      {/* Legend */}
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <div className="bg-muted-foreground size-2 rounded-full" />
          <div className="text-sm">Original</div>
        </div>
        <div className="flex items-center gap-1">
          <div className="bg-primary size-2 rounded-full" />
          <div className="text-sm">Paraphrased</div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-4">
          <div className="border-muted-foreground/30 border-t-primary inline-block size-6 animate-spin rounded-full border-2" />
        </div>
      )}

      {/* Error */}
      {error && <div className="text-destructive text-xs">{error}</div>}

      {/* Score Cards */}
      {scores && (
        <div className="flex flex-col gap-2">
          {METRICS?.map(({ key, labels }) => {
            // Expect scores in range 0–100
            const origScore = Math.max(
              0,
              Math.min(100, Number(scores.original?.[key] ?? 0)),
            );
            const paraScore = Math.max(
              0,
              Math.min(100, Number(scores.paraphrased?.[key] ?? 0)),
            );

            return (
              <Card key={key} className="bg-muted/30 shadow-sm rounded-xl">
                <CardContent className="px-2 py-1.5">
                  <div className="flex flex-col gap-1">
                    {/* Original bar */}
                    <div className="bg-muted relative h-2 overflow-hidden rounded">
                      <div
                        className="bg-muted-foreground absolute top-0 left-0 h-full"
                        style={{ width: `${origScore}%` }}
                      />
                    </div>
                    {/* Paraphrased bar */}
                    <div className="bg-primary/20 relative h-2 overflow-hidden rounded">
                      <div
                        className="bg-primary absolute top-0 left-0 h-full"
                        style={{ width: `${paraScore}%` }}
                      />
                    </div>
                    {/* Labels */}
                    <div className="flex justify-between">
                      <div className="text-xs" title={labels[0]}>
                        {labels[0]}
                      </div>
                      <div className="text-xs" title={labels[1]}>
                        {labels[1]}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ToneTab;
