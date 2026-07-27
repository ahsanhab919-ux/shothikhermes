import { Metadata } from "next";
import GrammarCheckerClient from "./GrammarCheckerClient";

export const dynamic = "force-dynamic";

const siteUrl = "https://www.shothik.ai";

export const metadata: Metadata = {
  title: "Grammar Checker - Shothik AI",
  description:
    "Fix grammar, spelling, and punctuation errors instantly with Shothik AI's Grammar Checker. Improve your writing with AI-powered grammar correction.",
  keywords: [
    "grammar checker",
    "grammar correction",
    "spelling checker",
    "punctuation checker",
    "writing improvement",
    "AI grammar tool",
    "Shothik AI",
  ],
  openGraph: {
    title: "Grammar Checker - Shothik AI",
    description:
      "Fix grammar, spelling, and punctuation errors instantly with Shothik AI's Grammar Checker.",
    images: [{ url: `${siteUrl}/moscot.png`, width: 1200, height: 630, alt: "Shothik AI Grammar Checker" }],
    type: "website",
    url: `${siteUrl}/grammar-checker`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Grammar Checker - Shothik AI",
    description:
      "Fix grammar, spelling, and punctuation errors instantly with Shothik AI's Grammar Checker.",
    images: [`${siteUrl}/moscot.png`],
  },
};

export default function GrammarCheckerPage() {
  return <GrammarCheckerClient />;
}
