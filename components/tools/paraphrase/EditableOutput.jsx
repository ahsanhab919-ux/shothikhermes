// src/components/tools/paraphrase/EditableOutputWithStructural.jsx
"use client";

import { Extension, Node } from "@tiptap/core";
import HardBreak from "@tiptap/extension-hard-break";
import { Placeholder } from "@tiptap/extensions";
import { defaultMarkdownParser } from "@tiptap/pm/markdown";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { diffWordsWithSpace } from "diff";
import { Plugin, PluginKey, TextSelection } from "prosemirror-state";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

/* ============================================================
   Utilities: sentence splitting, token normalization,
   structural annotation (existing), and diff-based longest-unchanged
   ============================================================ */

// naive sentence splitter (keeps punctuation)
function splitSentencesFromText(text) {
  if (!text) return [];
  const re = /([^.!?]+[.!?]?)/g;
  const matches = text.match(re);
  if (!matches) return [text];
  return matches?.map((s) => s?.trim())?.filter(Boolean);
}

// normalize words: lowercase and remove basic punctuation
function tokenizeWords(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[.,;:?!()"\u201c\u201d\u2018\u2019]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

// compute simple word overlap ratio
function wordOverlapRatio(aStr, bStr) {
  const a = new Set(tokenizeWords(aStr));
  const b = new Set(tokenizeWords(bStr));
  if (a.size === 0 || b.size === 0) return 0;
  let common = 0;
  for (const w of a) if (b.has(w)) common++;
  return common / Math.min(a.size, b.size);
}

/* ====== annotateStructuralChanges (keeps our previous heuristic + structured compare) ====== */
function annotateStructuralChanges({
  outputData,
  inputTokens = null,
  inputText = null,
  sentenceOverlapThreshold = 0.65,
}) {
  if (!outputData) return [];

  const cloned = outputData?.map((sentence) =>
    sentence?.map((w) => ({ ...w, structuralChange: false })),
  );

  // Mode A: structured comparison if inputTokens available
  if (Array.isArray(inputTokens) && inputTokens.length > 0) {
    for (let sIdx = 0; sIdx < cloned.length; sIdx++) {
      const outSentence = cloned[sIdx] || [];
      const inSentence = inputTokens[sIdx] || [];

      if (!inSentence || inSentence.length === 0) {
        outSentence.forEach((token) => (token.structuralChange = true));
        continue;
      }

      const maxLen = Math.max(outSentence.length, inSentence.length);
      for (let wIdx = 0; wIdx < maxLen; wIdx++) {
        const o = outSentence[wIdx];
        const i = inSentence[wIdx];
        if (!o) continue;
        if (!i) {
          o.structuralChange = true;
          continue;
        }
        if ((i.type || "") !== (o.type || "")) {
          o.structuralChange = true;
        } else {
          o.structuralChange = false;
        }
      }
    }

    return cloned;
  }

  // Mode B: heuristics using inputText only
  const inputSentences = inputText ? splitSentencesFromText(inputText) : [];
  const outputSentencesStr = cloned?.map((s) =>
    s
      ?.map((w) => w?.word)
      .join(" ")
      .trim(),
  );

  for (let sIdx = 0; sIdx < cloned.length; sIdx++) {
    const outSentStr = outputSentencesStr?.[sIdx] || "";
    if (!outSentStr) continue;

    let bestIdx = -1;
    let bestScore = 0;
    for (let i = 0; i < inputSentences.length; i++) {
      const score = wordOverlapRatio(outSentStr, inputSentences[i]);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }

    const markStructural = bestScore < sentenceOverlapThreshold;
    if (markStructural) {
      cloned[sIdx].forEach((t) => (t.structuralChange = true));
      continue;
    }

    const matchedInput = inputSentences[bestIdx] || "";
    const matchedWordsSet = new Set(tokenizeWords(matchedInput));
    for (const token of cloned[sIdx]) {
      const tokenWords = tokenizeWords(token?.word);
      if (tokenWords.length === 0) continue;
      const common = tokenWords.filter((w) => matchedWordsSet.has(w)).length;
      const tokenOverlap = common / tokenWords.length;
      if (tokenOverlap < 0.4) token.structuralChange = true;
      else token.structuralChange = false;
    }
  }

  return cloned;
}

/* ============================================================
   DIFF-based longest-unchanged helpers (minLen = 7)
   ============================================================ */

function normalizeTokenSurface(s) {
  if (!s) return "";
  return String(s)
    .toLowerCase()
    .replace(/[""''.,;:?!()[\]{}<>]/g, "")
    .trim();
}

function tokenSurfaceArray(sentenceTokens) {
  return (sentenceTokens || [])?.map((t) => normalizeTokenSurface(t?.word));
}

// Expand output tokens into a per-word list with token index mapping.
function buildWordToTokenMap(outSentence) {
  const arr = []; // { w, tokenIdx }
  for (let tokenIdx = 0; tokenIdx < (outSentence || []).length; tokenIdx++) {
    const token = outSentence[tokenIdx];
    const surface = normalizeTokenSurface(token?.word);
    const words = surface.length ? surface.split(/\s+/).filter(Boolean) : [];
    for (const w of words) arr.push({ w, tokenIdx });
  }
  return arr;
}

// Try to find the contiguous sequence of segmentWords inside the expanded word array.
function findTokenRangeForSegment(outSentence, segmentWords) {
  if (!segmentWords || segmentWords.length === 0) return null;
  const map = buildWordToTokenMap(outSentence);
  const L = segmentWords.length;
  if (map.length < L) return null;

  for (let i = 0; i + L <= map.length; i++) {
    let ok = true;
    for (let k = 0; k < L; k++) {
      if (map[i + k].w !== segmentWords[k]) {
        ok = false;
        break;
      }
    }
    if (ok) {
      const startTokenIdx = map[i].tokenIdx;
      const endTokenIdx = map[i + L - 1].tokenIdx;
      return [startTokenIdx, endTokenIdx];
    }
  }
  return null;
}

/**
 * Mark unchangedLongest using diffWordsWithSpace.
 */
function markLongestUnchangedUsingDiff({
  outputData,
  inputTokens = null,
  inputText = null,
  minLenWords = 7,
}) {
  if (!outputData) return outputData;
  const cloned = outputData?.map((s) =>
    s?.map((t) => ({ ...t, unchangedLongest: false })),
  );

  const inputSentencesText = inputText ? splitSentencesFromText(inputText) : [];

  for (let sIdx = 0; sIdx < cloned.length; sIdx++) {
    const outSentence = cloned[sIdx];
    const outStr = outSentence
      ?.map((t) => t?.word)
      .join(" ")
      .trim();

    // pick input sentence string to compare with
    let inStr = null;
    if (inputTokens && inputTokens[sIdx]) {
      inStr = inputTokens[sIdx]
        ?.map((t) => t?.word)
        .join(" ")
        .trim();
    } else if (inputTokens) {
      // best-match input sentence by overlap
      let bestIdx = -1,
        bestScore = 0;
      for (let i = 0; i < inputTokens.length; i++) {
        const score = wordOverlapRatio(
          outStr,
          inputTokens[i]?.map((t) => t?.word).join(" "),
        );
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }
      if (bestIdx !== -1)
        inStr = inputTokens[bestIdx]
          ?.map((t) => t?.word)
          .join(" ")
          .trim();
    } else if (inputText && inputSentencesText.length > 0) {
      let bestIdx = -1,
        bestScore = 0;
      for (let i = 0; i < inputSentencesText.length; i++) {
        const score = wordOverlapRatio(outStr, inputSentencesText[i]);
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }
      if (bestIdx !== -1) inStr = inputSentencesText[bestIdx];
    }

    if (!inStr || !inStr.length) continue;

    // diff the two sentence strings
    const changes = diffWordsWithSpace(inStr, outStr);

    // collect unchanged segments that have >= minLenWords words
    for (const seg of changes) {
      if (seg.added || seg.removed) continue; // changed segment, skip
      const segNorm = normalizeTokenSurface(seg.value);
      const segWords = segNorm.length
        ? segNorm.split(/\s+/).filter(Boolean)
        : [];
      if (segWords.length < minLenWords) continue;

      // find token range in output sentence corresponding to this unchanged segment
      const tokenRange = findTokenRangeForSegment(outSentence, segWords);
      if (!tokenRange) {
        continue;
      }
      const [startTokenIdx, endTokenIdx] = tokenRange;
      for (let ti = startTokenIdx; ti <= endTokenIdx; ti++) {
        const token = outSentence[ti];
        if (token) token.unchangedLongest = true;

        // 
      }
    }
  }

  return cloned;
}

const WordNode = Node.create({
  name: "wordNode",
  group: "inline",
  inline: true,
  content: "text*",
  priority: 50,
  addAttributes() {
    return {
      "data-sentence-index": { default: null },
      "data-word-index": { default: null },
      "data-type": { default: null },
      class: { default: "word-span" },
      style: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: "span.word-span" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", HTMLAttributes, 0];
  },
});

const SentenceNode = Node.create({
  name: "sentenceNode",
  group: "inline",
  inline: true,
  content: "wordNode* text*",
  priority: 50,
  addAttributes() {
    return {
      "data-sentence-index": { default: null },
      class: { default: "sentence-span" },
    };
  },
  parseHTML() {
    return [{ tag: "span.sentence-span" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", HTMLAttributes, 0];
  },
});

const EnterHandler = Extension.create({
  name: "enterHandler",
  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { state, view } = editor;
        const { tr, selection, doc, schema } = state;
        const from = selection.from;

        let maxIndex = 0;
        doc.descendants((node) => {
          if (node.type.name === "sentenceNode") {
            const idx = parseInt(node.attrs["data-sentence-index"], 10);
            if (!isNaN(idx) && idx > maxIndex) maxIndex = idx;
          }
        });
        const nextIndex = maxIndex + 1;

        const wordNode = schema.nodes.wordNode.create(
          {
            "data-sentence-index": nextIndex,
            "data-word-index": 1,
            "data-type": "",
            class: "word-span",
            style: "color:inherit;cursor:pointer",
          },
          schema.text("\u00A0"),
        );
        const sentenceNode = schema.nodes.sentenceNode.create(
          { "data-sentence-index": nextIndex, class: "sentence-span" },
          [wordNode],
        );
        const paragraph = schema.nodes.paragraph.create({}, [sentenceNode]);
        const newTr = tr.insert(from, paragraph);

        const resolved = newTr.doc.resolve(from + paragraph.nodeSize - 1);
        const sel = TextSelection.near(resolved);
        view.dispatch(newTr.setSelection(sel).scrollIntoView());
        return true;
      },
    };
  },
});

/* ============================================================
   Markdown parsing helpers
   ============================================================ */

function parseMarkdownText(text) {
  // 
  const marks = [];
  let core = text;
  let trailing = "";
  if (!text) return { text, marks };
  const punctMatch = core?.match(/^(.*?)([.,;?!])$/);
  if (punctMatch) {
    core = punctMatch[1];
    trailing = punctMatch[2];
  }
  let m;
  if ((m = core.match(/^(\*\*|__)([\s\S]+?)\1$/))) {
    marks.push({ type: "bold" });
    core = m[2];
  } else if ((m = core.match(/^~~([\s\S]+?)~~$/))) {
    marks.push({ type: "strike" });
    core = m[1];
  } else if ((m = core.match(/^(\*|_)([\s\S]+?)\1$/))) {
    marks.push({ type: "italic" });
    core = m[2];
  } else if ((m = core.match(/^`([\s\S]+?)`$/))) {
    marks.push({ type: "code" });
    core = m[1];
  }
  const processedText = core + trailing;
  return { text: processedText, marks };
}

function processHeadingSentence(sentence, sIdx) {
  const firstWord = sentence[0]?.word || "";
  const headingMatch = firstWord.match(/^(#{1,6})$/);
  if (headingMatch && sentence.length > 1) {
    const level = headingMatch[1].length;
    const headingText = sentence
      ?.slice(1)
      ?.map((w) => w?.word)
      .join(" ")
      .trim();
    return {
      type: "heading",
      attrs: { level },
      content: [{ type: "text", text: headingText }],
    };
  }
  return null;
}
function isNewlineSentence(sentence) {
  return sentence.length === 1 && /^\n+$/.test(sentence[0]?.word);
}

/* ============================================================
   Token style helper (colors, structural underline, longest-unchanged highlight)
   ============================================================ */

function getColorStyle(
  type,
  dark,
  showChangedWords,
  structuralChange,
  showStructural,
  unchangedLongest,
  showLongest,
) {
  let style = "";
  // DEBUG: Check why type is 'none'
  // if (unchangedLongest && showLongest && showChangedWords) {
  //   
  // }

  // Base color from type (if showChangedWords is enabled)
  if (showChangedWords) {
    const adjVerb = dark ? "#D85644" : "#d95645";
    const noun = dark ? "#685BFF" : "#530a78";
    const phrase = dark ? "#685BFF" : "#051780";
    const freeze = "#006ACC";

    if (/NP/.test(type)) style += `color:${noun};`;
    else if (/VP/.test(type)) style += `color:${adjVerb};`;
    else if (/PP|CP|AdvP|AdjP/.test(type)) style += `color:${phrase};`;
    else if (/freeze/.test(type)) style += `color:${freeze};`;
  }

  // structural underline (preserves color)
  if (structuralChange && showStructural) {
    style += `text-decoration: underline; text-decoration-color: #28a745; text-decoration-thickness: 2px;`;
  }

  // Alongest-unchanged highlight (preserves color)
  if (unchangedLongest && showLongest) {
    style += `background-color: #0069cc3d; border-radius: 3px;`;
  }

  return style || "inherit";
}

/* ============================================================
   formatContent: build ProseMirror doc from token data
   ============================================================ */

function formatContent(
  data,
  showChangedWords,
  showStructural,
  showLongest,
  isDarkMode = false,
) {
  if (!data) return { type: "doc", content: [] };

  if (typeof data === "string") {
    try {
      const parsed = defaultMarkdownParser.parse(data);
      if (parsed) return parsed.toJSON();
    } catch (e) {
    }
    return {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: data }] }],
    };
  }

  const sentences = Array.isArray(data && data[0]) ? data : [data];
  const docContent = [];
  let currentParagraphSentences = [];

  // CRITICAL FIX: Only count non-newline sentences for actual indices
  let actualSentenceIndex = 0;

  for (let sIdx = 0; sIdx < sentences.length; sIdx++) {
    const sentence = sentences[sIdx];

    // Skip newline sentences - don't increment counter
    if (isNewlineSentence(sentence)) {
      if (currentParagraphSentences.length > 0) {
        docContent.push({
          type: "paragraph",
          content: currentParagraphSentences,
        });
        currentParagraphSentences = [];
      }
      continue; // DON'T increment actualSentenceIndex
    }

    // Handle heading sentences
    const headingNode = processHeadingSentence(sentence, actualSentenceIndex);
    if (headingNode) {
      if (currentParagraphSentences.length > 0) {
        docContent.push({
          type: "paragraph",
          content: currentParagraphSentences,
        });
        currentParagraphSentences = [];
      }
      docContent.push(headingNode);
      actualSentenceIndex++; // Increment for headings
      continue;
    }

    // CRITICAL: Log the mapping
    // console.log(
    //   `📍 Mapping: array index ${sIdx} → sentence index ${actualSentenceIndex}`,
    // );

    // Process regular sentence
    const sentenceNode = {
      type: "sentenceNode",
      attrs: {
        "data-sentence-index": actualSentenceIndex, // Use actualSentenceIndex
        class: "sentence-span",
      },
      content: sentence?.map((wObj, wIdx) => {
        const raw = wObj?.word;
        const { text: processedText, marks } = parseMarkdownText(raw);
        const prefix =
          (actualSentenceIndex === 0 && wIdx === 0) || /^[.,;?!]$/.test(raw)
            ? ""
            : " ";

        const style = getColorStyle(
          wObj.type,
          isDarkMode,
          showChangedWords,
          !!wObj.structuralChange,
          showStructural,
          !!wObj.unchangedLongest,
          showLongest,
        );

        return {
          type: "wordNode",
          attrs: {
            "data-sentence-index": actualSentenceIndex, // Use actualSentenceIndex
            "data-word-index": wIdx,
            "data-type": wObj.type,
            class: "word-span",
            style: `${style}; cursor:pointer`,
          },
          content: [
            {
              type: "text",
              text: prefix + processedText,
              ...(marks.length ? { marks } : {}),
            },
          ],
        };
      }),
    };

    currentParagraphSentences.push(sentenceNode);
    actualSentenceIndex++; // NOW increment for regular sentences
  }

  if (currentParagraphSentences.length > 0) {
    docContent.push({ type: "paragraph", content: currentParagraphSentences });
  }

  // console.log(
  //   `✅ Formatted ${actualSentenceIndex} actual sentences from ${sentences.length} array items`,
  // );

  return { type: "doc", content: docContent };
}

/* ============================================================
   Main component: EditableOutput
   ============================================================ */
const _annotateCache = new Map();

export default function EditableOutput({
  isDark,
  data,
  inputTokens = null,
  setSynonymsOptions,
  setSentence,
  setAnchorEl,
  highlightSentence,
  setHighlightSentence,
}) {
  const {
    showChangedWords,
    showStructuralChanges,
    showLongestUnchangedWords,
    useYellowHighlight,
  } = useSelector((state) => state.settings.interfaceOptions);
  const paraphraseIO = useSelector((state) => state.inputOutput.paraphrase);

  // Create a virtual anchor element for positioning
  const [virtualAnchor, setVirtualAnchor] = useState(null);

  const annotatedData = useMemo(() => {
    const outputData = Array.isArray(data && data[0]) ? data : [data];

    const structurallyAnnotated = annotateStructuralChanges({
      outputData,
      inputTokens,
      inputText: paraphraseIO?.input?.text || null,
      sentenceOverlapThreshold: 0.65,
    });

    if (!showLongestUnchangedWords) {
      return structurallyAnnotated?.map((s) =>
        s?.map((t) => ({ ...t, unchangedLongest: false })),
      );
    }

    const inputText = paraphraseIO?.input?.text || null;
    const outputText = paraphraseIO?.output?.text || null;

    if (!inputText || !outputText) {
      return structurallyAnnotated?.map((s) =>
        s?.map((t) => ({ ...t, unchangedLongest: false })),
      );
    }

    const minLenWords = 7;
    const cacheKey = `${inputText}|||${outputText}|||${minLenWords}`;

    if (_annotateCache.has(cacheKey)) {
      return _annotateCache.get(cacheKey);
    }

    const withLongest = markLongestUnchangedUsingDiff({
      outputData: structurallyAnnotated,
      inputTokens,
      inputText,
      minLenWords,
    });

    _annotateCache.set(cacheKey, withLongest);

    const MAX_CACHE = 200;
    if (_annotateCache.size > MAX_CACHE) {
      const firstKey = _annotateCache.keys().next().value;
      _annotateCache.delete(firstKey);
    }

    return withLongest;
  }, [
    data,
    inputTokens,
    paraphraseIO?.input?.text,
    paraphraseIO?.output?.text,
    showLongestUnchangedWords,
  ]);

  const SentenceHighlighter = useMemo(
    () =>
      Extension.create({
        name: "sentenceHighlighter",
        addProseMirrorPlugins() {
          return [
            new Plugin({
              key: new PluginKey("sentenceHighlighter"),
              props: {
                decorations: (state) => {
                  const decos = [];
                  const { highlightSentence, useYellowHighlight } =
                    this.options;

                  if (!useYellowHighlight) return DecorationSet.empty;

                  // Count total sentences for debugging
                  let maxSentenceIndex = -1;
                  state.doc.descendants((node) => {
                    if (node.type.name === "sentenceNode") {
                      const idx = parseInt(
                        node.attrs["data-sentence-index"],
                        10,
                      );
                      if (!isNaN(idx) && idx > maxSentenceIndex) {
                        maxSentenceIndex = idx;
                      }
                    }
                  });
                  const totalSentences = maxSentenceIndex + 1;

                  // console.log(
                  //   `📄 Output: ${totalSentences} sentences, highlighting index ${highlightSentence}`,
                  // );

                  state.doc.descendants((node, pos) => {
                    if (node.type.name === "sentenceNode") {
                      const sentenceIndex = parseInt(
                        node.attrs["data-sentence-index"],
                        10,
                      );

                      if (
                        !isNaN(sentenceIndex) &&
                        sentenceIndex === highlightSentence
                      ) {
                        const start = pos;
                        const end = pos + node.nodeSize;
                        decos.push(
                          Decoration.node(start, end, {
                            class: "highlighted-sentence",
                            style: "pointer-events: auto;",
                          }),
                        );
                      }
                    }
                  });

                  return DecorationSet.create(state.doc, decos);
                },
              },
            }),
          ];
        },
        addOptions() {
          return {
            highlightSentence: 0,
            useYellowHighlight: false,
          };
        },
      }),
    [],
  );

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          enter: false,
          bold: true,
          italic: true,
          strike: true,
          code: true,
          hardBreak: false,
          heading: {
            levels: [1, 2, 3, 4, 5, 6],
            HTMLAttributes: { class: "heading-node" },
          },
        }),
        Placeholder.configure({ placeholder: "Paraphrased Text..." }),
        HardBreak,
        SentenceNode,
        WordNode,
        EnterHandler,
        SentenceHighlighter.configure({
          highlightSentence: highlightSentence,
          useYellowHighlight: useYellowHighlight,
        }),
      ],
      editable: true,
      immediatelyRender: false,
    },
    [highlightSentence, useYellowHighlight],
  );

  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(
      formatContent(
        annotatedData,
        showChangedWords,
        showStructuralChanges,
        showLongestUnchangedWords,
        isDark,
      ),
    );
  }, [
    editor,
    annotatedData,
    showChangedWords,
    showStructuralChanges,
    showLongestUnchangedWords,
    isDark,
  ]);

  // Enhanced click handler with virtual anchor
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;

    const onClick = (e) => {
      const el = e.target.closest(".word-span");
      if (!el) return;

      const sI = Number(el.getAttribute("data-sentence-index"));
      const wI = Number(el.getAttribute("data-word-index"));

      // 

      // CRITICAL FIX: Map display index back to data array index
      // Count non-newline sentences to find the correct data index
      let dataIndex = -1;
      let nonNewlineCount = 0;

      for (let i = 0; i < data.length; i++) {
        const segment = data[i];
        // Skip newline segments
        if (segment.length === 1 && segment[0].type === "newline") {
          continue;
        }
        if (nonNewlineCount === sI) {
          dataIndex = i;
          break;
        }
        nonNewlineCount++;
      }

      if (dataIndex === -1) {
        console.error(`❌ Could not map sentence index ${sI} to data array`);
        return;
      }

      // 

      // Get word object from the correct data index
      const wObj = data[dataIndex]?.[wI];

      if (!wObj) {
        console.error(`❌ Word not found at data[${dataIndex}][${wI}]`);
        return;
      }

      // console.log(
      //   `✅ Found word:`,
      //   wObj.word,
      //   `with ${wObj.synonyms?.length || 0} synonyms`,
      // );

      // Create a virtual anchor that tracks the mouse position
      const rect = el.getBoundingClientRect();
      const virtualAnchorEl = {
        getBoundingClientRect: () => ({
          top: rect.top,
          left: rect.left,
          bottom: rect.bottom,
          right: rect.right,
          width: rect.width,
          height: rect.height,
          x: rect.left,
          y: rect.top,
        }),
        clientWidth: rect.width,
        clientHeight: rect.height,
      };

      // Set both the actual element and virtual anchor
      setAnchorEl(virtualAnchorEl);
      setVirtualAnchor(virtualAnchorEl);

      setSynonymsOptions({
        synonyms: wObj.synonyms || [],
        sentenceIndex: dataIndex, // Use data array index, not display index
        wordIndex: wI,
        showRephraseNav: true,
      });
      setHighlightSentence(sI); // Display index for highlighting

      // Reconstruct sentence from data
      setSentence((data[dataIndex] || [])?.map((w) => w?.word).join(" "));
    };

    dom.addEventListener("click", onClick);
    return () => dom.removeEventListener("click", onClick);
  }, [
    editor,
    annotatedData,
    data,
    setAnchorEl,
    setSynonymsOptions,
    setSentence,
    setHighlightSentence,
  ]);

  if (!editor) return null;
  return <EditorContent editor={editor} />;
}
