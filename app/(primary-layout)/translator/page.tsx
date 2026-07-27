import Translator from "@/components/tools/translator/Translator";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

const siteUrl = "https://www.shothik.ai";

export const metadata: Metadata = {
  title: "AI Translator - Shothik AI",
  description:
    "Translate text between multiple languages with Shothik AI's Translator. Fast, accurate AI-powered translations for documents, articles, and more.",
  keywords: [
    "AI translator",
    "text translator",
    "language translator",
    "online translation",
    "AI translation",
    "multilingual translator",
    "Shothik AI",
  ],
  openGraph: {
    title: "AI Translator - Shothik AI",
    description:
      "Translate text between multiple languages with Shothik AI's Translator. Fast, accurate AI-powered translations.",
    images: [{ url: `${siteUrl}/moscot.png`, width: 1200, height: 630, alt: "Shothik AI Translator" }],
    type: "website",
    url: `${siteUrl}/translator`,
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Translator - Shothik AI",
    description:
      "Translate text between multiple languages with Shothik AI's Translator.",
    images: [`${siteUrl}/moscot.png`],
  },
};

export default function TranslatorPage() {
  return <Translator />;
}
