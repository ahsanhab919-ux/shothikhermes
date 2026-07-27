import SummarizeContentSection from "@/components/(primary-layout)/(summarize-page)/SummarizeContentSection";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

const siteUrl = "https://www.shothik.ai";

export const metadata: Metadata = {
  title: "AI Summarizer - Shothik AI",
  description:
    "Summarize long texts, articles, and documents instantly with Shothik AI's Summarizer. Get concise, accurate summaries powered by advanced AI technology.",
  keywords: [
    "AI summarizer",
    "text summarizer",
    "article summarizer",
    "document summary",
    "automatic summarization",
    "content summarizer",
    "Shothik AI",
  ],
  openGraph: {
    title: "AI Summarizer - Shothik AI",
    description:
      "Summarize long texts, articles, and documents instantly with Shothik AI's Summarizer.",
    images: [{ url: `${siteUrl}/moscot.png`, width: 1200, height: 630, alt: "Shothik AI Summarizer" }],
    type: "website",
    url: `${siteUrl}/summarize`,
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Summarizer - Shothik AI",
    description:
      "Summarize long texts, articles, and documents instantly with Shothik AI's Summarizer.",
    images: [`${siteUrl}/moscot.png`],
  },
};

export default function SummarizePage() {
  return <SummarizeContentSection />;
}
