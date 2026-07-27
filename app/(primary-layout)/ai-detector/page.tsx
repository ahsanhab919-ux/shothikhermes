import AiDetectorContentSection from "@/components/(primary-layout)/(ai-detector-page)/AiDetectorContentSection";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

const siteUrl = "https://www.shothik.ai";

export const metadata: Metadata = {
  title: "AI Detector - Shothik AI",
  description:
    "Detect AI-generated text instantly with Shothik AI's advanced AI Detector. Identify content from ChatGPT, GPT-4, and other AI models with high accuracy.",
  keywords: [
    "AI detector",
    "AI content detector",
    "ChatGPT detector",
    "GPT detector",
    "AI text detection",
    "AI writing detector",
    "Shothik AI",
  ],
  openGraph: {
    title: "AI Detector - Shothik AI",
    description:
      "Detect AI-generated text instantly with Shothik AI's advanced AI Detector. Identify content from ChatGPT, GPT-4, and other AI models.",
    images: [{ url: `${siteUrl}/moscot.png`, width: 1200, height: 630, alt: "Shothik AI Detector" }],
    type: "website",
    url: `${siteUrl}/ai-detector`,
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Detector - Shothik AI",
    description:
      "Detect AI-generated text instantly with Shothik AI's advanced AI Detector.",
    images: [`${siteUrl}/moscot.png`],
  },
};

export default function AIDetectorPage() {
  return <AiDetectorContentSection />;
}
