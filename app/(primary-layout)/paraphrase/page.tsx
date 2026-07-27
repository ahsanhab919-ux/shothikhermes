import ParaphraseContend from "@/components/tools/paraphrase/ParaphraseContend";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

const siteUrl = "https://www.shothik.ai";

export const metadata: Metadata = {
  title: "Paraphrase Tool - Shothik AI",
  description:
    "Paraphrase and rewrite text with Shothik AI's Paraphrase Tool. Rephrase sentences, paragraphs, and articles while maintaining meaning and improving clarity.",
  keywords: [
    "paraphrase tool",
    "paraphrasing tool",
    "text rewriter",
    "sentence rephraser",
    "content rephrasing",
    "AI paraphraser",
    "Shothik AI",
  ],
  openGraph: {
    title: "Paraphrase Tool - Shothik AI",
    description:
      "Paraphrase and rewrite text with Shothik AI. Rephrase sentences and articles while maintaining meaning.",
    images: [{ url: `${siteUrl}/moscot.png`, width: 1200, height: 630, alt: "Shothik AI Paraphrase Tool" }],
    type: "website",
    url: `${siteUrl}/paraphrase`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Paraphrase Tool - Shothik AI",
    description:
      "Paraphrase and rewrite text with Shothik AI's Paraphrase Tool.",
    images: [`${siteUrl}/moscot.png`],
  },
};

export default function ParaphrasePage() {
  return <ParaphraseContend />;
}
