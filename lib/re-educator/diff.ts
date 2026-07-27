/**
 * Re-educator — diff utility (Phase 0).
 *
 * Normalized Levenshtein distance in [0,1], used by the REVISE stage to enforce
 * per-category minimum-diff bounds (RE-EDUCATOR-SPEC.md §4b). Pure, no deps.
 */

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** Normalized edit distance in [0,1] (0 = identical, 1 = fully different). */
export function normalizedDistance(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 0;
  return levenshtein(a, b) / maxLen;
}

/** True if the edit from `before` to `after` stays within the diff bound. */
export function withinBound(before: string, after: string, maxDiff: number): boolean {
  return normalizedDistance(before, after) <= maxDiff;
}
