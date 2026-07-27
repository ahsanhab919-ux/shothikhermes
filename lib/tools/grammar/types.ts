// Grammar check types
export interface GrammarIssue {
  id: string;
  type: "grammar" | "spelling" | "style" | "punctuation";
  message: string;
  suggestion: string;
  startIndex: number;
  endIndex: number;
  context: string;
  severity: "low" | "medium" | "high";
}

export interface GrammarCorrection {
  original: string;
  corrected: string;
  explanation: string;
}

export interface GrammarCheckResult {
  success: boolean;
  text: string;
  issues: GrammarIssue[];
  corrections: GrammarCorrection[];
  correctedText: string;
  cost: number;
  remainingCredits: number;
}

export interface GrammarCheckRequest {
  text: string;
  language?: string;
}
