import { getMetricsSnapshot } from "@/lib/runtime-metrics";

export function getDocumentParsingMetricsSnapshot() {
  const snapshot = getMetricsSnapshot();
  const counters = Object.fromEntries(
    Object.entries(snapshot.counters).filter(([name]) => name.startsWith("pdf_extract.")),
  );
  const gauges = Object.fromEntries(
    Object.entries(snapshot.gauges).filter(([name]) => name.startsWith("pdf_extract.")),
  );

  return {
    collectedAt: snapshot.collectedAt,
    uptimeMs: snapshot.uptimeMs,
    counters,
    gauges,
  };
}

