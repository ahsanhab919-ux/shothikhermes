import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

function processDecorations(
  doc,
  { limit, frozenWords, frozenPhrases, useYellowHighlight },
) {
  const decorations = [];
  const sentenceMap = new Map();
  const decoratedPositions = new Set();
  let wordCount = 0;

  // === 0. Yellow Highlight (if enabled) ===
  if (useYellowHighlight) {
    decorations.push(
      Decoration.inline(0, doc.content.size, { class: "yellow-highlight" }),
    );
  }

  // === 1. Word Limit Highlighting ===
  doc.descendants((node, pos) => {
    if (!node.isText) return;
    const text = node.text;
    const wordRegex = /\b[\w-]+\b/g;
    let match;
    while ((match = wordRegex.exec(text)) !== null) {
      wordCount++;
      if (wordCount > limit) {
        const from = pos + match.index;
        const to = from + match[0].length;
        decorations.push(
          Decoration.inline(from, to, { class: "word-limit-exceeded" }),
        );
      }
    }
  });

  // === 2. Build a full-text map for phrase scanning across nodes ===
  const fullTextMap = [];
  doc.descendants((node, pos) => {
    if (!node.isText) return;
    const text = node.text || "";
    for (let i = 0; i < text.length; i++) {
      fullTextMap.push({ char: text[i], from: pos + i });
    }
  });

  // const fullText = fullTextMap.map(c => c.char).join("").toLowerCase();

  const fullText = fullTextMap.map((c) => c.char).join("");

  // === 3. Highlight Frozen Phrases (spanning-safe and prioritized) ===
  const sortedPhrases = Array.from(frozenPhrases || []).sort(
    (a, b) => b.length - a.length,
  );
  for (const phrase of sortedPhrases) {
    const phraseEscaped = phrase.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(phraseEscaped, "gi");

    let match;
    while ((match = regex.exec(fullText)) !== null) {
      const startIndex = match.index;
      const endIndex = startIndex + match[0].length;

      const from = fullTextMap[startIndex]?.from;
      const to = fullTextMap[endIndex - 1]?.from + 1;

      if (
        from != null &&
        to != null &&
        !isOverlapping(from, to, decoratedPositions)
      ) {
        markDecorated(from, to, decoratedPositions);
        decorations.push(
          Decoration.inline(from, to, {
            class: "frozen-word",
            "data-frozen-phrase": "true",
          }),
        );
      }
    }
  }

  // === 4. Highlight Frozen Words (only if not overlapping) ===
  doc.descendants((node, pos) => {
    if (!node.isText) return;
    const lowerText = node.text.toLowerCase();
    const wordRegex = /\b[\w-]+\b/g;
    let match;
    while ((match = wordRegex.exec(lowerText)) !== null) {
      const word = match[0];
      if (frozenWords?.has(word)) {
        const from = pos + match.index;
        const to = from + word.length;
        if (!isOverlapping(from, to, decoratedPositions)) {
          markDecorated(from, to, decoratedPositions);
          decorations.push(
            Decoration.inline(from, to, { class: "frozen-word" }),
          );
        }
      }
    }
  });

  // === 5. Track duplicate sentences ===
  doc.descendants((node, pos) => {
    if (!node.isText) return;
    const text = node.text;
    const sentenceRegex = /[^.!?]+[.!?]+/g;
    let match;
    while ((match = sentenceRegex.exec(text)) !== null) {
      const sentence = match[0].trim().toLowerCase();
      if (!sentence) continue;
      const from = pos + match.index;
      const to = from + match[0].length;
      if (!sentenceMap.has(sentence)) sentenceMap.set(sentence, []);
      sentenceMap.get(sentence).push({ from, to });
    }
  });

  // === 6. Highlight duplicate sentences ===
  // for (const [, ranges] of sentenceMap.entries()) {
  //   if (ranges.length > 1) {
  //     for (const { from, to } of ranges) {
  //       decorations.push(
  //         Decoration.inline(from, to, { class: "duplicate-sentence" })
  //       );
  //     }
  //   }
  // }

  return DecorationSet.create(doc, decorations);
}
// ✅ Helpers (define only once per file)
function isOverlapping(from, to, set) {
  for (let i = from; i < to; i++) {
    if (set.has(i)) return true;
  }
  return false;
}

function markDecorated(from, to, set) {
  for (let i = from; i < to; i++) {
    set.add(i);
  }
}
// function isOverlapping(from, to, set) {
//   for (let i = from; i < to; i++) {
//     if (set.has(i)) return true;
//   }
//   return false;
// }
//
// function markDecorated(from, to, set) {
//   for (let i = from; i < to; i++) set.add(i);
// }
//
const combinedHighlightingKey = new PluginKey("combinedHighlighting");

export const CombinedHighlighting = Extension.create({
  name: "combinedHighlighting",

  addOptions() {
    return {
      limit: 100,
      frozenWords: new Set(),
      frozenPhrases: new Set(),
      useYellowHighlight: false, // New option
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: combinedHighlightingKey,

        props: {
          decorations: (state) => {
            return processDecorations(state.doc, this.options);
          },
        },
      }),
    ];
  },
});

const getColorStyle = (type, dark = false) => {
  const adJectiveVerbAdverbColor = dark ? "#ef5c47" : "#d95645";
  const nounColor = dark ? "#b6bdbd" : "#530a78";
  const phraseColor = dark ? "#b6bdbd" : "#051780";
  const freezeColor = "#006ACC";

  if (/NP/.test(type)) return adJectiveVerbAdverbColor;
  if (/VP/.test(type)) return nounColor;
  if (/PP|CP|AdvP|AdjP/.test(type)) return phraseColor;
  if (/freeze/.test(type)) return freezeColor;
  return "inherit";
};

// output editor
export const wordSentenceDecorator = (data, activeSentenceIndexes = []) => {
  return new Plugin({
    key: new PluginKey("wordSentenceDecorator"),
    props: {
      decorations(state) {
        const decorations = [];
        let pos = 1; // starting inside paragraph node

        data.forEach((sentence, sIndex) => {
          const sentenceStart = pos;
          sentence.forEach((wordObj, wIndex) => {
            const word = wordObj.word;
            const space = /^[.,;]$/.test(word) || word.endsWith("'") ? "" : " ";

            // Add the space *before* the word
            pos += space.length;

            const from = pos;
            const to = from + word.length;

            decorations.push(
              Decoration.inline(from, to, {
                nodeName: "span",
                class: `word-span ${
                  activeSentenceIndexes.includes(sIndex)
                    ? "active-sentence"
                    : ""
                }`,
                "data-word": word,
                "data-type": wordObj.type,
                "data-sentence-index": sIndex,
                "data-word-index": wIndex,
                style: `color:${getColorStyle(wordObj.type)}; cursor:pointer;`,
              }),
            );

            pos = to;
          });
          const sentenceEnd = pos;
          decorations.push(
            Decoration.inline(sentenceStart, sentenceEnd, {
              nodeName: "span",
              class: "sentence-span",
              "data-sentence-index": sIndex,
            }),
          );
        });

        return DecorationSet.create(state.doc, decorations);
      },
    },
  });
};

export const protectedSingleWords = [
  "affidavit",
  "alibi",
  "arraignment",
  "bail",
  "civil",
  "contract",
  "conviction",
  "defendant",
  "evidence",
  "felony",
  "indictment",
  "injunction",
  "jurisdiction",
  "litigation",
  "misdemeanor",
  "negligence",
  "parole",
  "plaintiff",
  "precedent",
  "probation",
  "statute",
  "subpoena",
  "tort",
  "verdict",
  "warrant",
  "testimony",
  "appeal",
  "acquittal",
  "prosecutor",
  "discovery",
  "settlement",
  "pleading",
  "hearsay",
  "damages",
  "liable",
  "indemnity",
  "algorithm",
  "api",
  "bandwidth",
  "binary",
  "bit",
  "blockchain",
  "cache",
  "compiler",
  "cybersecurity",
  "database",
  "debugging",
  "encryption",
  "firewall",
  "frontend",
  "backend",
  "function",
  "hashing",
  "http",
  "https",
  "inheritance",
  "latency",
  "query",
  "recursion",
  "runtime",
  "server",
  "sql",
  "nosql",
  "syntax",
  "token",
  "variable",
  "websocket",
  "container",
  "docker",
  "pipeline",
  "dns",
  "jwt",
  "oauth",
  "middleware",
  "callback",
  "throttle",
  "debounce",
  "webrtc",
  "endpoint",
  "webhook",
  "acetaminophen",
  "antibiotic",
  "aspirin",
  "biopsy",
  "cardiovascular",
  "cholesterol",
  "diabetes",
  "diagnosis",
  "dosage",
  "epidural",
  "fever",
  "hypertension",
  "ibuprofen",
  "infection",
  "injection",
  "insulin",
  "intubation",
  "nausea",
  "neurosurgery",
  "paracetamol",
  "penicillin",
  "pharmacy",
  "placebo",
  "prescription",
  "radiology",
  "respiratory",
  "surgery",
  "symptom",
  "tablet",
  "therapy",
  "ultrasound",
  "vaccine",
  "x-ray",
  "anesthesia",
  "allergy",
  "oncology",
  "dermatology",
  "hematology",
  "nephrology",
  "cardiology",
  "neurology",
  "gynecology",
  "psychiatry",
  "pathology",
  "urinalysis",
  "eczema",
  "psoriasis",
  "bronchitis",
  "migraine",
  "sinusitis",
  "covid",
  "flu",
  "hepatitis",
  "arthritis",
  "cancer",
  "tumor",
  "glucose",
  "metformin",
  "omeprazole",
  "amoxicillin",
  "morphine",
  "insomnia",
  "depression",
  "anxiety",
  "bmi",
  "javascript",
  "typescript",
  "python",
  "php",
  "ruby",
  "java",
  "go",
  "rust",
  "swift",
  "kotlin",
  "dart",
  "html",
  "css",
  "scss",
  "graphql",
  "mongodb",
  "mysql",
  "postgresql",
  "sqlite",
  "redis",
  "firebase",
  "supabase",
  "typeorm",
  "prisma",
  "vite",
  "webpack",
  "babel",
  "eslint",
  "prettier",
  "jest",
  "mocha",
  "cypress",
  "vitest",
  "expo",
  "graphql",
];
export const protectedPhrases = [
  "common law",
  "plea bargain",
  "defense attorney",
  "due process",
  "cross-examination",
  "voir dire",
  "case law",
  "data structure",
  "cloud computing",
  "machine learning",
  "neural network",
  "object-oriented",
  "load balancer",
  "microservice",
  "rest api",
  "ci/cd",
  "ip address",
  "rate limiting",
  "event loop",
  "peer-to-peer",
  "ct scan",
  "blood pressure",
  "heart rate",
  "node js",
  "react js",
  "next js",
  "vue js",
  "express js",
  "spring boot",
  "nuxt js",
  "nest js",
  "tailwind css",
  "material ui",
  "react native",
];

export const data = [
  [
    {
      word: "This",
      type: "NP",
      synonyms: [
        "That",
        "It",
        "These",
        "Those",
        "Such",
        "Here",
        "There",
        "Thing",
        "Item",
        "One",
      ],
    },
    {
      word: "is",
      type: "VP",
      synonyms: [
        "be",
        "exists",
        "appears",
        "remains",
        "seems",
        "acts",
        "becomes",
        "stays",
        "lies",
        "occurs",
      ],
    },
    {
      word: "a",
      type: "NP",
      synonyms: [
        "one",
        "an",
        "any",
        "each",
        "some",
        "the",
        "this",
        "that",
        "certain",
        "particular",
      ],
    },
    {
      word: "sentence",
      type: "NP",
      synonyms: [
        "statement",
        "phrase",
        "clause",
        "expression",
        "utterance",
        "remark",
        "comment",
        "declaration",
        "assertion",
        "note",
      ],
    },
    {
      word: ".",
      type: "dot",
      synonyms: [],
    },
  ],
  [
    {
      word: "Another",
      type: "NP",
      synonyms: [
        "Additional",
        "Extra",
        "Second",
        "New",
        "Different",
        "Spare",
        "Alternative",
        "Further",
        "More",
        "Fresh",
      ],
    },
    {
      word: "line",
      type: "NP",
      synonyms: [
        "row",
        "string",
        "text",
        "phrase",
        "sentence",
        "series",
        "stream",
        "sequence",
        "stroke",
        "boundary",
      ],
    },
    {
      word: "here",
      type: "AdvP",
      synonyms: [
        "there",
        "nearby",
        "around",
        "in this place",
        "at this location",
        "on site",
        "locally",
        "right here",
        "present",
        "this side",
      ],
    },
    {
      word: ".",
      type: "dot",
      synonyms: [],
    },
  ],
  [
    {
      word: "The",
      type: "NP",
      synonyms: [
        "A",
        "An",
        "This",
        "That",
        "Each",
        "Every",
        "One",
        "Some",
        "Any",
        "Certain",
      ],
    },
    {
      word: "quick",
      type: "AdjP",
      synonyms: [
        "fast",
        "swift",
        "rapid",
        "speedy",
        "brisk",
        "nimble",
        "hasty",
        "prompt",
        "agile",
        "fleet",
      ],
    },
    {
      word: "brown",
      type: "AdjP",
      synonyms: [
        "tan",
        "beige",
        "khaki",
        "umber",
        "bronze",
        "chestnut",
        "sepia",
        "russet",
        "tawny",
        "brunette",
      ],
    },
    {
      word: "fox",
      type: "NP",
      synonyms: [
        "vixen",
        "canid",
        "predator",
        "animal",
        "creature",
        "beast",
        "sly-boots",
        "trickster",
        "varmint",
        "reynard",
      ],
    },
    {
      word: "jumps",
      type: "VP",
      synonyms: [
        "leaps",
        "bounds",
        "springs",
        "hops",
        "vaults",
        "skips",
        "bounces",
        "pounces",
        "clears",
        "hurdles",
      ],
    },
    {
      word: ".",
      type: "dot",
      synonyms: [],
    },
  ],
  [
    {
      word: "JavaScript",
      type: "NP",
      synonyms: [
        "JS",
        "ECMAScript",
        "TypeScript",
        "Node.js",
        "React",
        "Angular",
        "Vue",
        "jQuery",
        "script",
        "code",
      ],
    },
    {
      word: "is",
      type: "VP",
      synonyms: [
        "be",
        "exists",
        "appears",
        "remains",
        "seems",
        "acts",
        "becomes",
        "stays",
        "proves",
        "stands",
      ],
    },
    {
      word: "very",
      type: "AdvP",
      synonyms: [
        "extremely",
        "highly",
        "greatly",
        "immensely",
        "truly",
        "exceedingly",
        "remarkably",
        "intensely",
        "acutely",
        "awfully",
      ],
    },
    {
      word: "popular",
      type: "AdjP",
      synonyms: [
        "widespread",
        "common",
        "famous",
        "well-liked",
        "fashionable",
        "trendy",
        "prevalent",
        "in-demand",
        "celebrated",
        "favored",
      ],
    },
    {
      word: ".",
      type: "dot",
      synonyms: [],
    },
  ],
  [
    {
      word: "Good",
      type: "AdjP",
      synonyms: [
        "Excellent",
        "Fine",
        "Quality",
        "Superior",
        "Great",
        "Beneficial",
        "Valuable",
        "Positive",
        "Helpful",
        "Effective",
      ],
    },
    {
      word: "data",
      type: "NP",
      synonyms: [
        "information",
        "facts",
        "figures",
        "statistics",
        "details",
        "input",
        "evidence",
        "records",
        "intelligence",
        "material",
      ],
    },
    {
      word: "requires",
      type: "VP",
      synonyms: [
        "needs",
        "demands",
        "necessitates",
        "entails",
        "involves",
        "calls for",
        "warrants",
        "commands",
        "obliges",
        "compels",
      ],
    },
    {
      word: "careful",
      type: "AdjP",
      synonyms: [
        "meticulous",
        "thorough",
        "cautious",
        "prudent",
        "diligent",
        "attentive",
        "scrupulous",
        "conscientious",
        "thoughtful",
        "precise",
      ],
    },
    {
      word: "thought",
      type: "NP",
      synonyms: [
        "consideration",
        "reflection",
        "contemplation",
        "deliberation",
        "reasoning",
        "analysis",
        "idea",
        "concept",
        "meditation",
        "planning",
      ],
    },
    {
      word: ".",
      type: "dot",
      synonyms: [],
    },
  ],
  [
    {
      word: "Can",
      type: "VP",
      synonyms: [
        "Could",
        "May",
        "Might",
        "Will",
        "Would",
        "Shall",
        "Should",
        "Able to",
        "Permitted to",
        "Capable of",
      ],
    },
    {
      word: "you",
      type: "NP",
      synonyms: [
        "yourself",
        "one",
        "the user",
        "the reader",
        "the recipient",
        "thee",
        "thou",
        "y'all",
        "ye",
        "viewer",
      ],
    },
    {
      word: "generate",
      type: "VP",
      synonyms: [
        "create",
        "produce",
        "make",
        "form",
        "originate",
        "devise",
        "formulate",
        "develop",
        "construct",
        "build",
      ],
    },
    {
      word: "some",
      type: "NP",
      synonyms: [
        "a few",
        "several",
        "any",
        "certain",
        "various",
        "multiple",
        "a bit of",
        "a little",
        "a quantity of",
        "part of",
      ],
    },
    {
      word: "code",
      type: "NP",
      synonyms: [
        "script",
        "program",
        "instructions",
        "source",
        "text",
        "syntax",
        "commands",
        "algorithm",
        "logic",
        "markup",
      ],
    },
    {
      word: "?",
      type: "dot",
      synonyms: [],
    },
  ],
  [
    {
      word: "She",
      type: "NP",
      synonyms: [
        "Her",
        "Herself",
        "This woman",
        "That lady",
        "The female",
        "One",
        "The individual",
        "The person",
        "Girl",
        "Gal",
      ],
    },
    {
      word: "writes",
      type: "VP",
      synonyms: [
        "composes",
        "authors",
        "drafts",
        "pens",
        "scribes",
        "creates",
        "records",
        "documents",
        "inscribes",
        "types",
      ],
    },
    {
      word: "with",
      type: "PP",
      synonyms: [
        "using",
        "by",
        "through",
        "via",
        "possessing",
        "having",
        "employing",
        "alongside",
        "in",
        "by means of",
      ],
    },
    {
      word: "great",
      type: "AdjP",
      synonyms: [
        "immense",
        "tremendous",
        "considerable",
        "significant",
        "profound",
        "superb",
        "excellent",
        "remarkable",
        "outstanding",
        "exceptional",
      ],
    },
    {
      word: "clarity",
      type: "NP",
      synonyms: [
        "clearness",
        "lucidity",
        "precision",
        "simplicity",
        "coherence",
        "perspicuity",
        "transparency",
        "intelligibility",
        "explicitness",
        "legibility",
      ],
    },
    {
      word: ".",
      type: "dot",
      synonyms: [],
    },
  ],
];
