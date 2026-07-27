// optimizedDetectLanguage.js
import { languages } from "@/_mock/tools/languages";

/**
 * detectLanguage with early-exit short-circuit.
 *
 * Returns exactly the same strings as our original function:
 * - "Auto Detect" (when nothing matched)
 * - "English (US)" (when English is most frequent)
 * - or the most frequent language name from `languages`.
 *
 * Options:
 *  - earlyConfidence: fraction (0..1) required to short-circuit (default 0.66)
 *  - minProcessedChars: minimum characters to inspect before allowing early-exit (default 300)
 *  - minAbsoluteCount: minimum absolute matches required to allow early-exit (default 20)
 *
 * Explanations:
 *  - The default minProcessedChars = 300 is conservative: it prevents premature short-circuits on very short inputs while still allowing big inputs to exit early. You can lower it (e.g., 100) to be more aggressive or raise it if you want more certainty.
 *  - earlyConfidence = 0.66 means the leader must make up at least 66% of processed chars to short-circuit. Adjust if you want stricter/looser early exits.
 *  - minAbsoluteCount prevents a language from being returned if it only has a tiny number of matching chars even if the fraction is high (useful for very small processed sets).
 *  - This preserves the exact return strings our existing code expects so downstream features won’t break.
 */
export const detectLanguageV2 = (input, options = {}) => {
  if (!input) return "Auto Detect";

  const {
    earlyConfidence = 0.66,
    minProcessedChars = 300,
    minAbsoluteCount = 20,
    maxWordsForStopwords = 30,
  } = options;

  const langFrequency = new Map();
  const langs = languages;
  let processed = 0;

  // Spanish heuristics (fast Sets)
  const SPANISH_DIACRITICS = new Set([
    "ñ",
    "Ñ",
    "á",
    "Á",
    "é",
    "É",
    "í",
    "Í",
    "ó",
    "Ó",
    "ú",
    "Ú",
    "ü",
    "Ü",
  ]);
  const SPANISH_STOPWORDS = new Set([
    "el",
    "la",
    "los",
    "las",
    "de",
    "y",
    "que",
    "un",
    "una",
    "por",
    "para",
    "con",
    "se",
    "su",
    "es",
    "al",
    "lo",
  ]);

  // stopword scanning bounded to first N words
  let words = [];
  let currentWord = "";
  let spanishStopwordScore = 0;
  let spanishDiacriticCount = 0;

  const getLeader = () => {
    let leader = null;
    let leaderCount = 0;
    for (const [name, count] of langFrequency.entries()) {
      if (count > leaderCount) {
        leader = name;
        leaderCount = count;
      }
    }
    return { leader, leaderCount };
  };

  // simple helper to flush currentWord into words array and update score
  const flushWord = () => {
    if (!currentWord) return;
    if (words.length < maxWordsForStopwords) {
      const w = currentWord.toLowerCase();
      words.push(w);
      if (SPANISH_STOPWORDS.has(w)) spanishStopwordScore++;
    }
    currentWord = "";
  };

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const code = input.charCodeAt(i);

    // collect word chars (basic Latin + accented letters + apostrophe)
    if (/[A-Za-zÀ-ÿñÑçÇáéíóúÁÉÍÓÚüÜãõÃÕœŒßẞ'-]/.test(ch)) {
      currentWord += ch;
    } else {
      // non-letter -> flush
      flushWord();
    }

    // diacritic quick test (cheap)
    if (SPANISH_DIACRITICS.has(ch)) spanishDiacriticCount++;

    // original matching behavior: iterate languages and count first matching range
    for (let j = 0; j < langs.length; j++) {
      const lang = langs[j];
      if (code >= lang.range[0] && code <= lang.range[1]) {
        langFrequency.set(lang.name, (langFrequency.get(lang.name) || 0) + 1);
        break;
      }
    }

    processed++;

    // Early-exit short-circuit (preserve Option A behavior)
    if (processed >= minProcessedChars) {
      const { leader, leaderCount } = getLeader();
      if (
        leader &&
        leaderCount >= minAbsoluteCount &&
        leaderCount / processed >= earlyConfidence
      ) {
        // If leader is English, check Spanish heuristics before returning English
        if (leader === "English") {
          // high-confidence Spanish override: diacritics OR at least 2 Spanish stopwords
          if (spanishDiacriticCount > 0 || spanishStopwordScore >= 2) {
            return "Spanish";
          }
          return "English (US)";
        }
        return leader;
      }
    }
  }

  // flush leftover word
  flushWord();

  if (langFrequency.size === 0) return "Auto Detect";

  const mostFrequentLanguage = [...langFrequency.entries()].reduce((a, b) =>
    a[1] > b[1] ? a : b,
  )[0];

  // Final Spanish override: if English was chosen but Spanish evidence exists, prefer Spanish
  if (mostFrequentLanguage === "English") {
    if (spanishDiacriticCount > 0 || spanishStopwordScore >= 2) {
      return "Spanish";
    }
    return "English (US)";
  }

  return mostFrequentLanguage;
};
