import { PATH_PAGE, PATH_TOOLS } from "@/config/route";

export const LINKS = [
  {
    headline: "AI Writing Tools",
    children: [
      { name: "Paraphrasing", href: PATH_TOOLS.paraphrase },
      { name: "AI Detector", href: PATH_TOOLS.ai_detector },
      { name: "Humanize GPT", href: PATH_TOOLS.humanize },
      { name: "Plagiarism Checker", href: PATH_TOOLS.plagiarism_checker },
      { name: "Summarizer", href: PATH_TOOLS.summarize },
      { name: "Grammar Fix", href: PATH_TOOLS.grammar_checker },
      { name: "Translator", href: PATH_TOOLS.translator },
    ],
  },
  {
    headline: "AI Agents",
    children: [
      { name: "Slide Generation", href: PATH_TOOLS.slide_generator },
      { name: "Sheet Generation", href: PATH_TOOLS.data_analysis },
      { name: "Deep Research", href: PATH_TOOLS.deep_research },
    ],
  },
  {
    headline: "Legal",
    children: [
      { name: "Terms of service ", href: PATH_PAGE.terms },
      { name: "Privacy policy", href: PATH_PAGE.privacy },
      { name: "Deletion policy", href: PATH_PAGE.deletion },
      { name: "Refund policy", href: PATH_PAGE.refundPolicy },
      { name: "Payment policy", href: PATH_PAGE.paymentPolicy },
    ],
  },
  {
    headline: "For Business",
    children: [
      { name: "Reseller Program", href: PATH_PAGE.resellerPanel },
      { name: "B2B Portfolios", href: "/b2b" },
    ],
  },
  {
    headline: "Company",
    children: [
      { name: "About us", href: PATH_PAGE.about },
      { name: "Our Team", href: PATH_PAGE.team },
      { name: "Career", href: PATH_PAGE.career },
      { name: "Our Features", href: PATH_PAGE.features },
      { name: "Blogs", href: PATH_PAGE.community },
      { name: "Contact us", href: PATH_PAGE.contact },
    ],
  },
  // {
  //   headline: "Content Analysis",
  //   children: [{ name: "AI Detector", href: PATH_TOOLS.ai_detector }],
  // },

  {
    headline: "Support",
    children: [
      { name: "Help center", href: "mailto:support@shothik.ai" },
      { name: "Tutorials", href: PATH_PAGE.tutorials },
      { name: "FAQs", href: PATH_PAGE.faqs },
      { name: "Join us on Discord", href: PATH_PAGE.discord },
    ],
  },
];
