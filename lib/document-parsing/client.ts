export function getPdfExtractionRoute(): string {
  return process.env.NEXT_PUBLIC_EXTRACT_PDF_V2_ENABLED === "true"
    ? "/api/extract-pdf-v2"
    : "/api/extract-pdf";
}

