import { redirect } from 'next/navigation';

export async function generateMetadata() {
  const siteUrl = "https://www.shothik.ai";

  return {
    title:
      "Shothik AI: Paraphrasing, Humanizing, AI Detector & Improve Writing",
    description:
      "Shothik AI: Paraphrase, humanize, detect AI & translate text to bypass Turnitin & GPTZero. Get a 100% human score & better writing for students, academics & SEOs.",
    keywords: [
      "Shothik",
      "Shothik AI",
      "AI writing tool",
      "Grammar Fix",
      "Sentence rephrasing",
      "Natural language generation",
      "Writing assistant",
      "Error-free writing",
      "Content optimization",
      "Writing enhancement",
      "Online writing tool",
      "AI-powered writing",
      "Writing productivity",
      "Writing efficiency",
      "Writing automation",
      "Online proofreading",
      "Writing software",
      "Language processing",
      "Contextual writing",
      "Automated writing",
      "Writing analysis",
    ],
    openGraph: {
      title:
        "Shothik AI: Paraphrasing, Humanizing, AI Detector & Improve Writing",
      description:
        "Paraphrase, humanize, detect & translate AI text with Shothik AI. Get better writing and bypass Turnitin & GPTZero. Perfect for students, academics & SEOs.",
      images: [
        {
          url: `${siteUrl}/moscot.png`,
          width: 1200,
          height: 630,
          alt: "Shothik AI Logo",
        },
      ],
      type: "website",
      url: siteUrl,
    },
    twitter: {
      card: "summary_large_image",
      title:
        "Shothik AI: Paraphrasing, Humanizing, AI Detector & Improve Writing",
      description:
        "Transform AI text with Shothik AI! Paraphrase, humanize, detect & translate. Perfect for students, academics, and SEOs. #Paraphrase #HumanizeText",
      images: [`${siteUrl}/moscot.png`],
    },
  };
}

const Home = () => {
  redirect('/agents/chat');
};

export default Home;
