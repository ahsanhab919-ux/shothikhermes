export interface ParaphraseInlineError {
  message: string;
  fragment: string;
  chipLabel: string;
}

export function getSentenceFragment(input: string, maxLength = 140) {
  if (!input) return "";
  const normalized = input.replace(/\s+/g, " ").trim();
  if (!normalized) return "";

  const firstSentence =
    normalized.split(/(?<=[.!?।])\s+/).find((part) => part.trim().length > 0) || normalized;

  return firstSentence.length > maxLength
    ? `${firstSentence.slice(0, maxLength - 1).trimEnd()}…`
    : firstSentence;
}

export function buildParaphraseInlineError(error: unknown, input: string): ParaphraseInlineError {
  const fallbackMessage = "We couldn’t paraphrase that section. Please try again.";

  const rawMessage =
    typeof error === "object" && error !== null
      ? // @ts-expect-error legacy error shape
        error?.data?.message || error?.message || fallbackMessage
      : fallbackMessage;

  let message = String(rawMessage || fallbackMessage);
  if (/limit/i.test(message)) {
    message = "This text is too long for one request. Shorten it or split it into smaller sections.";
  } else if (/connection lost/i.test(message)) {
    message = "The connection dropped before paraphrasing completed. Retry to continue.";
  }

  return {
    message,
    fragment: getSentenceFragment(input),
    chipLabel: message.length > 48 ? `${message.slice(0, 45).trimEnd()}...` : message,
  };
}
