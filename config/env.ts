export const ENV = {
  api_url: process.env.NEXT_PUBLIC_API_URL || "",
  app_url: process.env.NEXT_PUBLIC_APP_URL || "",
  convex_url: process.env.NEXT_PUBLIC_CONVEX_URL || "",
  writing_studio_api_url: process.env.NEXT_PUBLIC_WRITING_STUDIO_API_URL || process.env.NEXT_PUBLIC_API_URL || "",
  writing_studio_enabled: (process.env.NEXT_PUBLIC_WRITING_STUDIO_ENABLED || "true") === "true",
  paraphrase_socket_url: process.env.NEXT_PUBLIC_PARAPHRASE_SOCKET_URL || "",
  paraphrase_redirect_prefix: process.env.NEXT_PUBLIC_PARAPHRASE_REDIRECT_PREFIX || "paraphrase",
};
