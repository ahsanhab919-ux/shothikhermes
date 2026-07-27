export type LiteParseMode = "off" | "shadow" | "primary";

export function getLiteParseMode(): LiteParseMode {
  const enabled = process.env.LITEPARSE_ENABLED === "true";
  const mode = process.env.LITEPARSE_MODE;

  if (!enabled) {
    return "off";
  }

  if (mode === "primary" || mode === "shadow") {
    return mode;
  }

  return "shadow";
}

export function getLiteParseConfig() {
  const ocrLanguage = process.env.LITEPARSE_OCR_LANGUAGE || "eng";
  const ocrServerUrl = process.env.LITEPARSE_OCR_SERVER_URL;
  const dpi = Number(process.env.LITEPARSE_DPI || 150);
  const maxPages = Number(process.env.LITEPARSE_MAX_PAGES || 40);
  const numWorkers = Number(process.env.LITEPARSE_NUM_WORKERS || 1);

  return {
    ocrEnabled: process.env.LITEPARSE_DISABLE_OCR !== "true",
    ocrLanguage,
    ocrServerUrl,
    dpi: Number.isFinite(dpi) ? dpi : 150,
    maxPages: Number.isFinite(maxPages) ? maxPages : 40,
    numWorkers: Number.isFinite(numWorkers) ? numWorkers : 1,
    outputFormat: "json" as const,
  };
}
