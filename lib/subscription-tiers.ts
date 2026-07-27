export type SubscriptionTier = "free" | "student" | "researcher" | "pro";

export type ToolName =
  | "plagiarism"
  | "ai_detector"
  | "paraphrase"
  | "grammar"
  | "humanize"
  | "summarize"
  | "translator"
  | "writing_studio"
  | "publishing";

export interface TierLimits {
  plagiarismChecks: number;
  aiDetectorScans: number;
  paraphraseUses: number;
  grammarChecks: number;
  humanizeUses: number;
  summarizeUses: number;
  translatorUses: number;
  maxProjects: number;
  writingStudioPro: boolean;
  publishingDistribution: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
}

export interface TierConfig {
  id: SubscriptionTier;
  name: string;
  description: string;
  pricing: {
    usd: { monthly: number; yearly: number };
    bdt: { monthly: number; yearly: number };
    inr: { monthly: number; yearly: number };
  };
  limits: TierLimits;
  features: string[];
  popular?: boolean;
  stripePriceIds?: {
    usd_monthly?: string;
    usd_yearly?: string;
    bdt_monthly?: string;
    bdt_yearly?: string;
    inr_monthly?: string;
    inr_yearly?: string;
  };
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierConfig> = {
  free: {
    id: "free",
    name: "Free",
    description: "Get started with basic tools",
    pricing: {
      usd: { monthly: 0, yearly: 0 },
      bdt: { monthly: 0, yearly: 0 },
      inr: { monthly: 0, yearly: 0 },
    },
    limits: {
      plagiarismChecks: 3,
      aiDetectorScans: 3,
      paraphraseUses: 5,
      grammarChecks: 10,
      humanizeUses: 3,
      summarizeUses: 5,
      translatorUses: 10,
      maxProjects: 2,
      writingStudioPro: false,
      publishingDistribution: false,
      apiAccess: false,
      prioritySupport: false,
    },
    features: [
      "3 plagiarism checks/month",
      "3 AI detector scans/month",
      "5 paraphrase uses/month",
      "Basic grammar checking",
      "2 projects",
    ],
  },
  student: {
    id: "student",
    name: "Student",
    description: "Perfect for university students",
    pricing: {
      usd: { monthly: 499, yearly: 4790 },
      bdt: { monthly: 9900, yearly: 95000 },
      inr: { monthly: 9900, yearly: 95000 },
    },
    limits: {
      plagiarismChecks: 30,
      aiDetectorScans: 30,
      paraphraseUses: 50,
      grammarChecks: 100,
      humanizeUses: 20,
      summarizeUses: 50,
      translatorUses: 100,
      maxProjects: 10,
      writingStudioPro: false,
      publishingDistribution: false,
      apiAccess: false,
      prioritySupport: false,
    },
    features: [
      "30 plagiarism checks/month",
      "30 AI detector scans/month",
      "50 paraphrase uses/month",
      "100 grammar checks/month",
      "10 projects",
      "Humanize GPT (20/month)",
    ],
  },
  researcher: {
    id: "researcher",
    name: "Researcher",
    description: "Built for STEM researchers",
    popular: true,
    pricing: {
      usd: { monthly: 999, yearly: 9590 },
      bdt: { monthly: 19900, yearly: 191000 },
      inr: { monthly: 19900, yearly: 191000 },
    },
    limits: {
      plagiarismChecks: 100,
      aiDetectorScans: 100,
      paraphraseUses: 200,
      grammarChecks: -1,
      humanizeUses: 100,
      summarizeUses: 200,
      translatorUses: -1,
      maxProjects: 50,
      writingStudioPro: true,
      publishingDistribution: false,
      apiAccess: false,
      prioritySupport: true,
    },
    features: [
      "100 plagiarism checks/month",
      "100 AI detector scans/month",
      "200 paraphrase uses/month",
      "Unlimited grammar & translator",
      "Writing Studio Pro features",
      "50 projects",
      "Priority support",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "Full platform access for professionals",
    pricing: {
      usd: { monthly: 1999, yearly: 19190 },
      bdt: { monthly: 39900, yearly: 383000 },
      inr: { monthly: 39900, yearly: 383000 },
    },
    limits: {
      plagiarismChecks: -1,
      aiDetectorScans: -1,
      paraphraseUses: -1,
      grammarChecks: -1,
      humanizeUses: -1,
      summarizeUses: -1,
      translatorUses: -1,
      maxProjects: -1,
      writingStudioPro: true,
      publishingDistribution: true,
      apiAccess: true,
      prioritySupport: true,
    },
    features: [
      "Unlimited all tools",
      "Writing Studio Pro features",
      "Publishing & Distribution",
      "API access",
      "Unlimited projects",
      "Priority support",
    ],
  },
};

export const TIER_ORDER: SubscriptionTier[] = ["free", "student", "researcher", "pro"];

export type CurrencyCode = "usd" | "bdt" | "inr";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  stripeCurrency: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  usd: { code: "usd", symbol: "$", name: "US Dollar", stripeCurrency: "usd" },
  bdt: { code: "bdt", symbol: "৳", name: "Bangladeshi Taka", stripeCurrency: "bdt" },
  inr: { code: "inr", symbol: "₹", name: "Indian Rupee", stripeCurrency: "inr" },
};

export function getCurrencyForCountry(countryCode: string | null): CurrencyCode {
  if (!countryCode) return "usd";
  const code = countryCode.toUpperCase();
  if (code === "BD") return "bdt";
  if (code === "IN") return "inr";
  return "usd";
}

export function formatPrice(
  amountInCents: number,
  currency: CurrencyCode,
): string {
  const config = CURRENCIES[currency];
  const amount = amountInCents / 100;
  if (amount === 0) return "Free";
  return `${config.symbol}${amount.toFixed(currency === "usd" ? 2 : 0)}`;
}

export function getStripePriceId(
  tier: SubscriptionTier,
  currency: CurrencyCode,
  interval: "month" | "year",
): string | undefined {
  const envKey = `STRIPE_PRICE_${tier.toUpperCase()}_${currency.toUpperCase()}_${interval === "year" ? "YEARLY" : "MONTHLY"}`;
  const envValue = typeof process !== "undefined" && process.env ? process.env[envKey] : undefined;
  if (envValue) return envValue;

  const config = SUBSCRIPTION_TIERS[tier];
  const key = `${currency}_${interval === "year" ? "yearly" : "monthly"}` as keyof NonNullable<TierConfig["stripePriceIds"]>;
  return config.stripePriceIds?.[key];
}

export function getTierByStripePriceId(priceId: string): SubscriptionTier | null {
  for (const tier of Object.values(SUBSCRIPTION_TIERS)) {
    const priceIds = tier.stripePriceIds;
    if (priceIds && Object.values(priceIds).includes(priceId)) {
      return tier.id;
    }

    for (const currency of ["usd", "bdt", "inr"] as CurrencyCode[]) {
      for (const interval of ["month", "year"] as const) {
        const envPriceId = getStripePriceId(tier.id, currency, interval);
        if (envPriceId === priceId) {
          return tier.id;
        }
      }
    }
  }
  return null;
}

export function isHigherTier(
  current: SubscriptionTier,
  target: SubscriptionTier,
): boolean {
  return TIER_ORDER.indexOf(target) > TIER_ORDER.indexOf(current);
}

export type UsageLimitKey = keyof Omit<
  TierLimits,
  "maxProjects" | "writingStudioPro" | "publishingDistribution" | "apiAccess" | "prioritySupport"
>;

export const TOOL_TO_LIMIT_KEY: Record<string, UsageLimitKey> = {
  plagiarism: "plagiarismChecks",
  "plagiarism-checker": "plagiarismChecks",
  "ai-detector": "aiDetectorScans",
  ai_detector: "aiDetectorScans",
  paraphrase: "paraphraseUses",
  grammar: "grammarChecks",
  "grammar-checker": "grammarChecks",
  humanize: "humanizeUses",
  "humanize-gpt": "humanizeUses",
  summarize: "summarizeUses",
  translator: "translatorUses",
};
