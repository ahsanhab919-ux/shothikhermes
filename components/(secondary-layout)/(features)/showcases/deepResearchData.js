import {
  BarChart3,
  Brain,
  FileText,
  Globe,
  Image as ImageIcon,
  Search,
} from "lucide-react";

export const researchPhases = [
  {
    id: "query",
    name: "Generate Query",
    duration: "0.5s",
    description: "Parse input, create 3 search queries",
    color: "blue",
    icon: Search,
  },
  {
    id: "web",
    name: "Web Research",
    duration: "10s",
    description: "Search all sources, extract citations",
    color: "green",
    icon: Globe,
  },
  {
    id: "image",
    name: "Image Search",
    duration: "5s",
    description: "Find CC images, score relevance",
    color: "purple",
    icon: ImageIcon,
  },
  {
    id: "reflect",
    name: "Reflection",
    duration: "2s",
    description: "Analyze sufficiency, find gaps",
    color: "orange",
    icon: Brain,
  },
  {
    id: "decision",
    name: "Decision",
    duration: "0.5s",
    description: "Continue or finalize? Loop check",
    color: "pink",
    icon: BarChart3,
  },
  {
    id: "finalize",
    name: "Finalize",
    duration: "2s",
    description: "Compose answer with citations",
    color: "indigo",
    icon: FileText,
  },
];

export const sampleQueries = [
  "Research renewable energy adoption in 2025",
  "Find latest AI safety concerns",
  "Competitive landscape of fintech startups",
  "Recent court cases on data privacy",
  "Top emerging technologies 2025",
  "History of machine learning",
];

export const sampleSources = [
  {
    title: "Renewable Energy Market Report 2025",
    url: "https://example.com/renewable-energy-2025",
    type: "PDF Report",
    credibility: 95,
    excerpt:
      "Global renewable energy capacity increased by 45% in 2024, with solar and wind leading the transition...",
  },
  {
    title: "AI Safety Frameworks and Guidelines",
    url: "https://example.com/ai-safety",
    type: "Academic Paper",
    credibility: 92,
    excerpt:
      "Recent developments in AI safety frameworks emphasize the importance of human oversight and explainable AI systems...",
  },
  {
    title: "Fintech Startup Ecosystem Analysis",
    url: "https://example.com/fintech-analysis",
    type: "Market Research",
    credibility: 88,
    excerpt:
      "The fintech sector saw unprecedented growth in 2024, with over 2,000 new startups raising funding...",
  },
  {
    title: "Data Privacy Court Rulings 2024-2025",
    url: "https://example.com/privacy-court",
    type: "Legal Database",
    credibility: 96,
    excerpt:
      "Recent court decisions have significantly impacted how companies handle consumer data privacy...",
  },
];

export const sampleImages = [
  {
    url: "https://picsum.photos/seed/research1/200/150.jpg",
    title: "Renewable Energy Infrastructure",
    relevance: 92,
    license: "CC BY-SA 4.0",
  },
  {
    url: "https://picsum.photos/seed/research2/200/150.jpg",
    title: "AI Safety Research Lab",
    relevance: 88,
    license: "CC BY 3.0",
  },
  {
    url: "https://picsum.photos/seed/research3/200/150.jpg",
    title: "Fintech Innovation Hub",
    relevance: 85,
    license: "CC BY 2.0",
  },
  {
    url: "https://picsum.photos/seed/research4/200/150.jpg",
    title: "Data Privacy Protection",
    relevance: 90,
    license: "CC BY-SA 4.0",
  },
];
