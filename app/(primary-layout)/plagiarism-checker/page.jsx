import PlagiarismCheckerContentSection from "@/components/(primary-layout)/(plagiarism-checker)/PlagiarismCheckerContentSection";
import ToolPageWrapper from "@/components/tools/common/ToolPageWrapper";

export const dynamic = 'force-dynamic';

const siteUrl = "https://www.shothik.ai";

export const metadata = {
  title: "Plagiarism Checker - Shothik AI",
  description:
    "Check your text for plagiarism with Shothik AI's Plagiarism Checker. Scan content against billions of sources to ensure originality and academic integrity.",
  keywords: [
    "plagiarism checker",
    "plagiarism detector",
    "originality checker",
    "content plagiarism",
    "academic integrity",
    "duplicate content",
    "Shothik AI",
  ],
  openGraph: {
    title: "Plagiarism Checker - Shothik AI",
    description:
      "Check your text for plagiarism with Shothik AI. Scan content against billions of sources to ensure originality.",
    images: [{ url: `${siteUrl}/moscot.png`, width: 1200, height: 630, alt: "Shothik AI Plagiarism Checker" }],
    type: "website",
    url: `${siteUrl}/plagiarism-checker`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Plagiarism Checker - Shothik AI",
    description:
      "Check your text for plagiarism with Shothik AI's Plagiarism Checker.",
    images: [`${siteUrl}/moscot.png`],
  },
};

const PlagiarismCheckerPage = () => {
  return (
    <div>
      <ToolPageWrapper tool="plagiarism">
        <PlagiarismCheckerContentSection />
      </ToolPageWrapper>
    </div>
  );
};

export default PlagiarismCheckerPage;
