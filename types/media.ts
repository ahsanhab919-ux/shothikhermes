/**
 * Type definitions for media generation and AI video services
 */

/**
 * Voice configuration for text-to-speech
 */
export interface Voice {
  voice_id: string;
  voice_name: string;
  preview_audio_url: string;
  gender: string;
}

/**
 * Grouped voices by gender
 */
export interface GroupedVoices {
  [gender: string]: Voice[];
}

/**
 * Raw voice data from API
 */
export interface RawVoiceData {
  name: string;
  gender: string;
  accents: Array<{
    id: string;
    accent_name: string;
    preview_url: string;
  }>;
}

/**
 * Raw voices grouped by gender from API
 */
export interface RawGroupedVoices {
  [gender: string]: RawVoiceData[];
}

/**
 * Video input segment for video generation
 */
export interface VideoInput {
  type: string;
  content: string;
  voice_id?: string;
  background_image?: string;
  [key: string]: unknown;
}

/**
 * Background music configuration
 */
export interface BackgroundMusic {
  url?: string;
  volume?: number;
  [key: string]: unknown;
}

/**
 * Call-to-action configuration at video end
 */
export interface CTAEnd {
  text?: string;
  url?: string;
  [key: string]: unknown;
}

/**
 * Video generation request payload
 */
export interface VideoGenerationPayload {
  requestId: string;
  video_inputs: VideoInput[];
  aspect_ratio: string;
  background_music?: BackgroundMusic;
  cta_end?: CTAEnd;
  webhook_url?: string;
  name: string;
  model_version: string;
  metadata?: Record<string, unknown>;
}

/**
 * Video generation response
 */
export interface VideoGenerationResponse {
  success: boolean;
  data?: {
    video_url?: string;
    requestId?: string;
    status?: string;
  };
  error?: string;
}

/**
 * Media generation status
 */
export type MediaGenerationStatus = "pending" | "processing" | "completed" | "failed";

/**
 * Media generation job
 */
export interface MediaGenerationJob {
  id: string;
  requestId: string;
  status: MediaGenerationStatus;
  video_url?: string;
  error?: string;
  created_at: string;
  updated_at: string;
}
