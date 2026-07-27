interface ParserComparisonSample {
  recordedAt: number;
  fileName: string;
  fileSize: number;
  baselineParser: string;
  candidateParser: string;
  baselinePages: number;
  candidatePages: number;
  baselineImageBased: boolean;
  candidateImageBased: boolean;
  baselineTextLength: number;
  candidateTextLength: number;
  baselineBlockCount: number;
  candidateBlockCount: number;
  textLengthDelta: number;
  pageDelta: number;
  blockCountDelta: number;
  imageBasedMismatch: boolean;
  baselinePreview: string;
  candidatePreview: string;
}

const MAX_SAMPLES = 25;
const samples: ParserComparisonSample[] = [];

export function recordParserComparisonSample(sample: ParserComparisonSample) {
  samples.unshift(sample);
  if (samples.length > MAX_SAMPLES) {
    samples.length = MAX_SAMPLES;
  }
}

export function getParserComparisonSamples() {
  return [...samples];
}

export function resetParserComparisonSamples() {
  samples.length = 0;
}

