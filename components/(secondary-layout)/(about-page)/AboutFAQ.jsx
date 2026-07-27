"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  HelpCircle, 
  Mail, 
  MessageCircle, 
  Building, 
  ExternalLink,
  ChevronDown
} from "lucide-react";
import * as motion from "motion/react-client";
import Link from "next/link";

const faqs = [
  {
    question: "What is Shothik AI?",
    answer: "Shothik AI, an all-in-one AI-based tool for creating, verifying and optimizing content. Our software includes an AI-powered content generator, writer tool, article creator and spinner which will develop articles based on the data you input into our suite for up to 100X better human-like writing style."
  },
  {
    question: "Who can use Shothik AI?",
    answer: "Shothik AI is designed for everyone—students, content creators, digital marketers, business professionals, educators, social media managers, publishers, and agencies. Whether you're in Bangladesh or anywhere globally, our tools work for any skill level."
  },
  {
    question: "Can the AI writing tool create content from scratch?",
    answer: "Yes! Our AI writing tool can generate original content based on your prompts, topics, or keywords. It's perfect for blog posts, articles, social media content, emails, and more."
  },
  {
    question: "Can I use the paraphrasing tool for academic writing?",
    answer: "Yes, our paraphrasing tool is valuable for academic writing when used properly. It helps rephrase sources for proper citation and avoids unintentional plagiarism. Always cite original sources appropriately."
  },
  {
    question: "How accurate is the Shothik AI plagiarism checker?",
    answer: "Our plagiarism checker delivers industry-leading accuracy by comparing your content against our extensive database and providing percentage matches with source citations."
  },
  {
    question: "Can the AI humanizer bypass AI detectors?",
    answer: "Our AI humanizer is designed to make content sound genuinely human by improving flow, tone, and authenticity. While it significantly improves natural quality, we cannot guarantee it will pass all detection tools."
  },
  {
    question: "Does the grammar checker work in real-time?",
    answer: "Yes, our grammar checker provides real-time suggestions as you type, helping you catch and fix errors immediately for more efficient writing."
  },
  {
    question: "How long should my document be for summarization?",
    answer: "Our AI summarizer works with documents of any length—from short articles (500 words) to lengthy reports (10,000+ words). Longer documents may take slightly more time to process."
  },
  {
    question: "How accurate is the translation tool?",
    answer: "Our translation tool delivers high accuracy with context-aware translations that consider cultural nuances, idiomatic expressions, and technical terminology."
  },
  {
    question: "What can AI agents do?",
    answer: "Our AI agents can conduct research, generate reports, monitor trends, analyze competitors, automate repetitive tasks, provide insights, and assist with various content-related workflows."
  },
  {
    question: "What can I automate with Meta marketing tools?",
    answer: "You can automate post scheduling, content publishing, engagement tracking, performance analytics, A/B testing, campaign management, and Facebook ads automation workflows."
  },
  {
    question: "Is my data secure with Shothik AI?",
    answer: "Absolutely. We employ enterprise-grade security including data encryption, secure servers, and strict privacy protocols. We never sell or share your data."
  },
  {
    question: "How does Shothik AI compare to Grammarly or QuillBot?",
    answer: "Shothik AI offers broader functionality including Meta marketing automation and AI agents alongside writing tools. We provide competitive pricing and comprehensive features in one platform."
  },
  {
    question: "What are your support hours?",
    answer: "Email support operates 24/7. Live chat for premium users is available during business hours in multiple time zones."
  }
];

const contactInfo = [
  {
    icon: Mail,
    label: "General Inquiries",
    value: "hello@shothik.ai",
    href: "mailto:hello@shothik.ai"
  },
  {
    icon: HelpCircle,
    label: "Support",
    value: "support@shothik.ai",
    href: "mailto:support@shothik.ai"
  },
  {
    icon: Building,
    label: "Business",
    value: "business@shothik.ai",
    href: "mailto:business@shothik.ai"
  },
  {
    icon: ExternalLink,
    label: "Website",
    value: "shothik.ai",
    href: "https://shothik.ai"
  }
];

export default function AboutFAQ() {
  return (
    <div className="py-10 px-4 sm:px-6 md:px-10 bg-gradient-to-b from-muted/20 to-background">
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
            Frequently Asked Questions
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Got Questions? We Have Answers
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Find answers to common questions about Shothik AI's features, pricing, 
            and how our tools can help you create better content.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mb-16"
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 lg:p-8">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border-b last:border-b-0">
                    <AccordionTrigger className="text-left hover:no-underline py-4">
                      <div className="flex items-start gap-3 text-left">
                        <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="font-semibold">{faq.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="pl-8 pr-2">
                        <p className="text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Information */}
        {/* <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold mb-2">
                Still Have Questions?
              </CardTitle>
              <p className="text-muted-foreground">
                We're here to help! Contact us through any of these channels:
              </p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {contactInfo.map((contact, index) => (
                  <div key={index} className="text-center">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <contact.icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{contact.label}</h4>
                    <Link 
                      href={contact.href} 
                      className="text-primary hover:underline text-sm"
                    >
                      {contact.value}
                    </Link>
                  </div>
                ))}
              </div>

              <div className="text-center mt-8">
                <Link href="/help" className="no-underline">
                  <Button variant="outline" size="lg" className="px-8">
                    Visit Help Center
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div> */}
      </div>
    </div>
  );
}
