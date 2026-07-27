import Stripe from "stripe";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
  typescript: true,
});

export default stripe;

// Legacy subscription tiers configuration (kept for backward compatibility)
// New tier system: see apps/web/lib/subscription-tiers.ts
export const SUBSCRIPTION_TIERS = {
  free: {
    name: "Free",
    priceId: null,
    features: {
      monthlyCredits: 1000,
      tools: ["grammar", "paraphrase-light", "ai-detector"],
      maxProjects: 3,
    },
  },
  student: {
    name: "Student",
    priceId: process.env.STRIPE_PRICE_STUDENT_MONTHLY,
    yearlyPriceId: process.env.STRIPE_PRICE_STUDENT_YEARLY,
    features: {
      monthlyCredits: 3000,
      tools: ["grammar", "paraphrase", "ai-detector", "humanize", "summarize"],
      maxProjects: 10,
    },
  },
  researcher: {
    name: "Researcher",
    priceId: process.env.STRIPE_PRICE_RESEARCHER_MONTHLY,
    yearlyPriceId: process.env.STRIPE_PRICE_RESEARCHER_YEARLY,
    features: {
      monthlyCredits: 10000,
      tools: ["grammar", "paraphrase", "ai-detector", "translator", "humanize", "summarize"],
      maxProjects: 50,
    },
  },
  pro: {
    name: "Pro",
    priceId: process.env.STRIPE_PRICE_PRO_MONTHLY,
    yearlyPriceId: process.env.STRIPE_PRICE_PRO_YEARLY,
    features: {
      monthlyCredits: 100000,
      tools: ["all"],
      maxProjects: -1,
      apiAccess: true,
    },
  },
};

// Credit purchase packages
export const CREDIT_PACKAGES = [
  { id: "credits_100", credits: 100, price: 499, priceId: process.env.STRIPE_PRICE_CREDITS_100 }, // $4.99
  { id: "credits_500", credits: 500, price: 1999, priceId: process.env.STRIPE_PRICE_CREDITS_500 }, // $19.99
  { id: "credits_1000", credits: 1000, price: 3499, priceId: process.env.STRIPE_PRICE_CREDITS_1000 }, // $34.99
  { id: "credits_5000", credits: 5000, price: 14999, priceId: process.env.STRIPE_PRICE_CREDITS_5000 }, // $149.99
];

export { stripe };
