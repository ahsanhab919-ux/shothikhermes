// Tools Navigation Configuration
// Add this to your main navigation component

import { 
  CheckCircle, 
  RefreshCw, 
  Scan, 
  Languages,
  User,
  FileText 
} from "lucide-react";

export const toolsNavItems = [
  {
    title: "Grammar Checker",
    href: "/grammar-checker",
    icon: CheckCircle,
    description: "Fix grammar errors",
    color: "text-blue-500",
  },
  {
    title: "Paraphrase",
    href: "/paraphrase",
    icon: RefreshCw,
    description: "Rewrite text",
    color: "text-green-500",
  },
  {
    title: "AI Detector",
    href: "/ai-detector",
    icon: Scan,
    description: "Detect AI content",
    color: "text-purple-500",
  },
  {
    title: "Translator",
    href: "/translator",
    icon: Languages,
    description: "Translate languages",
    color: "text-orange-500",
  },
  {
    title: "Humanize GPT",
    href: "/humanize-gpt",
    icon: User,
    description: "Humanize AI text",
    color: "text-pink-500",
  },
  {
    title: "Plagiarism",
    href: "/plagiarism-checker",
    icon: FileText,
    description: "Check originality",
    color: "text-red-500",
  },
];

// Group for dropdown menu
export const toolsGroups = {
  writing: ["grammar-checker", "paraphrase", "humanize-gpt"],
  analysis: ["ai-detector", "plagiarism-checker"],
  language: ["translator"],
};
