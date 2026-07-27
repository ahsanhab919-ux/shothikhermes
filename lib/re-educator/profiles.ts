/**
 * Re-educator — verdict profiles (Phase 0).
 *
 * A profile maps each issue category to a verdict and a minimum-diff bound.
 * The engine is identical across modes; the mode just selects a profile. This
 * is the whole "Paraphrase = config, not new code" claim, made concrete.
 *
 * Spec: docs/RE-EDUCATOR-SPEC.md §4b.
 */

import type { IssueCategory } from './types';

export type Verdict = 'auto-fixable' | 'propose' | 'author-required';

export interface CategoryPolicy {
  verdict: Verdict;
  /** Max normalized Levenshtein distance an edit may change over the span. */
  maxDiff: number;
}

export type Profile = Record<IssueCategory, CategoryPolicy>;

/** Default profile for Review / Auto modes: conservative, meaning-first. */
export const STANDARD: Profile = {
  terminology: { verdict: 'auto-fixable', maxDiff: 0.15 },
  links: { verdict: 'auto-fixable', maxDiff: 0.15 },
  readability: { verdict: 'propose', maxDiff: 0.35 },
  'voice-drift': { verdict: 'propose', maxDiff: 0.3 },
  clarity: { verdict: 'propose', maxDiff: 0.4 },
  'unsupported-assertion': { verdict: 'author-required', maxDiff: 0 },
  pii: { verdict: 'author-required', maxDiff: 0 },
};

/**
 * Paraphrase = STANDARD with exactly two categories loosened (readability,
 * voice-drift) plus a wider clarity bound. Everything that touches meaning
 * (unsupported-assertion, pii) is untouched — that invariant keeps it safe.
 */
export const PARAPHRASE: Profile = {
  ...STANDARD,
  readability: { verdict: 'auto-fixable', maxDiff: 0.6 },
  'voice-drift': { verdict: 'auto-fixable', maxDiff: 0.6 },
  clarity: { verdict: 'propose', maxDiff: 0.7 },
};

export type ProfileName = 'standard' | 'paraphrase';

export const PROFILES: Record<ProfileName, Profile> = {
  standard: STANDARD,
  paraphrase: PARAPHRASE,
};

/**
 * Resolve the effective policy for an issue. A span overlapping a frozen anchor
 * is FORCED to author-required / maxDiff 0 BEFORE the profile is consulted, so
 * no profile can ever unfreeze an anchor.
 */
export function resolvePolicy(
  category: IssueCategory,
  profile: Profile,
  overlapsFrozenAnchor: boolean,
): CategoryPolicy {
  if (overlapsFrozenAnchor) {
    return { verdict: 'author-required', maxDiff: 0 };
  }
  return profile[category];
}
