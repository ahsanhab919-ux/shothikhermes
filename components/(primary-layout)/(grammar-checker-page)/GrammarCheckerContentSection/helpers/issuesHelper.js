// ✅ Smart position finder - finds error in context of sentence
const findErrorPosition = (fullText, error, sentence) => {
  // Step 1: Find the sentence in the full text
  let sentenceIndex = fullText.indexOf(sentence);

  if (sentenceIndex === -1) {
    // Try finding sentence without extra spaces
    const normalizedSentence = sentence.trim();
    sentenceIndex = fullText.indexOf(normalizedSentence);
  }

  if (sentenceIndex === -1) {
    console.warn(`Sentence not found: "${sentence}"`);
    return null;
  }

  // Step 2: Find the error within that sentence
  const sentenceText = fullText.substring(
    sentenceIndex,
    sentenceIndex + sentence.length,
  );
  let errorIndex = sentenceText.indexOf(error);

  if (errorIndex === -1) {
    console.warn(`Error "${error}" not found in sentence`);
    return null;
  }

  // Step 3: Check if it's a word boundary match (not part of another word)
  const absoluteStart = sentenceIndex + errorIndex;
  const absoluteEnd = absoluteStart + error.length;

  // Check what's before and after the error
  const beforeChar = absoluteStart > 0 ? fullText[absoluteStart - 1] : " ";
  const afterChar = absoluteEnd < fullText.length ? fullText[absoluteEnd] : " ";

  // Word boundary characters
  const wordBoundary = /[\s.,;:!?()\[\]{}"'`—–\-\n\r\t]/;

  // Check if it's at a word boundary
  const isAtBoundary =
    wordBoundary.test(beforeChar) && wordBoundary.test(afterChar);

  if (!isAtBoundary) {
    console.warn(`"${error}" at ${absoluteStart} is not at word boundary`);

    // Try to find another occurrence in the same sentence
    let searchStart = errorIndex + 1;
    while (searchStart < sentenceText.length) {
      errorIndex = sentenceText.indexOf(error, searchStart);
      if (errorIndex === -1) break;

      const newAbsoluteStart = sentenceIndex + errorIndex;
      const newAbsoluteEnd = newAbsoluteStart + error.length;
      const newBefore =
        newAbsoluteStart > 0 ? fullText[newAbsoluteStart - 1] : " ";
      const newAfter =
        newAbsoluteEnd < fullText.length ? fullText[newAbsoluteEnd] : " ";

      if (wordBoundary.test(newBefore) && wordBoundary.test(newAfter)) {
        return {
          startIndex: newAbsoluteStart,
          endIndex: newAbsoluteEnd,
        };
      }

      searchStart = errorIndex + 1;
    }

    // If no valid boundary found, return null
    return null;
  }

  return {
    startIndex: absoluteStart,
    endIndex: absoluteEnd,
  };
};

// ✅ Process issues and find correct positions
const processIssuesWithPositions = (fullText, issues) => {
  if (!fullText || !Array.isArray(issues)) return [];

  return issues
    .map((issue, index) => {
      const { error, correct, sentence, type } = issue;

      if (!error || !sentence) {
        console.warn("Invalid issue:", issue);
        return null;
      }

      // Find the correct position
      const position = findErrorPosition(fullText, error, sentence);

      if (!position) {
        console.warn(`Could not find position for error: "${error}"`);
        return null;
      }

      // Verify the position
      const extractedText = fullText.substring(
        position.startIndex,
        position.endIndex,
      );
      if (extractedText !== error) {
        console.warn(
          `Verification failed: Expected "${error}", found "${extractedText}" at ${position.startIndex}`,
        );
        return null;
      }

      return {
        ...issue,
        startIndex: position.startIndex,
        endIndex: position.endIndex,
        errorId: `error-${index}-${position.startIndex}`,
      };
    })
    .filter(Boolean);
};
