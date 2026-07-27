import { modes } from "@/_mock/tools/paraphrase";

export const PUNCTUATION_FOR_SPACING = "[.,;?!:]";

export function normalizePunctuationSpacing(text) {
  if (!text) return "";

  let formattedText = text;

  formattedText = formattedText.replace(/\s+/g, " ").trim();

  formattedText = formattedText.replace(
    new RegExp(`\\s+(${PUNCTUATION_FOR_SPACING}+)`, "g"),
    "$1",
  );

  formattedText = formattedText.replace(
    new RegExp(`(${PUNCTUATION_FOR_SPACING}+)(?!\\s|$)`, "g"),
    "$1 ",
  );

  return formattedText;
}

export const SYNONYMS = {
  20: "Basic",
  40: "Intermediate",
  60: "Advanced",
  80: "Expert",
};

export const initialFrozenWords = new Set();
export const initialFrozenPhrase = new Set();

export const isModeLockedForUser = (modeValue, userPackage) => {
  const mode = modes.find((m) => m.value === modeValue);
  if (!mode) return false;
  return !mode.package.includes(userPackage || "free");
};
