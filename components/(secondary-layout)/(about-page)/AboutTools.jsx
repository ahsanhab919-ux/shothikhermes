"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  PenTool, 
  RefreshCw, 
  Shield, 
  User, 
  CheckCircle, 
  FileText, 
  Languages, 
  Bot, 
  TrendingUp,
  ArrowRight
} from "lucide-react";
import * as motion from "motion/react-client";
import Link from "next/link";

const tools = [
  {
    icon: PenTool,
    title: "AI Writing Tool",
    description: "Advanced AI writing tool that helps you write better content faster with the latest language models.",
    features: [
      "Generate high-quality content across formats",
      "Boost old writing with AI assistance",
      "Maintain consistent tone and style",
      "Overcome writer's block instantly",
      "Create SEO-optimized content"
    ],
    category: "Writing Tools",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    link: "/tools/writer"
  },
  {
    icon: RefreshCw,
    title: "Paraphrasing Tool",
    description: "Smart paraphrasing tool that recreates your text while maintaining its important meaning.",
    features: [
      "Creating unique content variations",
      "Avoiding repetitive language",
      "Improving readability and flow",
      "Academic writing support",
      "Content repurposing for platforms"
    ],
    category: "Writing Tools",
    color: "text-green-600",
    bgColor: "bg-green-50",
    link: "/tools/paraphrase"
  },
  {
    icon: Shield,
    title: "Plagiarism Checker",
    description: "Perfect plagiarism checker to ensure your content is unique by checking billions of sources.",
    features: [
      "Verify content authenticity",
      "Compare with web sources",
      "Generate detailed similarity reports",
      "Support academic integrity",
      "Protect your reputation"
    ],
    category: "Content Verification",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    link: "/tools/plagiarism-checker"
  },
  {
    icon: User,
    title: "AI Humanizer",
    description: "Make AI-generated text sound more natural and authentic with our advanced humanizer.",
    features: [
      "Make AI content sound natural",
      "Add emotional depth and personality",
      "Pass AI detection tools",
      "Eliminate robotic patterns",
      "Enhance reader engagement"
    ],
    category: "Content Enhancement",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    link: "/tools/humanizer"
  },
  {
    icon: CheckCircle,
    title: "Grammar Checker",
    description: "Advanced grammar checker that's more than just a simple corrector for professional writing.",
    features: [
      "Fix complex grammatical errors",
      "Improve sentence structure",
      "Enhance clarity and readability",
      "Provide real-time suggestions",
      "Adapt to different writing styles"
    ],
    category: "Writing Tools",
    color: "text-red-600",
    bgColor: "bg-red-50",
    link: "/tools/grammar-checker"
  },
  {
    icon: FileText,
    title: "AI Summarizer",
    description: "Get summaries instantly with our AI summarizer designed for articles and documents.",
    features: [
      "Summarize articles and documents",
      "Extract key points efficiently",
      "Save valuable reading time",
      "Adjust summary length",
      "Maintain core message integrity"
    ],
    category: "Content Processing",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    link: "/tools/summarizer"
  },
  {
    icon: Languages,
    title: "Translation Tool",
    description: "Powerful translation tool to overcome language barriers with accurate translations.",
    features: [
      "100+ languages support",
      "Context-aware interpretation",
      "Natural, culturally appropriate phrasing",
      "Technical terminology support",
      "Instant document translation"
    ],
    category: "Content Processing",
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    link: "/tools/translator"
  },
  {
    icon: Bot,
    title: "AI Agents",
    description: "AI trained agents for automating complex processes and intelligent workflows.",
    features: [
      "Conduct in-depth research",
      "Generate comprehensive reports",
      "Monitor trends and competition",
      "Automate workflows",
      "Provide strategic insights"
    ],
    category: "Automation",
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    link: "/agents"
  },
  {
    icon: TrendingUp,
    title: "Meta Marketing Automation",
    description: "Transform your social media with robust Facebook ads automation and marketing tools.",
    features: [
      "Schedule and publish posts automatically",
      "Optimize Facebook ads campaigns",
      "Analyze engagement metrics",
      "Manage multiple accounts",
      "Automate marketing workflows"
    ],
    category: "Marketing Automation",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    link: "/marketing-automation"
  }
];

const categories = ["Writing Tools", "Content Verification", "Content Enhancement", "Content Processing", "Automation", "Marketing Automation"];

export default function AboutTools() {
  return (
    <div id="tools" className="py-20 px-4 sm:px-6 md:px-10 bg-gradient-to-b from-muted/20 to-background">
      <div className="container mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 px-4 py-2 text-sm font-medium">
            Comprehensive AI Tool Suite
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            All-in-One AI Writing Platform
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Unlike bits-and-pieces solutions, Shothik AI has every needed functionality, 
            all in one place: from paraphrasing tools to Meta marketing automation.
          </p>
        </motion.div>

        {/* Category Pills */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {categories.map((category, index) => (
            <Badge key={index} variant="secondary" className="px-3 py-1">
              {category}
            </Badge>
          ))}
        </motion.div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool, index) => (
            <motion.div
              key={index}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 * (index + 1) }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${tool.bgColor}`}>
                      <tool.icon className={`h-6 w-6 ${tool.color}`} />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {tool.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-semibold mt-4 group-hover:text-primary transition-colors">
                    {tool.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                    {tool.description}
                  </p>
                  
                  {/* Features List */}
                  <div className="space-y-2 mb-6">
                    {tool.features.slice(0, 3).map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                        <span className="text-xs text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                    {tool.features.length > 3 && (
                      <span className="text-xs text-primary font-medium">
                        +{tool.features.length - 3} more features
                      </span>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Link href={tool.link} className="no-underline">
                    <Button variant="ghost" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Try Now
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-8 lg:p-12">
              <h3 className="text-2xl lg:text-3xl font-bold mb-4">
                Ready to Transform Your Content?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Join thousands of users who trust Shothik AI for their writing, 
                content creation, and marketing automation needs.
              </p>
              <Link href="/tools" className="no-underline">
                <Button size="lg" className="px-8">
                  Start Using All Tools
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
