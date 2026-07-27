export type ExcludedRegionType = "latex" | "code" | "reference" | "quote";

export interface ExcludedRegion {
  start: number;
  end: number;
  type: ExcludedRegionType;
  content: string;
}

export interface PreprocessResult {
  processedText: string;
  excludedRegions: ExcludedRegion[];
  originalText: string;
  stats: {
    latexCount: number;
    codeBlockCount: number;
    referenceStripped: boolean;
    quotesStripped: number;
    totalExcludedChars: number;
  };
}

export interface PreprocessOptions {
  excludeLatex?: boolean;
  excludeCode?: boolean;
  excludeReferences?: boolean;
  excludeQuotes?: boolean;
}

const LATEX_DISPLAY_PATTERN = /\$\$[\s\S]*?\$\$/g;

const LATEX_INLINE_PATTERN = /(?<!\$)\$(?!\$)(?!\s)([^$\n]+?)(?<!\s)\$(?!\$)/g;

const LATEX_ENV_PATTERN = /\\begin\{(\w+\*?)\}[\s\S]*?\\end\{\1\}/g;

const LATEX_COMMAND_PATTERN = /\\(?:frac|sqrt|sum|prod|int|lim|infty|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|sigma|omega|partial|nabla|forall|exists|in|notin|subset|supset|cup|cap|times|cdot|leq|geq|neq|approx|equiv|rightarrow|leftarrow|Rightarrow|Leftarrow|overline|underline|hat|tilde|vec|dot|ddot|mathbb|mathcal|mathfrak|mathrm|text|operatorname|binom|choose|pmatrix|bmatrix|vmatrix|det|log|ln|sin|cos|tan|sec|csc|cot|arcsin|arccos|arctan|sinh|cosh|tanh|sup|inf|max|min|arg|gcd|mod|Pr|hom|ker|dim|deg|exp|Re|Im|wp|emptyset|varnothing|neg|wedge|vee|oplus|otimes|oint|iint|iiint|overset|underset|stackrel|xleftarrow|xrightarrow|cancel|bcancel|xcancel|sout|boxed|colorbox|textcolor|color|displaystyle|textstyle|scriptstyle|scriptscriptstyle|left|right|big|Big|bigg|Bigg|langle|rangle|lceil|rceil|lfloor|rfloor|pmod|bmod)\{[^}]*\}/g;

const LATEX_BRACKET_PATTERN = /\\\[[\s\S]*?\\\]/g;
const LATEX_PAREN_PATTERN = /\\\([\s\S]*?\\\)/g;

const CODE_FENCED_PATTERN = /```[\s\S]*?```/g;

const CODE_BACKTICK_PATTERN = /`[^`\n]+`/g;

function detectIndentedCodeBlocks(text: string): ExcludedRegion[] {
  const regions: ExcludedRegion[] = [];
  const lines = text.split("\n");
  let blockStart = -1;
  let blockOffset = 0;
  let currentOffset = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isIndented = /^(?:\t| {4})/.test(line) && line.trim().length > 0;
    const isEmpty = line.trim().length === 0;

    if (isIndented && blockStart === -1) {
      blockStart = currentOffset;
      blockOffset = currentOffset;
    } else if (!isIndented && !isEmpty && blockStart !== -1) {
      const blockEnd = currentOffset;
      const content = text.substring(blockStart, blockEnd).trim();
      if (content.length > 20 && looksLikeCode(content)) {
        regions.push({
          start: blockStart,
          end: blockEnd,
          type: "code",
          content,
        });
      }
      blockStart = -1;
    }

    currentOffset += line.length + 1;
  }

  if (blockStart !== -1) {
    const content = text.substring(blockStart).trim();
    if (content.length > 20 && looksLikeCode(content)) {
      regions.push({
        start: blockStart,
        end: text.length,
        type: "code",
        content,
      });
    }
  }

  return regions;
}

function looksLikeCode(text: string): boolean {
  const codeIndicators = [
    /[{};]/,
    /\b(?:function|const|let|var|if|else|for|while|return|import|export|class|def|print|void|int|float|double|string|bool|elif|except|finally|yield|async|await|lambda|struct|enum|impl|fn|pub|mod|use|match|trait)\b/,
    /(?:=>|->|::|\|\||&&|<-|%>%|\|>)/,
    /^\s*(?:#include|#define|#ifdef|#ifndef)/m,
    /^\s*(?:\/\/|#|%|--)\s/m,
    /\.\w+\(/,
    /\w+\s*=\s*\w+\s*\(/,
    /\[\s*\d+\s*\]/,
    /^\s*(?:library|require|install\.packages|data\.frame|ggplot|mutate|filter|summarize|select)\s*\(/m,
    /^\s*(?:numpy|pandas|matplotlib|scipy|sklearn|torch|tensorflow)\b/m,
    /^\s*(?:figure|plot|xlabel|ylabel|title|legend|subplot|imshow|scatter|histogram)\s*\(/m,
  ];

  let matches = 0;
  for (const indicator of codeIndicators) {
    if (indicator.test(text)) matches++;
  }

  return matches >= 2;
}

function detectLatex(text: string): ExcludedRegion[] {
  const regions: ExcludedRegion[] = [];
  const seen = new Set<string>();

  const addRegion = (match: RegExpExecArray) => {
    const key = `${match.index}-${match.index + match[0].length}`;
    if (seen.has(key)) return;
    seen.add(key);
    regions.push({
      start: match.index,
      end: match.index + match[0].length,
      type: "latex",
      content: match[0],
    });
  };

  const patterns = [
    LATEX_ENV_PATTERN,
    LATEX_DISPLAY_PATTERN,
    LATEX_BRACKET_PATTERN,
    LATEX_PAREN_PATTERN,
    LATEX_INLINE_PATTERN,
    LATEX_COMMAND_PATTERN,
  ];

  for (const pattern of patterns) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      addRegion(match);
    }
  }

  return regions;
}

function detectCodeBlocks(text: string): ExcludedRegion[] {
  const regions: ExcludedRegion[] = [];

  const fencedRegex = new RegExp(CODE_FENCED_PATTERN.source, CODE_FENCED_PATTERN.flags);
  let match: RegExpExecArray | null;
  while ((match = fencedRegex.exec(text)) !== null) {
    regions.push({
      start: match.index,
      end: match.index + match[0].length,
      type: "code",
      content: match[0],
    });
  }

  const backtickRegex = new RegExp(CODE_BACKTICK_PATTERN.source, CODE_BACKTICK_PATTERN.flags);
  while ((match = backtickRegex.exec(text)) !== null) {
    const isInFenced = regions.some(
      (r) => match!.index >= r.start && match!.index + match![0].length <= r.end
    );
    if (!isInFenced) {
      regions.push({
        start: match.index,
        end: match.index + match[0].length,
        type: "code",
        content: match[0],
      });
    }
  }

  const indented = detectIndentedCodeBlocks(text);
  for (const block of indented) {
    const overlaps = regions.some(
      (r) =>
        (block.start >= r.start && block.start < r.end) ||
        (block.end > r.start && block.end <= r.end)
    );
    if (!overlaps) {
      regions.push(block);
    }
  }

  return regions;
}

function detectReferences(text: string): ExcludedRegion | null {
  const pattern = /^[ \t]*(References|Bibliography|Works Cited|Literature Cited)\s*:?\s*$/im;
  const match = text.match(pattern);
  if (match && match.index !== undefined) {
    return {
      start: match.index,
      end: text.length,
      type: "reference",
      content: text.substring(match.index),
    };
  }
  return null;
}

function detectQuotes(text: string): ExcludedRegion[] {
  const regions: ExcludedRegion[] = [];
  const quotePatterns = [
    /"[^"]*"/gs,
    /'[^']*'/gs,
    /\u201c[^\u201d]*\u201d/gs,
    /\u2018[^\u2019]*\u2019/gs,
  ];

  for (const pattern of quotePatterns) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      if (match[0].length > 2) {
        regions.push({
          start: match.index,
          end: match.index + match[0].length,
          type: "quote",
          content: match[0],
        });
      }
    }
  }

  return regions;
}

function mergeOverlappingRegions(regions: ExcludedRegion[]): ExcludedRegion[] {
  if (regions.length <= 1) return regions;

  const sorted = [...regions].sort((a, b) => a.start - b.start || b.end - a.end);
  const merged: ExcludedRegion[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      if (current.end > last.end) {
        last.end = current.end;
        last.content = last.content + current.content.substring(last.end - current.start);
      }
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}

function buildProcessedText(
  originalText: string,
  excludedRegions: ExcludedRegion[]
): string {
  if (excludedRegions.length === 0) return originalText;

  const sorted = [...excludedRegions].sort((a, b) => a.start - b.start);
  let result = "";
  let lastEnd = 0;

  for (const region of sorted) {
    if (region.start > lastEnd) {
      result += originalText.substring(lastEnd, region.start);
    }
    lastEnd = Math.max(lastEnd, region.end);
  }

  if (lastEnd < originalText.length) {
    result += originalText.substring(lastEnd);
  }

  return result.replace(/\s{2,}/g, " ").trim();
}

export function preprocessText(
  text: string,
  options: PreprocessOptions = {}
): PreprocessResult {
  const {
    excludeLatex = false,
    excludeCode = false,
    excludeReferences = false,
    excludeQuotes = false,
  } = options;

  if (!text || text.trim().length === 0) {
    return {
      processedText: text || "",
      excludedRegions: [],
      originalText: text || "",
      stats: {
        latexCount: 0,
        codeBlockCount: 0,
        referenceStripped: false,
        quotesStripped: 0,
        totalExcludedChars: 0,
      },
    };
  }

  const allRegions: ExcludedRegion[] = [];
  let latexCount = 0;
  let codeBlockCount = 0;
  let referenceStripped = false;
  let quotesStripped = 0;

  try {
    if (excludeLatex) {
      const latexRegions = detectLatex(text);
      latexCount = latexRegions.length;
      allRegions.push(...latexRegions);
    }

    if (excludeCode) {
      const codeRegions = detectCodeBlocks(text);
      codeBlockCount = codeRegions.length;
      allRegions.push(...codeRegions);
    }

    if (excludeReferences) {
      const refRegion = detectReferences(text);
      if (refRegion) {
        referenceStripped = true;
        allRegions.push(refRegion);
      }
    }

    if (excludeQuotes) {
      const quoteRegions = detectQuotes(text);
      quotesStripped = quoteRegions.length;
      allRegions.push(...quoteRegions);
    }
  } catch {
    return {
      processedText: text,
      excludedRegions: [],
      originalText: text,
      stats: {
        latexCount: 0,
        codeBlockCount: 0,
        referenceStripped: false,
        quotesStripped: 0,
        totalExcludedChars: 0,
      },
    };
  }

  const mergedRegions = mergeOverlappingRegions(allRegions);
  const processedText = buildProcessedText(text, mergedRegions);
  const totalExcludedChars = mergedRegions.reduce(
    (sum, r) => sum + (r.end - r.start),
    0
  );

  return {
    processedText,
    excludedRegions: mergedRegions,
    originalText: text,
    stats: {
      latexCount,
      codeBlockCount,
      referenceStripped,
      quotesStripped,
      totalExcludedChars,
    },
  };
}

export interface STEMMaskResult {
  maskedText: string;
  mapping: Record<string, string>;
  regionCount: number;
}

export interface STEMUnmaskResult {
  text: string;
  validationPassed: boolean;
  missingPlaceholders: string[];
  duplicatedPlaceholders: string[];
}

export function maskSTEMRegions(text: string): STEMMaskResult {
  if (!text || text.trim().length === 0) {
    return { maskedText: text || "", mapping: {}, regionCount: 0 };
  }

  const allRegions: ExcludedRegion[] = [];
  const latexRegions = detectLatex(text);
  const codeRegions = detectCodeBlocks(text);
  allRegions.push(...latexRegions, ...codeRegions);

  const merged = mergeOverlappingRegions(allRegions);

  if (merged.length === 0) {
    return { maskedText: text, mapping: {}, regionCount: 0 };
  }

  const mapping: Record<string, string> = {};

  const sorted = [...merged].sort((a, b) => a.start - b.start);
  const filtered: ExcludedRegion[] = [];
  let lastEnd = -1;
  for (const region of sorted) {
    if (region.start >= lastEnd) {
      filtered.push(region);
      lastEnd = region.end;
    }
  }

  let counter = 1;
  let result = "";
  let cursor = 0;

  for (const region of filtered) {
    const gap = text.substring(cursor, region.start);
    result += gap.replace(/\[STEM_\d+\]/g, (match) => `\\${match}`);

    const placeholder = `[STEM_${counter}]`;
    const original = text.substring(region.start, region.end);
    mapping[`STEM_${counter}`] = original;
    result += placeholder;
    counter++;
    cursor = region.end;
  }

  const tail = text.substring(cursor);
  result += tail.replace(/\[STEM_\d+\]/g, (match) => `\\${match}`);

  return { maskedText: result, mapping, regionCount: counter - 1 };
}

export function unmaskSTEMRegions(
  paraphrasedText: string,
  mapping: Record<string, string>
): STEMUnmaskResult {
  if (!paraphrasedText || Object.keys(mapping).length === 0) {
    return {
      text: paraphrasedText || "",
      validationPassed: true,
      missingPlaceholders: [],
      duplicatedPlaceholders: [],
    };
  }

  let result = paraphrasedText;
  const missing: string[] = [];
  const duplicated: string[] = [];

  for (const [key, original] of Object.entries(mapping)) {
    const placeholder = `[${key}]`;
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const occurrences = (
      result.match(new RegExp(`\\[${escapedKey}\\]`, "g")) || []
    ).length;

    if (occurrences === 0) {
      missing.push(key);
    } else if (occurrences > 1) {
      duplicated.push(key);
      result = result.replace(placeholder, original);
    } else {
      result = result.replace(placeholder, original);
    }
  }

  result = result.replace(/\\\[STEM_\d+\]/g, (match) => match.substring(1));

  return {
    text: result,
    validationPassed: missing.length === 0 && duplicated.length === 0,
    missingPlaceholders: missing,
    duplicatedPlaceholders: duplicated,
  };
}

export function detectSTEMContent(text: string): {
  hasLatex: boolean;
  hasCode: boolean;
  latexCount: number;
  codeBlockCount: number;
} {
  if (!text) {
    return { hasLatex: false, hasCode: false, latexCount: 0, codeBlockCount: 0 };
  }

  const latexRegions = detectLatex(text);
  const codeRegions = detectCodeBlocks(text);

  return {
    hasLatex: latexRegions.length > 0,
    hasCode: codeRegions.length > 0,
    latexCount: latexRegions.length,
    codeBlockCount: codeRegions.length,
  };
}

export interface MaskValidationResult {
  isValid: boolean;
  totalPlaceholders: number;
  survivedPlaceholders: number;
  missingPlaceholders: string[];
  duplicatedPlaceholders: string[];
  corruptedPlaceholders: string[];
  recoveryPossible: boolean;
}

export function validateMaskRoundTrip(
  originalMapping: Record<string, string>,
  aiOutput: string
): MaskValidationResult {
  const totalPlaceholders = Object.keys(originalMapping).length;
  const missing: string[] = [];
  const duplicated: string[] = [];
  const corrupted: string[] = [];
  let survived = 0;

  for (const key of Object.keys(originalMapping)) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\[${escapedKey}\\]`, "g");
    const matches = aiOutput.match(regex) || [];

    if (matches.length === 0) {
      missing.push(key);
    } else if (matches.length === 1) {
      survived++;
    } else {
      duplicated.push(key);
      survived++;
    }
  }

  const partialPattern = /\[STEM_\d+/g;
  const partials = aiOutput.match(partialPattern) || [];
  for (const partial of partials) {
    const fullMatch = `${partial}]`;
    if (!aiOutput.includes(fullMatch)) {
      corrupted.push(partial);
    }
  }

  const recoveryPossible = missing.length <= Math.ceil(totalPlaceholders * 0.2);

  return {
    isValid: missing.length === 0 && duplicated.length === 0 && corrupted.length === 0,
    totalPlaceholders,
    survivedPlaceholders: survived,
    missingPlaceholders: missing,
    duplicatedPlaceholders: duplicated,
    corruptedPlaceholders: corrupted,
    recoveryPossible,
  };
}

export function unmaskWithRecovery(
  paraphrasedText: string,
  mapping: Record<string, string>,
  originalText: string
): STEMUnmaskResult & { recovered: boolean; recoveryMethod?: string } {
  const validation = validateMaskRoundTrip(mapping, paraphrasedText);

  if (validation.isValid) {
    const result = unmaskSTEMRegions(paraphrasedText, mapping);
    return { ...result, recovered: false };
  }

  if (!validation.recoveryPossible) {
    return {
      text: originalText,
      validationPassed: false,
      missingPlaceholders: validation.missingPlaceholders,
      duplicatedPlaceholders: validation.duplicatedPlaceholders,
      recovered: true,
      recoveryMethod: "original_text_fallback",
    };
  }

  let result = paraphrasedText;

  for (const [key, original] of Object.entries(mapping)) {
    const placeholder = `[${key}]`;
    if (result.includes(placeholder)) {
      result = result.replace(placeholder, original);
    }
  }

  for (const key of validation.missingPlaceholders) {
    const original = mapping[key];
    if (original && !result.includes(original)) {
      result = result + " " + original;
    }
  }

  result = result.replace(/\\\[STEM_\d+\]/g, (match) => match.substring(1));

  return {
    text: result.trim(),
    validationPassed: false,
    missingPlaceholders: validation.missingPlaceholders,
    duplicatedPlaceholders: validation.duplicatedPlaceholders,
    recovered: true,
    recoveryMethod: "partial_recovery",
  };
}
