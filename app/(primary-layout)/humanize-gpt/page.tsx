import { Metadata } from "next";
import HumanizeGPTClient from "./HumanizeGPTClient";

export const dynamic = "force-dynamic";

const siteUrl = "https://www.shothik.ai";

export const metadata: Metadata = {
  title: "Humanize GPT Text - Shothik AI",
  description:
    "Transform AI-generated text into natural, human-like writing with Shothik AI. Bypass AI detectors and make your content sound authentically human.",
  keywords: [
    "humanize GPT",
    "humanize AI text",
    "AI to human text",
    "bypass AI detector",
    "human-like writing",
    "AI text humanizer",
    "Shothik AI",
  ],
  openGraph: {
    title: "Humanize GPT Text - Shothik AI",
    description:
      "Transform AI-generated text into natural, human-like writing with Shothik AI.",
    images: [{ url: `${siteUrl}/moscot.png`, width: 1200, height: 630, alt: "Shothik AI Humanize GPT" }],
    type: "website",
    url: `${siteUrl}/humanize-gpt`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Humanize GPT Text - Shothik AI",
    description:
      "Transform AI-generated text into natural, human-like writing with Shothik AI.",
    images: [`${siteUrl}/moscot.png`],
  },
};

export default function HumanizeGPTPage() {
  return <HumanizeGPTClient />;
}
