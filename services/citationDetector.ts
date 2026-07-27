export type CitationStyle = "apa" | "ieee" | "doi" | "url" | "mla" | "chicago" | "unknown";

export interface DetectedCitation {
  text: string;
  start: number;
  end: number;
  style: CitationStyle;
  authors?: string;
  year?: string;
  doi?: string;
  url?: string;
}

export interface ReferenceEntry {
  text: string;
  authors?: string;
  year?: string;
  title?: string;
  doi?: string;
  url?: string;
}

export interface CitationAnalysis {
  citations: DetectedCitation[];
  references: ReferenceEntry[];
  citedSources: MatchedCitation[];
  uncitedSources: UncitedSource[];
  coveragePercent: number;
}

export interface MatchedCitation {
  citation: DetectedCitation;
  matchedReference?: ReferenceEntry;
  matchedPlagiarismSource?: string;
}

export interface UncitedSource {
  sourceUrl: string;
  sourceTitle?: string;
  snippet: string;
  matchId: string;
  similarity: number;
}

const APA_INLINE = /\(([A-Z][a-zA-Z'-]+(?:\s(?:&|and)\s[A-Z][a-zA-Z'-]+)*(?:\s+et\s+al\.)?),?\s*(\d{4}[a-z]?)\)/g;

const APA_NARRATIVE = /([A-Z][a-zA-Z'-]+(?:\s(?:&|and)\s[A-Z][a-zA-Z'-]+)*(?:\s+et\s+al\.)?)\s*\((\d{4}[a-z]?)\)/g;

const IEEE_CITATION = /\[(\d+(?:\s*[,\-–]\s*\d+)*)\]/g;

const DOI_PATTERN = /(?:https?:\/\/)?(?:dx\.)?doi\.org\/10\.\d{4,9}\/[^\s,;)}\]]+|10\.\d{4,9}\/[^\s,;)}\]]+/gi;

const URL_CITATION = /(?:Retrieved from|Available at|Accessed at|See)\s+(https?:\/\/[^\s,;)}\]]+)/gi;

function detectAPACitations(text: string): DetectedCitation[] {
  const results: DetectedCitation[] = [];
  const seen = new Set<string>();

  for (const pattern of [APA_INLINE, APA_NARRATIVE]) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const key = `${match.index}-${match.index + match[0].length}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
        style: "apa",
        authors: match[1],
        year: match[2],
      });
    }
  }

  return results;
}

function detectIEEECitations(text: string): DetectedCitation[] {
  const results: DetectedCitation[] = [];
  const regex = new RegExp(IEEE_CITATION.source, IEEE_CITATION.flags);
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const numStr = match[1];
    const nums = numStr.split(/\s*[,\-–]\s*/).map(Number);
    if (nums.some((n) => n > 200 || n < 1)) continue;

    results.push({
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
      style: "ieee",
    });
  }
  return results;
}

function detectDOICitations(text: string): DetectedCitation[] {
  const results: DetectedCitation[] = [];
  const regex = new RegExp(DOI_PATTERN.source, DOI_PATTERN.flags);
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    results.push({
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
      style: "doi",
      doi: match[0].replace(/^https?:\/\/(?:dx\.)?doi\.org\//, ""),
    });
  }
  return results;
}

function detectURLCitations(text: string): DetectedCitation[] {
  const results: DetectedCitation[] = [];
  const regex = new RegExp(URL_CITATION.source, URL_CITATION.flags);
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    results.push({
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
      style: "url",
      url: match[1],
    });
  }
  return results;
}

export function detectCitations(text: string): DetectedCitation[] {
  if (!text) return [];

  const all: DetectedCitation[] = [
    ...detectAPACitations(text),
    ...detectIEEECitations(text),
    ...detectDOICitations(text),
    ...detectURLCitations(text),
  ];

  all.sort((a, b) => a.start - b.start);

  const merged: DetectedCitation[] = [];
  for (const citation of all) {
    const last = merged[merged.length - 1];
    if (last && citation.start < last.end) {
      if (citation.end > last.end) {
        last.end = citation.end;
        last.text = text.substring(last.start, last.end);
      }
    } else {
      merged.push({ ...citation });
    }
  }

  return merged;
}

export function extractReferences(text: string): ReferenceEntry[] {
  const refPattern = /^[ \t]*(References|Bibliography|Works Cited|Literature Cited)\s*:?\s*$/im;
  const match = text.match(refPattern);
  if (!match || match.index === undefined) return [];

  const refsSection = text.substring(match.index + match[0].length).trim();
  if (!refsSection) return [];

  const entries = refsSection
    .split(/\n\s*\n|\n(?=\[\d+\])|(?<=\.)\s*\n(?=[A-Z])/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 10);

  return entries.map((entry) => {
    const ref: ReferenceEntry = { text: entry };

    const authorMatch = entry.match(/^([A-Z][a-zA-Z'-]+(?:,\s*[A-Z]\.(?:\s*[A-Z]\.)*)?(?:(?:,?\s*(?:&|and)\s*)?[A-Z][a-zA-Z'-]+(?:,\s*[A-Z]\.(?:\s*[A-Z]\.)*)?)*)/);
    if (authorMatch) ref.authors = authorMatch[1];

    const yearMatch = entry.match(/\((\d{4}[a-z]?)\)/);
    if (yearMatch) ref.year = yearMatch[1];

    const doiMatch = entry.match(/10\.\d{4,9}\/[^\s,;)}\]]+/);
    if (doiMatch) ref.doi = doiMatch[0];

    const urlMatch = entry.match(/https?:\/\/[^\s,;)}\]]+/);
    if (urlMatch) ref.url = urlMatch[0];

    return ref;
  });
}

export function analyzeCitations(
  text: string,
  plagiarismSources?: Array<{
    url?: string;
    title?: string;
    snippet?: string;
    matchId?: string;
    similarity?: number;
  }>
): CitationAnalysis {
  if (!text) {
    return {
      citations: [],
      references: [],
      citedSources: [],
      uncitedSources: [],
      coveragePercent: 100,
    };
  }

  const citations = detectCitations(text);
  const references = extractReferences(text);

  const citedSources: MatchedCitation[] = citations.map((citation) => {
    const matchedRef = references.find((ref) => {
      if (citation.year && ref.year && citation.year !== ref.year) return false;
      if (citation.authors && ref.authors) {
        const citeSurname = citation.authors.split(/\s/)[0].replace(/,/, "");
        return ref.authors.includes(citeSurname);
      }
      if (citation.doi && ref.doi) {
        return citation.doi === ref.doi;
      }
      return false;
    });

    return {
      citation,
      matchedReference: matchedRef,
    };
  });

  const uncitedSources: UncitedSource[] = [];
  if (plagiarismSources?.length) {
    for (const source of plagiarismSources) {
      if (!source.snippet) continue;

      const snippetLower = source.snippet.toLowerCase();
      const isCited = citations.some((c) => {
        const citationContext = text.substring(
          Math.max(0, c.start - 200),
          Math.min(text.length, c.end + 200)
        ).toLowerCase();
        const snippetWords = snippetLower.split(/\s+/).filter((w) => w.length > 4);
        const matchingWords = snippetWords.filter((w) => citationContext.includes(w));
        return matchingWords.length / snippetWords.length > 0.4;
      });

      if (!isCited) {
        uncitedSources.push({
          sourceUrl: source.url || "",
          sourceTitle: source.title,
          snippet: source.snippet,
          matchId: source.matchId || "",
          similarity: source.similarity || 0,
        });
      }
    }
  }

  const totalSources = (plagiarismSources?.length || 0);
  const citedCount = totalSources - uncitedSources.length;
  const coveragePercent = totalSources > 0
    ? Math.round((citedCount / totalSources) * 100)
    : 100;

  return {
    citations,
    references,
    citedSources,
    uncitedSources,
    coveragePercent,
  };
}
