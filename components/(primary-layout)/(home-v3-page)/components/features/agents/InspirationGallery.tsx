"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  Brain,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  PenTool,
  Presentation,
  Rocket,
  ScanSearch,
  TrendingUp,
  UserPlus,
  Video,
} from "lucide-react";
import type { StaticImageData } from "next/image";
import Image from "next/image";
import { useState } from "react";

// Import Shothik feature logos
import AIDetectorIcon from "@/components/(primary-layout)/(home-v3-page)/attached_assets/icons/AI Detector.svg";
import HumanizeGPTIcon from "@/components/(primary-layout)/(home-v3-page)/attached_assets/icons/Humanize GPT.svg";
import ParaphraseIcon from "@/components/(primary-layout)/(home-v3-page)/attached_assets/icons/Paraphrase.svg";
import SummarizeIcon from "@/components/(primary-layout)/(home-v3-page)/attached_assets/icons/Summarize.svg";
import TranslatorIcon from "@/components/(primary-layout)/(home-v3-page)/attached_assets/icons/Translator.svg";

// Import brand-colored images
import academicResearchImg from "@/components/(primary-layout)/(home-v3-page)/attached_assets/generated_images/Academic_research_database_f83c0112.webp";
import academicSlidesImg from "@/components/(primary-layout)/(home-v3-page)/attached_assets/generated_images/Academic_slides_scholarly_d0594423.webp";
import aiDetectionImg from "@/components/(primary-layout)/(home-v3-page)/attached_assets/generated_images/AI_detector_blue-green_b12ba8ea.webp";
import dashboardImg from "@/components/(primary-layout)/(home-v3-page)/attached_assets/generated_images/Analytics_command_center_cc3460f4.webp";
import businessPresentationImg from "@/components/(primary-layout)/(home-v3-page)/attached_assets/generated_images/Business_presentations_data_b07bdcf0.webp";
import campaignImg from "@/components/(primary-layout)/(home-v3-page)/attached_assets/generated_images/Campaign_brain_neural_87fb1955.webp";
import creativeImg from "@/components/(primary-layout)/(home-v3-page)/attached_assets/generated_images/Creative_canvas_AI_f5886843.webp";
import aiRobotImg from "@/components/(primary-layout)/(home-v3-page)/attached_assets/generated_images/Humanizer_transformation_blue-green_8b4c2051.webp";
import leadGenerationImg from "@/components/(primary-layout)/(home-v3-page)/attached_assets/generated_images/Lead_generation_network_fb03033e.webp";
import marketResearchImg from "@/components/(primary-layout)/(home-v3-page)/attached_assets/generated_images/Market_research_insights_b3b57afc.webp";
import paraphrasingImg from "@/components/(primary-layout)/(home-v3-page)/attached_assets/generated_images/Paraphrasing_green-blue_arrows_c569233c.webp";
import plagiarismImg from "@/components/(primary-layout)/(home-v3-page)/attached_assets/generated_images/Plagiarism_shield_green-blue_67cd9cd3.webp";
import productLinkImg from "@/components/(primary-layout)/(home-v3-page)/attached_assets/generated_images/Product_link_scanner_504b802d.webp";
import rocketImg from "@/components/(primary-layout)/(home-v3-page)/attached_assets/generated_images/Rocket_launch_growth_81640870.webp";
import stockAnalysisImg from "@/components/(primary-layout)/(home-v3-page)/attached_assets/generated_images/Stock_analysis_charts_f0dae739.webp";
import summaryImg from "@/components/(primary-layout)/(home-v3-page)/attached_assets/generated_images/Summarizer_compression_visual_fd8495fa.webp";
import translationImg from "@/components/(primary-layout)/(home-v3-page)/attached_assets/generated_images/Translation_globe_connections_35d12fd5.webp";
import videoImg from "@/components/(primary-layout)/(home-v3-page)/attached_assets/generated_images/Video_production_suite_8ea05291.webp";

interface GalleryCard {
  id: string;
  category: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  image: StaticImageData | string;
}

const galleryCards: GalleryCard[] = [
  {
    id: "paraphrasing",
    category: "writing",
    icon: (
      <Image src={ParaphraseIcon} alt="Paraphrase" width={32} height={32} />
    ),
    title: "Paraphrasing Engine – Rewrite Smarter, Faster",
    description:
      "Built-in plagiarism check, enhanced editor, multiple modes, tone control. Academic-grade paraphrasing for STEM researchers.",
    image: paraphrasingImg,
  },
  {
    id: "plagiarism",
    category: "writing",
    icon: (
      <Image src={AIDetectorIcon} alt="AI Detector" width={32} height={32} />
    ),
    title: "Plagiarism Check – Safe, Original Content",
    description:
      "Beat Turnitin detection. Scan billions of sources before submitting—catch plagiarism before your professor does.",
    image: plagiarismImg,
  },
  {
    id: "ai-detector",
    category: "writing",
    icon: (
      <Image src={AIDetectorIcon} alt="AI Detector" width={32} height={32} />
    ),
    title: "AI Detector – Know What's Real",
    description:
      "Detect AI-generated sentences from any LLM instantly. Grade with confidence. See which sentences students wrote vs. ChatGPT generated.",
    image: aiDetectionImg,
  },
  {
    id: "humanized-gpt",
    category: "writing",
    icon: (
      <Image src={HumanizeGPTIcon} alt="Humanize GPT" width={32} height={32} />
    ),
    title: "Humanized GPT – Get 100% human score.",
    description:
      "Converts AI generated content into human content. Bypass AI detectors like Turnitin, GPTzero, Originality AI and more.",
    image: aiRobotImg,
  },
  {
    id: "translation",
    category: "writing",
    icon: (
      <Image src={TranslatorIcon} alt="Translator" width={32} height={32} />
    ),
    title: "Translation Tool – Communicate Globally",
    description:
      "Translation in 100+ Languages. Instantly translate text and documents. Perfect for students, businesses, and global teams.",
    image: translationImg,
  },
  {
    id: "summarizer",
    category: "writing",
    icon: <Image src={SummarizeIcon} alt="Summarize" width={32} height={32} />,
    title: "Smart Summarizer – Key Insights, Fast",
    description:
      "Save hours of reading. Instantly summarize reports, research papers, and articles into key insights.",
    image: summaryImg,
  },
  {
    id: "business-presentations",
    category: "productivity",
    icon: <Presentation size={32} strokeWidth={1.5} />,
    title: "Business Presentations: Pitch Decks in 60 Seconds",
    description:
      "Investor pitch? Sales deck? Quarterly report? AI researches content, designs slides, builds professional presentations instantly.",
    image: businessPresentationImg,
  },
  {
    id: "academic-slides",
    category: "productivity",
    icon: <PenTool size={32} strokeWidth={1.5} />,
    title: "Academic Slides: Research to Presentation Fast",
    description:
      "Conference talk? Thesis defense? Class presentation? AI converts research into polished slides with citations instantly.",
    image: academicSlidesImg,
  },
  {
    id: "stock-analysis-agent",
    category: "productivity",
    icon: <TrendingUp size={32} strokeWidth={1.5} />,
    title: "Stock Analysis: Track Any Stock Instantly",
    description:
      "Track Tesla? Monitor crypto? Compare sectors? AI scrapes live prices, news, SEC filings—delivers organized spreadsheets instantly.",
    image: stockAnalysisImg,
  },
  {
    id: "lead-gen-agent",
    category: "productivity",
    icon: <UserPlus size={32} strokeWidth={1.5} />,
    title: "Lead Generation: Real-Time B2B Prospects",
    description:
      "Need B2B leads? LinkedIn prospects? Competitor customers? AI scrapes data, finds emails, builds spreadsheets instantly.",
    image: leadGenerationImg,
  },
  {
    id: "academic-research",
    category: "productivity",
    icon: <GraduationCap size={32} strokeWidth={1.5} />,
    title: "Academic Research: Scholarly Sources in Minutes",
    description:
      "Thesis? Literature review? Term paper? AI searches academic databases, finds peer-reviewed sources, builds citations instantly.",
    image: academicResearchImg,
  },
  {
    id: "market-research",
    category: "productivity",
    icon: <BarChart3 size={32} strokeWidth={1.5} />,
    title: "Market Research: Industry Insights Automated",
    description:
      "Competitor analysis? Market trends? Consumer insights? AI scans industry reports, extracts data, delivers research briefs instantly.",
    image: marketResearchImg,
  },
  {
    id: "drop-link-decode",
    category: "meta-automation",
    icon: <ScanSearch size={32} strokeWidth={1.5} />,
    title: "Smart Product Scan",
    description:
      "Upload any product link — AI studies your market, competitors, and audience to reveal what messaging converts best. → Instant clarity. No manual research.",
    image: productLinkImg,
  },
  {
    id: "campaign-brain",
    category: "meta-automation",
    icon: <Brain size={32} strokeWidth={1.5} />,
    title: "Instant Campaign Maker",
    description:
      "From one click, AI structures your campaign: persona → adset → ad creative → ad copy. → Get a full-funnel strategy ready to deploy.",
    image: campaignImg,
  },
  {
    id: "meta-vibe-canvas",
    category: "meta-automation",
    icon: <MessageSquare size={32} strokeWidth={1.5} />,
    title: "Creative Chat Canvas",
    description:
      "Talk to your ads. Literally. Change visuals, copy, or style through natural chat — AI adjusts everything instantly. → Zero design tools. Full creative control.",
    image: creativeImg,
  },
  {
    id: "andromeda-media",
    category: "meta-automation",
    icon: <Video size={32} strokeWidth={1.5} />,
    title: "Infinite Creative Variations",
    description:
      "Generate UGC, influencer videos, carousels, or reels — powered by the Andromeda algorithm. → One concept, infinite content formats.",
    image: videoImg,
  },
  {
    id: "click-launch-learn",
    category: "meta-automation",
    icon: <Rocket size={32} strokeWidth={1.5} />,
    title: "One Click, All Live",
    description:
      "Push your adsets directly to Facebook from inside the canvas. → No exports, no setup, no confusion — just go live.",
    image: rocketImg,
  },
  {
    id: "dashboard-command",
    category: "meta-automation",
    icon: <LayoutDashboard size={32} strokeWidth={1.5} />,
    title: "AI Mindmap & Dashboard",
    description:
      "See performance, ask questions, and take one-click optimization actions. → Earn and learn simultaneously — the more you run, the smarter it gets.",
    image: dashboardImg,
  },
];

const categories = [
  { id: "writing", label: "Writing Suite" },
  { id: "productivity", label: "Professional Suite" },
  { id: "meta-automation", label: "Meta Automation Suite" },
];

export default function InspirationGallery() {
  const [selectedCategory, setSelectedCategory] = useState("writing");
  const prefersReducedMotion = useReducedMotion();

  const filteredCards = galleryCards.filter(
    (card) => card.category === selectedCategory,
  );

  return (
    <section
      id="product-suites"
      data-testid="section-inspiration-gallery"
      className="bg-background py-20 md:py-32"
    >
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <div className="text-overline text-muted-foreground mb-2 text-sm tracking-widest uppercase">
            Product Suites
          </div>
          <h2 className="text-h2 text-foreground mb-4 text-4xl font-bold md:text-5xl">
            Powerful AI tools for every workflow
          </h2>
          <p className="text-h6 text-muted-foreground mx-auto max-w-2xl font-normal">
            From intelligent writing assistance to automated Meta
            campaigns—discover our complete suite of AI-powered solutions
          </p>
        </div>

        <div className="mb-12 flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <Badge
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat.id)}
              data-testid={`gallery-category-${cat.id}`}
              className={`cursor-pointer px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                  : "bg-card text-foreground border-border hover:bg-muted"
              }`}
            >
              {cat.label}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredCards.map((card, index) => (
              <motion.div
                key={card.id}
                layout
                initial={{
                  opacity: prefersReducedMotion ? 1 : 0,
                  y: prefersReducedMotion ? 0 : 20,
                }}
                animate={{ opacity: 1, y: 0 }}
                exit={{
                  opacity: prefersReducedMotion ? 1 : 0,
                  y: prefersReducedMotion ? 0 : -20,
                }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : {
                        duration: 0.3,
                        delay: index * 0.1,
                        ease: [0.22, 1, 0.36, 1],
                      }
                }
              >
                <Card
                  data-testid={`gallery-card-${card.id}`}
                  className="bg-card border-border group relative flex h-full flex-col overflow-hidden rounded-lg border transition-all duration-300 hover:shadow-lg"
                  style={{
                    ...(index === 0 && {
                      transition: "all 0.3s ease",
                    }),
                  }}
                  onMouseEnter={(e) => {
                    if (index === 0) {
                      e.currentTarget.style.transform = "translateY(-4px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (index === 0) {
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                >
                  <CardContent className="flex-grow p-5 pb-20">
                    <div className="flex items-start gap-3">
                      <div className="bg-muted text-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                        {card.icon}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-h6 text-foreground mb-2 text-lg font-semibold">
                          {card.title}
                        </h3>

                        <p className="text-body2 text-muted-foreground text-sm leading-relaxed">
                          {card.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>

                  <div className="card-image before:to-card absolute right-0 bottom-0 left-0 translate-y-2.5 transform px-8 pb-0 transition-transform duration-300 group-hover:translate-y-16 before:pointer-events-none before:absolute before:top-[-25px] before:right-0 before:left-0 before:h-[25px] before:bg-gradient-to-b before:from-transparent before:content-['']">
                    <Image
                      src={
                        typeof card.image === "string" ? card.image : card.image
                      }
                      alt={card.title}
                      className="mx-auto h-20 w-[85%] rounded-t-lg object-cover shadow-[0_8px_24px_rgba(0,0,0,0.15),0_4px_8px_rgba(0,0,0,0.1)]"
                    />
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
