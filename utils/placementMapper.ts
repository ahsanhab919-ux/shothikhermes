/**
 * Placement Mapper Utility
 * Maps ad formats to recommended Meta placements
 */

import type { AdFormat, Placement } from "@/types/metaCampaign";

/**
 * Get recommended placements for a given ad format
 */
export function getRecommendedPlacements(format: AdFormat): Placement[] {
  const placementMap: Record<AdFormat, Placement[]> = {
    // SHORT_VIDEO → Optimized for vertical, short-form content
    SHORT_VIDEO: [
      "REELS", // Instagram/Facebook Reels (primary)
      "INSTAGRAM_STORIES", // Instagram Stories
      "FACEBOOK_STORIES", // Facebook Stories
      "INSTAGRAM_FEED", // Instagram Feed (supports video)
      "FACEBOOK_FEED", // Facebook Feed (supports video)
    ],

    // LONG_VIDEO → Traditional video content (60s+)
    LONG_VIDEO: [
      "FACEBOOK_FEED", // Facebook Feed (primary for longer content)
      "INSTAGRAM_FEED", // Instagram Feed
      "FACEBOOK_STORIES", // Can show snippet
      "INSTAGRAM_STORIES", // Can show snippet
    ],

    // SINGLE_IMAGE → Static image ads
    SINGLE_IMAGE: [
      "FACEBOOK_FEED", // Facebook Feed (primary)
      "INSTAGRAM_FEED", // Instagram Feed (primary)
      "FACEBOOK_RIGHT_COLUMN", // Desktop sidebar
      "INSTAGRAM_EXPLORE", // Instagram Explore
      "FACEBOOK_STORIES", // Stories (with image)
      "INSTAGRAM_STORIES", // Stories (with image)
      "AUDIENCE_NETWORK", // Meta Audience Network
    ],

    // CAROUSEL → Multiple scrollable cards
    CAROUSEL: [
      "FACEBOOK_FEED", // Facebook Feed (primary)
      "INSTAGRAM_FEED", // Instagram Feed (primary)
      "FACEBOOK_RIGHT_COLUMN", // Desktop sidebar
      "INSTAGRAM_EXPLORE", // Instagram Explore
      "AUDIENCE_NETWORK", // Meta Audience Network
    ],

    // STORY → Immersive full-screen
    STORY: [
      "INSTAGRAM_STORIES", // Instagram Stories (primary)
      "FACEBOOK_STORIES", // Facebook Stories (primary)
      "MESSENGER", // Messenger Stories
    ],

    // VIDEO → Generic video
    VIDEO: [
      "FACEBOOK_FEED",
      "INSTAGRAM_FEED",
      "REELS",
      "FACEBOOK_STORIES",
      "INSTAGRAM_STORIES",
    ],

    // COLLECTION → Showcase multiple products
    COLLECTION: ["FACEBOOK_FEED", "INSTAGRAM_FEED", "INSTAGRAM_EXPLORE"],

    // SLIDESHOW → Lightweight video alternative
    SLIDESHOW: [
      "FACEBOOK_FEED",
      "INSTAGRAM_FEED",
      "FACEBOOK_STORIES",
      "INSTAGRAM_STORIES",
      "AUDIENCE_NETWORK",
    ],

    // INSTANT_EXPERIENCE → Immersive canvas
    INSTANT_EXPERIENCE: [
      "FACEBOOK_FEED",
      "INSTAGRAM_FEED",
      "FACEBOOK_STORIES",
      "INSTAGRAM_STORIES",
    ],
  };

  return placementMap[format] || ["AUTOMATIC"];
}

/**
 * Get primary (best) placement for a format
 */
export function getPrimaryPlacement(format: AdFormat): Placement {
  const primaryMap: Record<AdFormat, Placement> = {
    SHORT_VIDEO: "REELS",
    LONG_VIDEO: "FACEBOOK_FEED",
    SINGLE_IMAGE: "FACEBOOK_FEED",
    CAROUSEL: "FACEBOOK_FEED",
    STORY: "INSTAGRAM_STORIES",
    VIDEO: "FACEBOOK_FEED",
    COLLECTION: "FACEBOOK_FEED",
    SLIDESHOW: "FACEBOOK_FEED",
    INSTANT_EXPERIENCE: "FACEBOOK_FEED",
  };

  return primaryMap[format] || "AUTOMATIC";
}

/**
 * Get human-readable placement names
 */
export function getPlacementDisplayName(placement: Placement): string {
  const displayNames: Record<Placement, string> = {
    AUTOMATIC: "Automatic Placements (Recommended)",
    FACEBOOK_FEED: "Facebook Feed",
    INSTAGRAM_FEED: "Instagram Feed",
    FACEBOOK_STORIES: "Facebook Stories",
    INSTAGRAM_STORIES: "Instagram Stories",
    REELS: "Facebook & Instagram Reels",
    MESSENGER: "Messenger",
    AUDIENCE_NETWORK: "Audience Network",
    FACEBOOK_RIGHT_COLUMN: "Facebook Right Column",
    INSTAGRAM_EXPLORE: "Instagram Explore",
  };

  return displayNames[placement] || placement;
}

/**
 * Get placement icon/emoji
 */
export function getPlacementIcon(placement: Placement): string {
  const icons: Record<Placement, string> = {
    AUTOMATIC: "🎯",
    FACEBOOK_FEED: "📘",
    INSTAGRAM_FEED: "📸",
    FACEBOOK_STORIES: "📖",
    INSTAGRAM_STORIES: "📱",
    REELS: "🎬",
    MESSENGER: "💬",
    AUDIENCE_NETWORK: "🌐",
    FACEBOOK_RIGHT_COLUMN: "➡️",
    INSTAGRAM_EXPLORE: "🔍",
  };

  return icons[placement] || "📍";
}

/**
 * Format placement as a display object
 */
export interface PlacementDisplay {
  value: Placement;
  label: string;
  icon: string;
  isPrimary?: boolean;
}

export function getPlacementDisplay(
  format: AdFormat,
  placement: Placement
): PlacementDisplay {
  const primary = getPrimaryPlacement(format);

  return {
    value: placement,
    label: getPlacementDisplayName(placement),
    icon: getPlacementIcon(placement),
    isPrimary: placement === primary,
  };
}

/**
 * Get all placements with display info for a format
 */
export function getAllPlacementDisplays(format: AdFormat): PlacementDisplay[] {
  const placements = getRecommendedPlacements(format);
  const primary = getPrimaryPlacement(format);

  return placements.map((placement) => ({
    value: placement,
    label: getPlacementDisplayName(placement),
    icon: getPlacementIcon(placement),
    isPrimary: placement === primary,
  }));
}

/**
 * Get format recommendation description
 */
export function getFormatPlacementDescription(format: AdFormat): string {
  const descriptions: Record<AdFormat, string> = {
    SHORT_VIDEO:
      "Optimized for Reels and Stories - vertical 9:16 format, 15-60 seconds",
    LONG_VIDEO:
      "Best for Facebook Feed - horizontal or square format, 60+ seconds",
    SINGLE_IMAGE:
      "Works everywhere - recommended 1:1 (square) or 4:5 (portrait) ratio",
    CAROUSEL:
      "Multiple images/videos - best for storytelling, product catalogs",
    STORY:
      "Full-screen immersive - vertical 9:16, auto-advances after 5 seconds",
    VIDEO: "General video format - works across feeds, stories, and reels",
    COLLECTION: "Showcase product catalog - drives to Instant Experience",
    SLIDESHOW:
      "Lightweight video - 3-10 images with motion, works on slow connections",
    INSTANT_EXPERIENCE:
      "Immersive full-screen canvas - interactive mobile experience",
  };

  return descriptions[format] || "Select appropriate placements for your ad";
}
