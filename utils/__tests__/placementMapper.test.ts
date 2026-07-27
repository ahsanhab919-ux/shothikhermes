import { describe, expect, it } from 'vitest';
import {
  getPrimaryPlacement,
  getRecommendedPlacements,
  getPlacementDisplayName,
} from '../placementMapper';

describe('placementMapper', () => {
  it('returns reels as primary placement for short video', () => {
    expect(getPrimaryPlacement('SHORT_VIDEO')).toBe('REELS');
  });

  it('includes instagram stories for story format', () => {
    expect(getRecommendedPlacements('STORY')).toContain('INSTAGRAM_STORIES');
  });

  it('returns a human-readable placement label', () => {
    expect(getPlacementDisplayName('FACEBOOK_FEED')).toBe('Facebook Feed');
  });
});
