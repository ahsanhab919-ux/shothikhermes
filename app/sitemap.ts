import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.shothik.ai";
  const now = new Date();

  const staticPages = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/agents/chat", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/paraphrase", priority: 0.9, changeFrequency: "weekly" as const },
    {
      path: "/grammar-checker",
      priority: 0.9,
      changeFrequency: "weekly" as const,
    },
    {
      path: "/ai-detector",
      priority: 0.9,
      changeFrequency: "weekly" as const,
    },
    {
      path: "/humanize-gpt",
      priority: 0.9,
      changeFrequency: "weekly" as const,
    },
    {
      path: "/plagiarism-checker",
      priority: 0.9,
      changeFrequency: "weekly" as const,
    },
    { path: "/summarize", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/translator", priority: 0.8, changeFrequency: "weekly" as const },
    {
      path: "/writing-studio",
      priority: 0.8,
      changeFrequency: "weekly" as const,
    },
    { path: "/research", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/about-us", priority: 0.5, changeFrequency: "monthly" as const },
    {
      path: "/contact-us",
      priority: 0.5,
      changeFrequency: "monthly" as const,
    },
    { path: "/pricing", priority: 0.7, changeFrequency: "weekly" as const },
    { path: "/blogs", priority: 0.6, changeFrequency: "daily" as const },
    { path: "/twin", priority: 0.7, changeFrequency: "weekly" as const },
  ];

  return staticPages.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
