// Tool Navigation Configuration
// Add to main navigation and Writing Studio

export const writingTools = [
  {
    id: "grammar-checker",
    name: "Grammar Checker",
    description: "Check and fix grammar errors",
    icon: "CheckCircle",
    href: "/grammar-checker",
    color: "blue",
    inStudio: true,
  },
  {
    id: "paraphrase",
    name: "Paraphrase",
    description: "Rewrite text in different styles",
    icon: "RefreshCw",
    href: "/paraphrase",
    color: "green",
    inStudio: true,
  },
  {
    id: "ai-detector",
    name: "AI Detector",
    description: "Detect AI-generated content",
    icon: "Scan",
    href: "/ai-detector",
    color: "purple",
    inStudio: true,
  },
  {
    id: "translator",
    name: "Translator",
    description: "Translate to multiple languages",
    icon: "Languages",
    href: "/translator",
    color: "orange",
    inStudio: false,
  },
  {
    id: "humanize",
    name: "Humanize GPT",
    description: "Make AI text more human",
    icon: "User",
    href: "/humanize-gpt",
    color: "pink",
    inStudio: false,
  },
];

// Tools that appear in Writing Studio bubble menu
export const studioTools = writingTools.filter((t) => t.inStudio);

// Tool categories
export const toolCategories = {
  writing: ["grammar-checker", "paraphrase", "humanize"],
  analysis: ["ai-detector", "plagiarism-checker"],
  language: ["translator"],
};
