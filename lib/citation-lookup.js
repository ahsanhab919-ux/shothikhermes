const SEMANTIC_SCHOLAR_BASE = "https://api.semanticscholar.org/graph/v1";
const SEMANTIC_SCHOLAR_FIELDS = "paperId,title,authors,year,citationCount,abstract,venue,publicationVenue,externalIds,isOpenAccess,openAccessPdf,tldr,fieldsOfStudy";

let lastSemanticScholarCall = 0;
const RATE_LIMIT_MS = 150;

async function rateLimitedFetch(url, options = {}) {
  const now = Date.now();
  const elapsed = now - lastSemanticScholarCall;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS - elapsed));
  }
  lastSemanticScholarCall = Date.now();
  if (options.signal?.aborted) throw new DOMException("Aborted", "AbortError");
  return fetch(url, options);
}

function normalizeSemanticScholarResult(paper) {
  const authors = (paper.authors || []).map((a) => {
    const name = a.name || "";
    const parts = name.split(" ");
    return {
      given: parts.slice(0, -1).join(" "),
      family: parts[parts.length - 1] || "",
    };
  });

  return {
    source: "semanticscholar",
    paperId: paper.paperId,
    doi: paper.externalIds?.DOI || "",
    title: paper.title || "Untitled",
    authors,
    year: paper.year || "",
    journal: paper.venue || paper.publicationVenue?.name || "",
    citationCount: paper.citationCount || 0,
    abstract: paper.abstract || "",
    tldr: paper.tldr?.text || "",
    isOpenAccess: paper.isOpenAccess || false,
    openAccessUrl: paper.openAccessPdf?.url || "",
    fieldsOfStudy: paper.fieldsOfStudy || [],
    type: "journal-article",
    volume: "",
    issue: "",
    pages: "",
    publisher: paper.publicationVenue?.name || "",
  };
}

export async function searchSemanticScholar(query, limit = 5, signal = null) {
  const encoded = encodeURIComponent(query);
  const url = `${SEMANTIC_SCHOLAR_BASE}/paper/search?query=${encoded}&limit=${limit}&fields=${SEMANTIC_SCHOLAR_FIELDS}`;

  try {
    const response = await rateLimitedFetch(url, { signal });

    if (!response.ok) {
      if (response.status === 429) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const retryResponse = await rateLimitedFetch(url, { signal });
        if (!retryResponse.ok) return [];
        const retryData = await retryResponse.json();
        return (retryData.data || []).map(normalizeSemanticScholarResult);
      }
      return [];
    }

    const data = await response.json();
    return (data.data || []).map(normalizeSemanticScholarResult);
  } catch {
    return [];
  }
}

export async function getSemanticScholarPaper(paperId) {
  const url = `${SEMANTIC_SCHOLAR_BASE}/paper/${paperId}?fields=${SEMANTIC_SCHOLAR_FIELDS}`;

  try {
    const response = await rateLimitedFetch(url);
    if (!response.ok) return null;

    const paper = await response.json();
    return normalizeSemanticScholarResult(paper);
  } catch {
    return null;
  }
}

export async function getSemanticScholarRecommendations(paperId, limit = 5, signal = null) {
  const url = `https://api.semanticscholar.org/recommendations/v1/papers/forpaper/${paperId}?limit=${limit}&fields=${SEMANTIC_SCHOLAR_FIELDS}`;

  try {
    const response = await rateLimitedFetch(url, { signal });
    if (!response.ok) return [];

    const data = await response.json();
    return (data.recommendedPapers || []).map(normalizeSemanticScholarResult);
  } catch {
    return [];
  }
}

export async function searchSemanticScholarByDOI(doi) {
  const cleanDoi = doi.replace(/^(https?:\/\/)?(dx\.)?doi\.org\//, "");
  const url = `${SEMANTIC_SCHOLAR_BASE}/paper/DOI:${encodeURIComponent(cleanDoi)}?fields=${SEMANTIC_SCHOLAR_FIELDS}`;

  try {
    const response = await rateLimitedFetch(url);
    if (!response.ok) return null;

    const paper = await response.json();
    return normalizeSemanticScholarResult(paper);
  } catch {
    return null;
  }
}

export async function searchCrossRef(query, type = "works") {
  const encoded = encodeURIComponent(query);
  const url = `https://api.crossref.org/works?query=${encoded}&rows=5&select=DOI,title,author,published-print,published-online,container-title,volume,issue,page,publisher,type`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("CrossRef API error");
    }

    const data = await response.json();

    return data.message.items.map((item) => ({
      source: "crossref",
      doi: item.DOI,
      title: item.title?.[0] || "Untitled",
      authors:
        item.author?.map((a) => ({
          given: a.given || "",
          family: a.family || "",
        })) || [],
      year:
        item["published-print"]?.["date-parts"]?.[0]?.[0] ||
        item["published-online"]?.["date-parts"]?.[0]?.[0] ||
        "",
      journal: item["container-title"]?.[0] || "",
      volume: item.volume || "",
      issue: item.issue || "",
      pages: item.page || "",
      publisher: item.publisher || "",
      type: item.type || "journal-article",
    }));
  } catch {
    return [];
  }
}

export async function searchOpenLibrary(query) {
  const encoded = encodeURIComponent(query);
  const url = `https://openlibrary.org/search.json?q=${encoded}&limit=5&fields=key,title,author_name,first_publish_year,publisher,isbn,number_of_pages_median`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Open Library API error");
    }

    const data = await response.json();

    return data.docs.map((item) => ({
      source: "openlibrary",
      key: item.key,
      title: item.title || "Untitled",
      authors:
        item.author_name?.map((name) => {
          const parts = name.split(" ");
          return {
            given: parts.slice(0, -1).join(" "),
            family: parts[parts.length - 1] || "",
          };
        }) || [],
      year: item.first_publish_year || "",
      publisher: item.publisher?.[0] || "",
      isbn: item.isbn?.[0] || "",
      pages: item.number_of_pages_median || "",
      type: "book",
    }));
  } catch {
    return [];
  }
}

export async function lookupByDOI(doi) {
  const ssPaper = await searchSemanticScholarByDOI(doi);
  if (ssPaper) return ssPaper;

  const cleanDoi = doi.replace(/^(https?:\/\/)?(dx\.)?doi\.org\//, "");
  const url = `https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const item = data.message;

    return {
      source: "crossref",
      doi: item.DOI,
      title: item.title?.[0] || "Untitled",
      authors:
        item.author?.map((a) => ({
          given: a.given || "",
          family: a.family || "",
        })) || [],
      year:
        item["published-print"]?.["date-parts"]?.[0]?.[0] ||
        item["published-online"]?.["date-parts"]?.[0]?.[0] ||
        "",
      journal: item["container-title"]?.[0] || "",
      volume: item.volume || "",
      issue: item.issue || "",
      pages: item.page || "",
      publisher: item.publisher || "",
      type: item.type || "journal-article",
    };
  } catch {
    return null;
  }
}

export async function lookupByISBN(isbn) {
  const cleanIsbn = isbn.replace(/[-\s]/g, "");
  const url = `https://openlibrary.org/isbn/${cleanIsbn}.json`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const item = await response.json();

    const authorsPromises = (item.authors || []).map(async (author) => {
      try {
        const authorRes = await fetch(
          `https://openlibrary.org${author.key}.json`
        );
        const authorData = await authorRes.json();
        const name = authorData.name || "";
        const parts = name.split(" ");
        return {
          given: parts.slice(0, -1).join(" "),
          family: parts[parts.length - 1] || "",
        };
      } catch {
        return { given: "", family: "" };
      }
    });

    const authors = await Promise.all(authorsPromises);

    return {
      source: "openlibrary",
      key: item.key,
      title: item.title || "Untitled",
      authors,
      year: item.publish_date ? new Date(item.publish_date).getFullYear() : "",
      publisher: item.publishers?.[0] || "",
      isbn: cleanIsbn,
      pages: item.number_of_pages || "",
      type: "book",
    };
  } catch {
    return null;
  }
}

const formatAuthorsAPA = (authors) => {
  if (!authors?.length) return "";
  if (authors.length === 1) {
    return `${authors[0].family}, ${authors[0].given?.charAt(0) || ""}.`;
  }
  if (authors.length === 2) {
    return `${authors[0].family}, ${authors[0].given?.charAt(0) || ""}., & ${authors[1].family}, ${authors[1].given?.charAt(0) || ""}.`;
  }
  return `${authors[0].family}, ${authors[0].given?.charAt(0) || ""}., et al.`;
};

const formatAuthorsMLA = (authors) => {
  if (!authors?.length) return "";
  if (authors.length === 1) {
    return `${authors[0].family}, ${authors[0].given}.`;
  }
  if (authors.length === 2) {
    return `${authors[0].family}, ${authors[0].given}, and ${authors[1].given} ${authors[1].family}.`;
  }
  return `${authors[0].family}, ${authors[0].given}, et al.`;
};

const formatAuthorsChicago = (authors) => {
  if (!authors?.length) return "";
  if (authors.length === 1) {
    return `${authors[0].family}, ${authors[0].given}.`;
  }
  if (authors.length <= 3) {
    const last = authors.length - 1;
    return (
      authors
        .map((a, i) => {
          if (i === 0) return `${a.family}, ${a.given}`;
          if (i === last) return ` and ${a.given} ${a.family}`;
          return `, ${a.given} ${a.family}`;
        })
        .join("") + "."
    );
  }
  return `${authors[0].family}, ${authors[0].given}, et al.`;
};

const formatAuthorsIEEE = (authors) => {
  if (!authors?.length) return "";
  return authors
    .map((a) => `${a.given?.charAt(0) || ""}. ${a.family}`)
    .join(", ");
};

const formatAuthorsHarvard = (authors) => {
  if (!authors?.length) return "";
  if (authors.length === 1) {
    return `${authors[0].family}, ${authors[0].given?.charAt(0) || ""}.`;
  }
  if (authors.length === 2) {
    return `${authors[0].family}, ${authors[0].given?.charAt(0) || ""}. and ${authors[1].family}, ${authors[1].given?.charAt(0) || ""}.`;
  }
  if (authors.length <= 3) {
    const last = authors.length - 1;
    return authors
      .map((a, i) => {
        const formatted = `${a.family}, ${a.given?.charAt(0) || ""}.`;
        if (i === last) return `and ${formatted}`;
        return formatted;
      })
      .join(" ");
  }
  return `${authors[0].family}, ${authors[0].given?.charAt(0) || ""}. et al.`;
};

const formatAuthorsVancouver = (authors) => {
  if (!authors?.length) return "";
  if (authors.length <= 6) {
    return authors
      .map((a) => `${a.family} ${a.given?.charAt(0) || ""}`)
      .join(", ");
  }
  return (
    authors
      .slice(0, 6)
      .map((a) => `${a.family} ${a.given?.charAt(0) || ""}`)
      .join(", ") + ", et al"
  );
};

export function formatCitation(item, style = "apa") {
  if (item.type === "book") {
    switch (style) {
      case "apa":
        return `${formatAuthorsAPA(item.authors)} (${item.year}). ${item.title}. ${item.publisher}.`;
      case "mla":
        return `${formatAuthorsMLA(item.authors)} ${item.title}. ${item.publisher}, ${item.year}.`;
      case "chicago":
        return `${formatAuthorsChicago(item.authors)} ${item.title}. ${item.publisher}, ${item.year}.`;
      case "ieee":
        return `${formatAuthorsIEEE(item.authors)}, ${item.title}. ${item.publisher}, ${item.year}.`;
      case "harvard":
        return `${formatAuthorsHarvard(item.authors)} (${item.year}) ${item.title}. ${item.publisher}.`;
      case "vancouver":
        return `${formatAuthorsVancouver(item.authors)}. ${item.title}. ${item.publisher}; ${item.year}.`;
      default:
        return `${formatAuthorsAPA(item.authors)} (${item.year}). ${item.title}. ${item.publisher}.`;
    }
  }

  switch (style) {
    case "apa":
      return `${formatAuthorsAPA(item.authors)} (${item.year}). ${item.title}. ${item.journal}${item.volume ? `, ${item.volume}` : ""}${item.issue ? `(${item.issue})` : ""}${item.pages ? `, ${item.pages}` : ""}.${item.doi ? ` https://doi.org/${item.doi}` : ""}`;
    case "mla":
      return `${formatAuthorsMLA(item.authors)} "${item.title}." ${item.journal}${item.volume ? `, vol. ${item.volume}` : ""}${item.issue ? `, no. ${item.issue}` : ""}, ${item.year}${item.pages ? `, pp. ${item.pages}` : ""}.`;
    case "chicago":
      return `${formatAuthorsChicago(item.authors)} "${item.title}." ${item.journal} ${item.volume || ""}${item.issue ? `, no. ${item.issue}` : ""} (${item.year})${item.pages ? `: ${item.pages}` : ""}.`;
    case "ieee":
      return `${formatAuthorsIEEE(item.authors)}, "${item.title}," ${item.journal}${item.volume ? `, vol. ${item.volume}` : ""}${item.issue ? `, no. ${item.issue}` : ""}${item.pages ? `, pp. ${item.pages}` : ""}, ${item.year}.${item.doi ? ` doi: ${item.doi}.` : ""}`;
    case "harvard":
      return `${formatAuthorsHarvard(item.authors)} (${item.year}) '${item.title}', ${item.journal}${item.volume ? `, ${item.volume}` : ""}${item.issue ? `(${item.issue})` : ""}${item.pages ? `, pp. ${item.pages}` : ""}.${item.doi ? ` doi: ${item.doi}.` : ""}`;
    case "vancouver":
      return `${formatAuthorsVancouver(item.authors)}. ${item.title}. ${item.journal}. ${item.year}${item.volume ? `;${item.volume}` : ""}${item.issue ? `(${item.issue})` : ""}${item.pages ? `:${item.pages}` : ""}.${item.doi ? ` doi: ${item.doi}` : ""}`;
    default:
      return `${formatAuthorsAPA(item.authors)} (${item.year}). ${item.title}. ${item.journal}.`;
  }
}

export function formatInlineCitation(item, style = "apa", refNumber = null) {
  switch (style) {
    case "apa":
      if (item.authors?.length === 1) {
        return `(${item.authors[0].family}, ${item.year})`;
      }
      if (item.authors?.length === 2) {
        return `(${item.authors[0].family} & ${item.authors[1].family}, ${item.year})`;
      }
      return `(${item.authors?.[0]?.family || "Unknown"} et al., ${item.year})`;
    case "mla":
      return `(${item.authors?.[0]?.family || "Unknown"}${item.pages ? ` ${item.pages}` : ""})`;
    case "chicago":
      return `(${item.authors?.[0]?.family || "Unknown"} ${item.year}${item.pages ? `, ${item.pages}` : ""})`;
    case "ieee":
      return `[${refNumber || "?"}]`;
    case "harvard":
      if (item.authors?.length === 1) {
        return `(${item.authors[0].family}, ${item.year})`;
      }
      if (item.authors?.length === 2) {
        return `(${item.authors[0].family} and ${item.authors[1].family}, ${item.year})`;
      }
      return `(${item.authors?.[0]?.family || "Unknown"} et al., ${item.year})`;
    case "vancouver":
      return `(${refNumber || "?"})`;
    default:
      return `(${item.authors?.[0]?.family || "Unknown"}, ${item.year})`;
  }
}

function deduplicateResults(results) {
  const seen = new Map();
  const deduped = [];

  for (const item of results) {
    const doi = item.doi?.toLowerCase();
    const titleKey = item.title?.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);

    if (doi && seen.has(`doi:${doi}`)) {
      const existing = seen.get(`doi:${doi}`);
      if (item.source === "semanticscholar" && existing.source !== "semanticscholar") {
        const idx = deduped.indexOf(existing);
        if (idx !== -1) deduped[idx] = { ...existing, ...item, doi: existing.doi || item.doi };
      }
      continue;
    }
    if (titleKey && seen.has(`title:${titleKey}`)) {
      continue;
    }

    if (doi) seen.set(`doi:${doi}`, item);
    if (titleKey) seen.set(`title:${titleKey}`, item);
    deduped.push(item);
  }

  return deduped;
}

export async function searchAll(query) {
  if (query.match(/^10\.\d{4,}/)) {
    try {
      const result = await lookupByDOI(query);
      return result ? [result] : [];
    } catch {
      return [];
    }
  }

  if (query.match(/^[\d-]{10,17}$/)) {
    try {
      const result = await lookupByISBN(query);
      return result ? [result] : [];
    } catch {
      return [];
    }
  }

  const results = await Promise.allSettled([
    searchSemanticScholar(query, 8),
    searchCrossRef(query),
    searchOpenLibrary(query),
  ]);

  const semanticResults =
    results[0].status === "fulfilled" ? results[0].value : [];
  const crossRefResults =
    results[1].status === "fulfilled" ? results[1].value : [];
  const openLibraryResults =
    results[2].status === "fulfilled" ? results[2].value : [];

  const combined = [...semanticResults, ...crossRefResults, ...openLibraryResults];
  return deduplicateResults(combined);
}
