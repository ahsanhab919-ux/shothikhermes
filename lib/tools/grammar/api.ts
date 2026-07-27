import { GrammarCheckResult, GrammarCheckRequest } from "./types";

const API_URL = "/api/tools/grammar";

export async function checkGrammar(
  request: GrammarCheckRequest
): Promise<GrammarCheckResult> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to check grammar");
  }

  return response.json();
}

export async function applyCorrection(
  text: string,
  issue: { startIndex: number; endIndex: number; suggestion: string }
): Promise<string> {
  return (
    text.slice(0, issue.startIndex) +
    issue.suggestion +
    text.slice(issue.endIndex)
  );
}

export async function applyAllCorrections(
  text: string,
  issues: Array<{ startIndex: number; endIndex: number; suggestion: string }>
): Promise<string> {
  // Sort by position (descending) to avoid index shifts
  const sortedIssues = [...issues].sort((a, b) => b.startIndex - a.startIndex);
  
  let result = text;
  for (const issue of sortedIssues) {
    result = await applyCorrection(result, issue);
  }
  
  return result;
}
