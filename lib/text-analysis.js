export function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  
  const syllables = word.match(/[aeiouy]{1,2}/g);
  return syllables ? syllables.length : 1;
}

export function countSentences(text) {
  const sentences = text.match(/[.!?]+/g);
  return sentences ? sentences.length : (text.trim() ? 1 : 0);
}

export function countWords(text) {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  return words.length;
}

export function getWords(text) {
  return text.trim().split(/\s+/).filter(w => w.length > 0);
}

export function countParagraphs(text) {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  return paragraphs.length || (text.trim() ? 1 : 0);
}

export function fleschReadingEase(text) {
  const words = getWords(text);
  const wordCount = words.length;
  const sentenceCount = countSentences(text);
  const syllableCount = words.reduce((sum, word) => sum + countSyllables(word), 0);
  
  if (wordCount === 0 || sentenceCount === 0) return 0;
  
  const avgSentenceLength = wordCount / sentenceCount;
  const avgSyllablesPerWord = syllableCount / wordCount;
  
  const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
  return Math.max(0, Math.min(100, score));
}

export function fleschKincaidGradeLevel(text) {
  const words = getWords(text);
  const wordCount = words.length;
  const sentenceCount = countSentences(text);
  const syllableCount = words.reduce((sum, word) => sum + countSyllables(word), 0);
  
  if (wordCount === 0 || sentenceCount === 0) return 0;
  
  const avgSentenceLength = wordCount / sentenceCount;
  const avgSyllablesPerWord = syllableCount / wordCount;
  
  const grade = (0.39 * avgSentenceLength) + (11.8 * avgSyllablesPerWord) - 15.59;
  return Math.max(0, Math.min(18, grade));
}

export function getReadabilityLabel(score) {
  if (score >= 90) return { label: "Very Easy", color: "text-green-600", description: "5th grade" };
  if (score >= 80) return { label: "Easy", color: "text-green-500", description: "6th grade" };
  if (score >= 70) return { label: "Fairly Easy", color: "text-lime-500", description: "7th grade" };
  if (score >= 60) return { label: "Standard", color: "text-yellow-500", description: "8th-9th grade" };
  if (score >= 50) return { label: "Fairly Difficult", color: "text-orange-500", description: "10th-12th grade" };
  if (score >= 30) return { label: "Difficult", color: "text-orange-600", description: "College level" };
  return { label: "Very Difficult", color: "text-red-600", description: "Graduate level" };
}

export function getGradeLevelLabel(grade) {
  if (grade <= 5) return "Elementary";
  if (grade <= 8) return "Middle School";
  if (grade <= 12) return "High School";
  if (grade <= 16) return "Undergraduate";
  return "Graduate";
}

const PASSIVE_PATTERN = /\b(am|is|are|was|were|be|been|being)\s+(\w+ed|built|bought|caught|chosen|done|drawn|drunk|eaten|fallen|felt|found|forgotten|given|gone|grown|had|heard|held|hidden|hit|kept|known|laid|led|left|lent|lost|made|meant|met|paid|put|read|ridden|rung|run|said|seen|sent|shown|shut|sung|sat|slept|sold|spent|spoken|stood|stolen|struck|sworn|taken|taught|thought|thrown|told|understood|woken|won|worn|written)\b/i;

export function detectPassiveVoice(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const passiveSentences = [];
  
  sentences.forEach((sentence, index) => {
    if (PASSIVE_PATTERN.test(sentence)) {
      passiveSentences.push({
        index,
        sentence: sentence.trim(),
      });
    }
  });
  
  return {
    count: passiveSentences.length,
    total: sentences.length,
    percentage: sentences.length > 0 ? (passiveSentences.length / sentences.length) * 100 : 0,
    instances: passiveSentences,
  };
}

const COMPLEX_WORDS_THRESHOLD = 3;

export function detectComplexWords(text) {
  const words = getWords(text);
  const complexWords = words.filter(word => {
    const syllables = countSyllables(word);
    return syllables >= COMPLEX_WORDS_THRESHOLD && word.length > 6;
  });
  
  return {
    count: complexWords.length,
    total: words.length,
    percentage: words.length > 0 ? (complexWords.length / words.length) * 100 : 0,
    words: [...new Set(complexWords.map(w => w.toLowerCase()))].slice(0, 10),
  };
}

const HEDGING_WORDS = [
  "might", "may", "could", "possibly", "perhaps", "probably", "likely",
  "seemingly", "apparently", "somewhat", "relatively", "fairly", "rather",
  "quite", "almost", "nearly", "virtually", "basically", "essentially",
  "generally", "typically", "usually", "often", "sometimes", "occasionally",
  "tend to", "seems to", "appears to", "suggest", "indicate", "imply"
];

export function detectHedgingLanguage(text) {
  const lowerText = text.toLowerCase();
  const found = [];
  
  HEDGING_WORDS.forEach(hedge => {
    const regex = new RegExp(`\\b${hedge}\\b`, "gi");
    const matches = text.match(regex);
    if (matches) {
      found.push({ word: hedge, count: matches.length });
    }
  });
  
  const totalCount = found.reduce((sum, h) => sum + h.count, 0);
  const wordCount = countWords(text);
  
  return {
    count: totalCount,
    percentage: wordCount > 0 ? (totalCount / wordCount) * 100 : 0,
    instances: found.sort((a, b) => b.count - a.count).slice(0, 8),
  };
}

export function calculateAcademicToneScore(text) {
  const passive = detectPassiveVoice(text);
  const complex = detectComplexWords(text);
  const hedging = detectHedgingLanguage(text);
  const readability = fleschReadingEase(text);
  
  let score = 50;
  
  if (passive.percentage > 10 && passive.percentage < 30) score += 10;
  else if (passive.percentage >= 30) score += 5;
  
  if (complex.percentage > 10 && complex.percentage < 25) score += 15;
  else if (complex.percentage >= 25) score += 5;
  
  if (hedging.percentage > 0.5 && hedging.percentage < 3) score += 10;
  else if (hedging.percentage >= 3) score -= 5;
  
  if (readability >= 30 && readability <= 60) score += 15;
  else if (readability > 60 && readability <= 70) score += 10;
  
  return Math.max(0, Math.min(100, score));
}

const WEAK_WORDS = [
  "very", "really", "just", "quite", "rather", "somewhat", "pretty",
  "thing", "things", "stuff", "got", "get", "nice", "good", "bad",
  "big", "small", "a lot", "lots of", "kind of", "sort of"
];

const INFORMAL_WORDS = [
  "gonna", "wanna", "gotta", "kinda", "sorta", "yeah", "yep", "nope",
  "ok", "okay", "awesome", "cool", "stuff", "basically", "literally",
  "honestly", "actually", "like", "you know", "i mean", "right?"
];

const CONTRACTIONS = [
  "can't", "won't", "shouldn't", "wouldn't", "couldn't", "didn't",
  "doesn't", "isn't", "aren't", "wasn't", "weren't", "haven't",
  "hasn't", "hadn't", "don't", "it's", "that's", "there's", "here's",
  "what's", "who's", "he's", "she's", "they're", "we're", "you're",
  "i'm", "i've", "i'll", "i'd", "let's"
];

export function detectWeakWords(text) {
  const lowerText = text.toLowerCase();
  const found = [];
  
  WEAK_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    const matches = text.match(regex);
    if (matches) {
      found.push({ word, count: matches.length });
    }
  });
  
  return {
    count: found.reduce((sum, w) => sum + w.count, 0),
    instances: found.sort((a, b) => b.count - a.count),
  };
}

export function detectInformalLanguage(text) {
  const found = [];
  
  INFORMAL_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    const matches = text.match(regex);
    if (matches) {
      found.push({ word, count: matches.length });
    }
  });
  
  CONTRACTIONS.forEach(contraction => {
    const regex = new RegExp(`\\b${contraction.replace("'", "'")}\\b`, "gi");
    const matches = text.match(regex);
    if (matches) {
      found.push({ word: contraction, count: matches.length, isContraction: true });
    }
  });
  
  return {
    count: found.reduce((sum, w) => sum + w.count, 0),
    instances: found.sort((a, b) => b.count - a.count),
    hasContractions: found.some(f => f.isContraction),
  };
}

export function detectRepetition(text) {
  const words = getWords(text).map(w => w.toLowerCase().replace(/[^a-z]/g, ""));
  const wordCounts = {};
  
  words.forEach(word => {
    if (word.length > 4) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  });
  
  const repeated = Object.entries(wordCounts)
    .filter(([word, count]) => count >= 3)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return {
    count: repeated.length,
    instances: repeated,
  };
}

export function analyzeSentenceVariety(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  if (sentences.length < 2) {
    return { varietyScore: 0, avgLength: 0, shortCount: 0, longCount: 0, lengths: [] };
  }
  
  const lengths = sentences.map(s => getWords(s).length);
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  
  const shortCount = lengths.filter(l => l < 10).length;
  const mediumCount = lengths.filter(l => l >= 10 && l <= 20).length;
  const longCount = lengths.filter(l => l > 20).length;
  
  const stdDev = Math.sqrt(
    lengths.reduce((sum, l) => sum + Math.pow(l - avgLength, 2), 0) / lengths.length
  );
  
  const varietyScore = Math.min(100, Math.round((stdDev / avgLength) * 100 * 2));
  
  return {
    varietyScore,
    avgLength: Math.round(avgLength * 10) / 10,
    shortCount,
    mediumCount,
    longCount,
    lengths,
  };
}

export function getFullAnalysis(text) {
  if (!text || text.trim().length === 0) {
    return {
      wordCount: 0,
      sentenceCount: 0,
      paragraphCount: 0,
      avgSentenceLength: 0,
      avgWordLength: 0,
      readingEase: 0,
      gradeLevel: 0,
      readabilityInfo: getReadabilityLabel(0),
      gradeLevelLabel: "N/A",
      passiveVoice: { count: 0, total: 0, percentage: 0, instances: [] },
      complexWords: { count: 0, total: 0, percentage: 0, words: [] },
      hedgingLanguage: { count: 0, percentage: 0, instances: [] },
      academicToneScore: 0,
      weakWords: { count: 0, instances: [] },
      informalLanguage: { count: 0, instances: [], hasContractions: false },
      repetition: { count: 0, instances: [] },
      sentenceVariety: { varietyScore: 0, avgLength: 0, shortCount: 0, mediumCount: 0, longCount: 0, lengths: [] },
    };
  }
  
  const words = getWords(text);
  const wordCount = words.length;
  const sentenceCount = countSentences(text);
  const paragraphCount = countParagraphs(text);
  const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  const avgWordLength = wordCount > 0 ? words.join("").length / wordCount : 0;
  const readingEase = fleschReadingEase(text);
  const gradeLevel = fleschKincaidGradeLevel(text);
  
  return {
    wordCount,
    sentenceCount,
    paragraphCount,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    avgWordLength: Math.round(avgWordLength * 10) / 10,
    readingEase: Math.round(readingEase),
    gradeLevel: Math.round(gradeLevel * 10) / 10,
    readabilityInfo: getReadabilityLabel(readingEase),
    gradeLevelLabel: getGradeLevelLabel(gradeLevel),
    passiveVoice: detectPassiveVoice(text),
    complexWords: detectComplexWords(text),
    hedgingLanguage: detectHedgingLanguage(text),
    academicToneScore: calculateAcademicToneScore(text),
    weakWords: detectWeakWords(text),
    informalLanguage: detectInformalLanguage(text),
    repetition: detectRepetition(text),
    sentenceVariety: analyzeSentenceVariety(text),
  };
}
