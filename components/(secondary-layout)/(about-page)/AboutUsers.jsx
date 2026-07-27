"use client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  Briefcase,
  GraduationCap,
  PenTool,
  Share2,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import * as motion from "motion/react-client";

const userTypes = [
  {
    icon: PenTool,
    title: "Content Creators & Bloggers",
    description:
      "Take advantage of our AI writing tool, paraphrasing tool, grammar check, and AI summarizer to produce highly engaging content.",
    primaryTools: [
      "AI Writing Tool",
      "Paraphrasing Tool",
      "Grammar Checker",
      "AI Summarizer",
    ],
    useCases: [
      "Generate blog post ideas and drafts",
      "Improve existing content quality",
      "Create social media content",
      "Optimize for SEO",
    ],
    quote:
      "Shothik AI helps me create 5x more content without sacrificing quality.",
  },
  {
    icon: TrendingUp,
    title: "Digital Marketers",
    description:
      "Utilize Meta marketing automation, Facebook ads automation, AI humanizer and our AI writing tool for campaign success.",
    primaryTools: [
      "Meta Marketing Automation",
      "AI Humanizer",
      "AI Writing Tool",
      "Grammar Checker",
    ],
    useCases: [
      "Automate social media campaigns",
      "Create compelling ad copy",
      "Generate marketing content",
      "Optimize campaign performance",
    ],
    quote:
      "The Meta marketing automation has saved us 20+ hours per week on campaign management.",
  },
  {
    icon: GraduationCap,
    title: "Students & Researchers",
    description:
      "Use our plagiarism checker and other writing tools such as a paraphrase tool in your pursuit of academic excellence.",
    primaryTools: [
      "Plagiarism Checker",
      "Paraphrasing Tool",
      "Grammar Checker",
      "AI Summarizer",
    ],
    useCases: [
      "Check academic papers for plagiarism",
      "Improve essay writing quality",
      "Summarize research papers",
      "Enhance academic writing",
    ],
    quote:
      "The plagiarism checker gives me confidence that my work is original and well-cited.",
  },
  {
    icon: Briefcase,
    title: "Business Professionals",
    description:
      "Write with our AI writing tool, grammar checker, translator, and professional language software.",
    primaryTools: [
      "AI Writing Tool",
      "Grammar Checker",
      "Translation Tool",
      "AI Humanizer",
    ],
    useCases: [
      "Create professional documents",
      "Improve business communication",
      "Translate important materials",
      "Enhance report writing",
    ],
    quote:
      "Professional documents that used to take hours now take minutes with Shothik AI.",
  },
  {
    icon: Share2,
    title: "Social Media Managers",
    description:
      "Automate processes with Meta marketing automation and Facebook ads automation, and efficiently create content.",
    primaryTools: [
      "Meta Marketing Automation",
      "AI Writing Tool",
      "AI Summarizer",
      "Grammar Checker",
    ],
    useCases: [
      "Schedule and automate posts",
      "Create engaging social content",
      "Analyze engagement metrics",
      "Manage multiple accounts",
    ],
    quote:
      "Managing 5 brand accounts is now effortless with the automation tools.",
  },
  {
    icon: BookOpen,
    title: "Publishers & Writers",
    description:
      "Guarantee content to be of high quality with our plagiarism checker, grammar checker, AI humanizer and paraphrasing tool.",
    primaryTools: [
      "Plagiarism Checker",
      "Grammar Checker",
      "AI Humanizer",
      "Paraphrasing Tool",
    ],
    useCases: [
      "Ensure content originality",
      "Improve writing quality",
      "Humanize AI-generated content",
      "Enhance readability",
    ],
    quote:
      "Our publishing standards have improved dramatically since using Shothik AI.",
  },
  {
    icon: Users,
    title: "Educators & Institutions",
    description:
      "Keep your standards high with our stringent plagiarism checker, AI humanizer detection, and grammar checker tools.",
    primaryTools: [
      "Plagiarism Checker",
      "Grammar Checker",
      "AI Humanizer",
      "AI Summarizer",
    ],
    useCases: [
      "Check student submissions",
      "Maintain academic integrity",
      "Improve teaching materials",
      "Create educational content",
    ],
    quote:
      "Shothik AI helps us maintain the highest academic standards effortlessly.",
  },
  {
    icon: Target,
    title: "Marketing Agencies",
    description:
      "Boost operations with Meta marketing automation, AI writing tool, rewriter tool and more!",
    primaryTools: [
      "Meta Marketing Automation",
      "AI Writing Tool",
      "Paraphrasing Tool",
      "AI Humanizer",
    ],
    useCases: [
      "Manage client campaigns",
      "Create diverse content types",
      "Automate repetitive tasks",
      "Scale content production",
    ],
    quote:
      "We've doubled our client capacity while improving quality using Shothik AI.",
  },
];

const stats = [
  { value: "8+", label: "User Types" },
  { value: "150+", label: "Countries" },
  { value: "10K+", label: "Active Users" },
  { value: "95%", label: "Satisfaction Rate" },
];

export default function AboutUsers() {
  return (
    <div className="bg-muted/20 px-4 py-20 sm:px-6 md:px-10">
      <div className="container mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <Badge className="mb-4 px-4 py-2 text-sm font-medium">
            Who Uses Shothik AI
          </Badge>
          <h2 className="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl">
            Built for Every Type of Writer
          </h2>
          <p className="text-muted-foreground mx-auto max-w-3xl text-xl leading-relaxed">
            From students to professionals, marketers to educators - discover
            how different users leverage Shothik AI to transform their writing
            and content creation.
          </p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mb-16 grid grid-cols-2 gap-6 md:grid-cols-4"
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-primary mb-1 text-3xl font-bold">
                {stat.value}
              </div>
              <div className="text-muted-foreground text-sm">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* User Types Grid */}
        <div className="mb-16 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {userTypes.map((userType, index) => (
            <motion.div
              key={index}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 * (index + 1) }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-0 shadow-md transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 flex-shrink-0 rounded-lg p-3">
                      <userType.icon className="text-primary h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="mb-2 text-xl font-semibold">
                        {userType.title}
                      </CardTitle>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {userType.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Primary Tools */}
                  <div className="mb-4">
                    <h4 className="mb-2 text-sm font-semibold">
                      Primary Tools Used:
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {userType.primaryTools.map((tool, toolIndex) => (
                        <Badge
                          key={toolIndex}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Use Cases */}
                  <div className="mb-4">
                    <h4 className="mb-2 text-sm font-semibold">Use Cases:</h4>
                    <div className="space-y-1">
                      {userType.useCases
                        .slice(0, 3)
                        .map((useCase, useCaseIndex) => (
                          <div
                            key={useCaseIndex}
                            className="flex items-center gap-2"
                          >
                            <div className="bg-primary/60 h-1.5 w-1.5 flex-shrink-0 rounded-full" />
                            <span className="text-muted-foreground text-xs">
                              {useCase}
                            </span>
                          </div>
                        ))}
                      {userType.useCases.length > 3 && (
                        <span className="text-primary text-xs font-medium">
                          +{userType.useCases.length - 3} more use cases
                        </span>
                      )}
                    </div>
                  </div>

                  {/* User Quote */}
                  <div className="bg-muted/50 border-primary/40 rounded-lg border-l-4 p-3">
                    <p className="text-muted-foreground text-xs italic">
                      "{userType.quote}"
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        {/* <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-8 lg:p-12 text-center">
              <h3 className="text-2xl lg:text-3xl font-bold mb-4">
                Find Your Perfect Writing Solution
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                No matter your role or industry, Shothik AI has the tools you need 
                to create better content, faster and more efficiently.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="px-8">
                  Get Started Free
                </Button>
                <Button variant="outline" size="lg" className="px-8">
                  View All Tools
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div> */}
      </div>
    </div>
  );
}
