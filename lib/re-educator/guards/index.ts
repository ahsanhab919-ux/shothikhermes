/**
 * Re-educator deterministic guards — barrel export (Phase 0).
 *
 * All guards are pure functions: (text, ctx?) => Issue[]. No LLM, no network,
 * no I/O. They run on the box you already have (no GPU). Spec: RE-EDUCATOR-SPEC.md.
 */

export { readability } from './readability';
export type { ReadabilityOptions } from './readability';

export { terminology } from './terminology';
export type { TerminologyOptions, TerminologyRule } from './terminology';

export { links } from './links';

export { pii } from './pii';

export { voiceDrift } from './voice-drift';
export type { VoiceProfile } from './voice-drift';
