"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight,
  Bot,
  Play,
  Sparkles,
  Star,
  TrendingUp,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

// Import sidebar icons
import agentIcon from "@/components/(primary-layout)/(home-v3-page)/attached_assets/Agent_1759908370558.png";
import aiDetectorIcon from "@/components/(primary-layout)/(home-v3-page)/attached_assets/AI Detector_1759908376738.png";
import grammarIcon from "@/components/(primary-layout)/(home-v3-page)/attached_assets/Grammar Fix_1759908381522.png";
import humanizeIcon from "@/components/(primary-layout)/(home-v3-page)/attached_assets/Humanize GPT_1759908388806.png";
import paraphraseIcon from "@/components/(primary-layout)/(home-v3-page)/attached_assets/Paraphrase_1759908407164.png";
import summarizeIcon from "@/components/(primary-layout)/(home-v3-page)/attached_assets/Summarize_1759908412611.png";
import translatorIcon from "@/components/(primary-layout)/(home-v3-page)/attached_assets/Translator_1759908416747.png";

const writingTools = [
  {
    icon: paraphraseIcon,
    title: "Paraphrase",
    description:
      "Built-in plagiarism checker - no separate subscriptions needed",
    highlight: "Real-time originality scores",
  },
  {
    icon: grammarIcon,
    title: "Grammar Fix",
    description: "Instant corrections with context-aware suggestions",
    highlight: "Professional quality",
  },
  {
    icon: humanizeIcon,
    title: "Humanize GPT",
    description: "Bypass AI detection with advanced humanization",
    highlight: "Passes all detectors",
  },
  {
    icon: aiDetectorIcon,
    title: "AI Detector",
    description: "Verify if content is AI-generated or human-written",
    highlight: "99% accuracy",
  },
  {
    icon: summarizeIcon,
    title: "Summarize",
    description: "Condense long documents into key insights instantly",
    highlight: "Up to 156 pages",
  },
  {
    icon: translatorIcon,
    title: "Translator",
    description: "100+ languages with context preservation",
    highlight: "Multi-language support",
  },
];

const aiAgents = [
  {
    id: "slides-agent",
    icon: agentIcon,
    title: "Slides Agent",
    description: "Creates complete presentations with research and design",
    examples: ["Pitch decks", "Educational slides", "Business reports"],
    examplePrompts: [
      {
        prompt: "Create a presentation about AI in healthcare",
        description: "AI in healthcare",
      },
      {
        prompt: "Generate slides for quarterly business review",
        description: "Business review",
      },
      {
        prompt: "Make a pitch deck for a SaaS startup",
        description: "Startup pitch",
      },
    ],
    color: "hsl(var(--primary))",
  },
  {
    id: "sheet-agent",
    icon: agentIcon,
    title: "Sheet Agent",
    description: "Performs research and structures data in smart sheets",
    examples: ["Market analysis", "Competitor research", "Data comparison"],
    examplePrompts: [
      {
        prompt: "Analyze sales trends from Q1 to Q4",
        description: "Sales trends",
      },
      {
        prompt: "Compare pricing of top 10 gyms in NYC",
        description: "Compare pricing",
      },
      {
        prompt: "Find patterns in customer feedback data",
        description: "Customer insights",
      },
    ],
    color: "hsl(var(--secondary))",
  },
  {
    id: "deep-research",
    icon: agentIcon,
    title: "Deep Research",
    description: "Comprehensive research with structured insights",
    examples: ["Industry reports", "Academic research", "Trend analysis"],
    examplePrompts: [
      {
        prompt: "Research the impact of AI on education",
        description: "AI in education",
      },
      {
        prompt: "Analyze market trends for electric vehicles",
        description: "Market trends",
      },
      {
        prompt: "Compile research on sustainable energy solutions",
        description: "Sustainable energy",
      },
    ],
    color: "hsl(var(--info))",
  },
  {
    id: "writing-agent",
    icon: agentIcon,
    title: "Writing Agent",
    description:
      "Paraphrases, fixes grammar, humanizes AI text, and enhances your writing",
    examples: ["Paraphrase", "Grammar Fix", "Humanize AI"],
    examplePrompts: [
      {
        prompt:
          "Paraphrase this text to make it more professional and engaging",
        description: "Paraphrase text",
      },
      {
        prompt: "Fix grammar and improve clarity in my business proposal",
        description: "Grammar check",
      },
      {
        prompt: "Humanize this AI-generated content to sound more natural",
        description: "Humanize AI text",
      },
    ],
    color: "hsl(var(--success))",
  },
  {
    id: "meta-ads-agent",
    icon: agentIcon,
    title: "Meta Ads Agent",
    description:
      "Creates complete ad campaigns with targeting, copy, and creative strategy",
    examples: ["URL to Ads", "Campaign Strategy", "Ad Optimization"],
    examplePrompts: [
      {
        prompt: "https://example.com/fitness-app",
        description: "Fitness app URL",
      },
      {
        prompt: "https://mystore.com/products/eco-friendly-water-bottle",
        description: "Product URL",
      },
      {
        prompt: "https://saas-product.io/pricing",
        description: "SaaS product URL",
      },
    ],
    color: "hsl(var(--warning))",
  },
];

const metaFeatures = [
  {
    icon: Sparkles,
    title: "URL to Ads in 3 Minutes",
    description:
      "Paste website or Facebook link → Get 8-15 ad variants automatically",
  },
  {
    icon: TrendingUp,
    title: "3X Better ROAS",
    description: "AI-powered optimization for maximum return on ad spend",
  },
  {
    icon: Star,
    title: "Creative Diversity Engine",
    description: "Video, Reels, Images, Carousels - all formats covered",
  },
];

interface AgentDemoModalProps {
  open: boolean;
  agent: any;
  onClose: () => void;
}

function AgentDemoModal({ open, agent, onClose }: AgentDemoModalProps) {
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    if (!open) {
      setInput("");
      setResult("");
      setIsProcessing(false);
    }
  }, [open]);

  const handleExampleClick = (prompt: string) => {
    setInput(prompt);
    setResult("");
  };

  const handleTryIt = () => {
    if (!input.trim()) return;

    setIsProcessing(true);
    setResult("");

    setTimeout(() => {
      setIsProcessing(false);

      if (agent?.id === "slides-agent") {
        setResult(
          "✓ Created 8 slides\n✓ Added visuals and charts\n✓ Professional theme applied\n✓ Ready to present",
        );
      } else if (agent?.id === "sheet-agent") {
        setResult(
          "📊 Key Insights:\n• Average sales: $45,230\n• Top performing region: North\n• Growth trend: +23% YoY\n• Recommendation: Expand to Western markets",
        );
      } else if (agent?.id === "deep-research") {
        setResult(
          "📚 Research Summary:\n• Found 47 relevant sources\n• Key trends identified\n• Comprehensive analysis complete\n• Citations formatted",
        );
      } else if (agent?.id === "writing-agent") {
        setResult(
          "✓ Blog post created (1,200 words)\n✓ SEO optimized with keywords\n✓ Engaging headlines included\n✓ Ready to publish",
        );
      } else if (agent?.id === "meta-ads-agent") {
        setResult(
          "✓ Campaign created\n✓ 5 ad variations generated\n✓ Target audience: 25-45, Tech professionals\n✓ Estimated reach: 50K-100K",
        );
      }
    }, 1500);
  };

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="bg-background max-w-2xl"
        data-testid="agent-demo-modal"
      >
        <DialogHeader className="border-border border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-lg"
                style={{ backgroundColor: agent.color }}
              >
                <Image
                  src={agent.icon}
                  alt={agent.title}
                  width={28}
                  height={28}
                  className="brightness-0 invert"
                />
              </div>
              <div>
                <DialogTitle className="text-h5 text-foreground font-bold">
                  {agent.title}
                </DialogTitle>
                <p className="text-body2 text-muted-foreground">
                  {agent.description}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="button-close-modal"
            >
              <X size={20} />
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-subtitle2 text-foreground mb-3 font-bold">
              Try These Examples
            </h3>
            <div className="flex flex-wrap gap-2">
              {agent.examplePrompts?.map(
                (
                  example: { prompt: string; description: string },
                  idx: number,
                ) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    onClick={() => handleExampleClick(example.prompt)}
                    data-testid={`example-${idx}`}
                    className="hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors"
                    style={
                      {
                        "--hover-bg": agent.color,
                      } as React.CSSProperties
                    }
                  >
                    {example.description}
                  </Badge>
                ),
              )}
            </div>
          </div>

          <div>
            <h3 className="text-subtitle2 text-foreground mb-3 font-bold">
              What would you like {agent.title} to do?
            </h3>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Enter your ${agent.title.toLowerCase()} request...`}
              data-testid="input-demo"
              className="mb-4"
              rows={3}
            />
            <Button
              onClick={handleTryIt}
              disabled={!input.trim() || isProcessing}
              data-testid="button-try-now"
              className="mb-4"
              style={{ backgroundColor: agent.color }}
            >
              {isProcessing ? (
                <>
                  <Bot size={18} className="mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Play size={18} className="mr-2" />
                  Try Now
                </>
              )}
            </Button>
          </div>

          {(result || isProcessing) && (
            <div className="border-border bg-muted mb-4 min-h-[100px] rounded border p-5">
              <h3 className="text-subtitle2 text-foreground mb-2 font-bold">
                Result
              </h3>
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Bot size={18} />
                  <p className="text-body2 text-muted-foreground">
                    Processing your request...
                  </p>
                </div>
              ) : (
                <p className="text-body2 text-muted-foreground whitespace-pre-line">
                  {result}
                </p>
              )}
            </div>
          )}

          <div className="border-border flex justify-end border-t pt-4">
            <Button
              style={{ backgroundColor: agent.color }}
              data-testid="button-try-full-feature"
            >
              Try Full Feature
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function FeaturesSection() {
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenDemo = (agent: any) => {
    setSelectedAgent(agent);
    setModalOpen(true);
  };

  const handleCloseDemo = () => {
    setModalOpen(false);
    setTimeout(() => setSelectedAgent(null), 300);
  };

  return (
    <section id="features" className="bg-background py-16 md:py-24">
      <AgentDemoModal
        open={modalOpen}
        agent={selectedAgent}
        onClose={handleCloseDemo}
      />
    </section>
  );
}
