/**
 * Usages components
 * @param{LANDING_PAGE} -> LandingPageAnalyticsProvider,
 */

export const trackingList = {
  LANDING_HERO: "landing_hero",
  LANDING_PAGE: "landing_page",
  CTA_BUTTON: "cta_button",
  HERO_VIDEO: "hero_video_play",

  EMAIL_MODAL: "email_modal",
  EXIT_INTENT_MODAL: "exit_intent_modal",
  MODAL_OPENED: "modal_opened",

  // HOW_IT_WORKS_CTA: "how_it_works_cta",
  PROCESS_STEP: "process_step",
  PROCESS_STEP_CLICK: "process_step_click",

  LIVE_AGENT: "live_agent",
  LIVE_AGENT_SIMULATION: "live_agent_simulation",

  BUSINESS_SECTION: "business_section",
  BUSINESS_VIDEO: "business_video",

  STOP_WORKING_SECTION: "stop_working_section",

  CAROUSEL_SECTION: "carousel_section",

  // CAROUSEL_CTA: "stop_working_cta",
  // AI_WRITING_CTA: "ai_writting_team_cta",

  JOURNEY_SECTION: "journey_section",

  WHY_STUDENT_CHOOSE_SECTION: "why_student_choose_section",

  FEATURE_SECTION: "feature_section",
  REAL_RESULT: "real_result",
  // TRANSFORM_WRITING_CTA: "transform_writing_cta",
  START_WRITING_SECTION: "start_writing_section",
} as const;
