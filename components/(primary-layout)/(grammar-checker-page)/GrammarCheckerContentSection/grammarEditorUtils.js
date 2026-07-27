import { Mark, mergeAttributes } from "@tiptap/core";

export const ErrorMark = Mark.create({
  name: "errorMark",

  addAttributes() {
    return {
      error: { default: null },
      correct: { default: null },
      errorId: { default: null },
      sentence: { default: null },
      type: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-error]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-error": HTMLAttributes.error,
        "data-correct": HTMLAttributes.correct,
        "data-error-id": HTMLAttributes.errorId,
        "data-sentence": HTMLAttributes.sentence,
        "data-context": HTMLAttributes.context,
        "data-type": HTMLAttributes.type,
        class: "grammar-error-mark",
        style:
          "padding: 2px 0; cursor: pointer;",
      }),
      0,
    ];
  },
});

export const prepareText = (text) => {
  if (!text || typeof text !== "string") return "";
  return text
    .normalize("NFC")
    .trim()
    .replace(/\u200B|\u200C|\u200D/g, "");
};

export const isWordBoundary = (char) => {
  return /[\p{P}\p{Z}\p{C}]/u.test(char) || char === "";
};

export const findErrorPosition = (nodeText, sentence, context, error, nodePos) => {
  if (!nodeText.includes(sentence) && !sentence.includes(nodeText.trim())) {
    return null;
  }

  let searchText = nodeText;
  let searchOffset = 0;
  let contextStart = -1;
  let contextEnd = -1;

  if (context && context.trim()) {
    const contextIndex = nodeText.indexOf(context);
    if (contextIndex === -1) {
      return null;
    }
    contextStart = contextIndex;
    contextEnd = contextIndex + context.length;
    searchText = nodeText.substring(contextStart, contextEnd);
    searchOffset = contextStart;
  }

  const errorIndex = searchText.indexOf(error);
  if (errorIndex === -1) return null;

  const actualIndex = searchOffset + errorIndex;
  const start = nodePos + actualIndex;
  const end = start + error.length;

  if (context && context.trim() && contextStart !== -1) {
    const errorStartInNode = actualIndex;
    const errorEndInNode = actualIndex + error.length;

    if (errorStartInNode < contextStart || errorEndInNode > contextEnd) {
      return null;
    }
  }

  const beforeChar = actualIndex > 0 ? nodeText?.[actualIndex - 1] : " ";
  const afterChar =
    actualIndex + error.length < nodeText.length
      ? nodeText[actualIndex + error.length]
      : " ";

  if (!isWordBoundary(beforeChar) || !isWordBoundary(afterChar)) {
    return null;
  }

  return { start, end, actualIndex };
};
