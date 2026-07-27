function path(root, sublink) {
  return `${root}${sublink}`;
}

const ROOTS_AUTH = "/auth";
const ROOTS_ACCOUNT = "/account";
const ROOTS_PAYMENT = "/payment";

export const PATH_AUTH = {
  root: ROOTS_AUTH,
  login: path(ROOTS_AUTH, "/login"),
  register: path(ROOTS_AUTH, "/register"),
  verify: path(ROOTS_AUTH, "/verify"),
  forgotPassword: path(ROOTS_AUTH, "/forgot-password"),
  newPassword: path(ROOTS_AUTH, "/new-password"),
};

export const PATH_PAGE = {
  pricing: "/pricing",
  payment: "/payment",
  about: "/about-us",
  team: "/team",
  features: "/features",
  contact: "/contact-us",
  career: "/career",
  faqs: "/faqs",
  page403: "/403",
  page404: "/404",
  page500: "/500",
  howToVideos: "/how-to-videos",
  resellerPanel: "/reseller-panel",
  affiliateMarketing: "/affiliate-marketing",
  community: "/blogs",
  blogDetail: (id) => `/blogs/${id}`,
  tutorials: "/tutorials",
  privacy: "/privacy",
  deletion: "/deletion",
  terms: "/terms",
  paymentPolicy: "/payment/payment-policy",
  refundPolicy: "/payment/refund-policy",
  discord: "https://discord.gg/pq2wTqXEpj",
  magnaCarta: "/magna-carta",
  explore: "/explore",
  platformCommunity: "/community",
  forum: (id: string) => `/community/${id}`,
  agentProfile: (id: string) => `/agents/profile/${id}`,
  agentStudio: "/agent-studio",
};

export const PATH_ACCOUNT = {
  root: ROOTS_ACCOUNT,
  settings: {
    root: path(ROOTS_ACCOUNT, "/settings"),
    general: path(ROOTS_ACCOUNT, "/settings/?section=general"),
    billing: path(ROOTS_ACCOUNT, "/settings/?section=billing"),
  },
  agents: path(ROOTS_ACCOUNT, "/agents"),
  review: (bookId: string) => path(ROOTS_ACCOUNT, `/review/${bookId}`),
};

export const PATH_TOOLS = {
  discord: "https://discord.gg/pq2wTqXEpj",
  writing_studio: "/writing-studio",
  paraphrase: "/paraphrase",
  humanize: "/humanize-gpt",
  ai_detector: "/ai-detector",
  plagiarism_checker: "/plagiarism-checker",
  upgrade: "/payment/?subscription=RdEZI2hnuOuSgbk9KeT0&tenure=monthly",
  summarize: "/summarize",
  grammar_checker: "/grammar-checker",
  translator: "/translator",
  agents: "/agents",
  marketing_automation: "/marketing-automation",
  slide_generator: "/agents",
  deep_research: "/agents",
  data_analysis: "/agents",
  // slide_generator: "/slide-generator",
  // deep_research: "/deep-research",
  // data_analysis: "/data-analysis",
  // product_service_analysis: "/product-service-analysis",
  // ai_strategy_generation: "/ai-strategy-generation",
  // ai_ad_sets: "/ai-ad-sets",
  // ai_ad_creatives: "/ai-ad-creatives",
  // ai_ad_copies_ads: "/ai-ad-copies-ads",
  // ai_powered_editing: "/ai-powered-editing",
  // ai_media_canvas: "/ai-media-canvas",
  // ad_launch_campaigns: "/ad-launch-campaigns",
  // mindmap_reports: "/mindmap-reports",
  // ai_optimization: "/ai-optimization",
  product_service_analysis: "/marketing-automation",
  ai_strategy_generation: "/marketing-automation",
  ai_ad_sets: "/marketing-automation",
  ai_ad_creatives: "/marketing-automation",
  ai_ad_copies_ads: "/marketing-automation",
  ai_powered_editing: "/marketing-automation",
  ai_media_canvas: "/marketing-automation",
  ad_launch_campaigns: "/marketing-automation",
  mindmap_reports: "/marketing-automation",
  ai_optimization: "/marketing-automation",

  get: (name) => `/${name.toLowerCase().replaceAll(" ", "-")}`,
};

export const PAYMENT = {
  root: ROOTS_PAYMENT,
  bkash: path(ROOTS_PAYMENT, "/bkash"),
  stripe: path(ROOTS_PAYMENT, "/stripe"),
  razor: path(ROOTS_PAYMENT, "/razor"),
};
