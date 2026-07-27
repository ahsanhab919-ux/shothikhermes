export type PaymentProvider = "stripe" | "bkash" | "razorpay";

export type PackId = "starter" | "popular" | "value" | "mega";

export interface CreditPack {
  credits: number;
  name: string;
  bonus: string | null;
  usd: { amount: number; display: string; cents: number };
  bdt: { amount: number; display: string };
  inr: { amount: number; display: string };
}

export const CREDIT_PACKS: Record<PackId, CreditPack> = {
  starter: {
    credits: 100,
    name: "Starter",
    bonus: null,
    usd: { amount: 0.99, display: "$0.99", cents: 99 },
    bdt: { amount: 119, display: "৳119" },
    inr: { amount: 89, display: "₹89" },
  },
  popular: {
    credits: 600,
    name: "Popular",
    bonus: "20% bonus",
    usd: { amount: 4.99, display: "$4.99", cents: 499 },
    bdt: { amount: 599, display: "৳599" },
    inr: { amount: 449, display: "₹449" },
  },
  value: {
    credits: 2500,
    name: "Value",
    bonus: "25% bonus",
    usd: { amount: 19.99, display: "$19.99", cents: 1999 },
    bdt: { amount: 2399, display: "৳2,399" },
    inr: { amount: 1799, display: "₹1,799" },
  },
  mega: {
    credits: 6500,
    name: "Mega",
    bonus: "30% bonus",
    usd: { amount: 49.99, display: "$49.99", cents: 4999 },
    bdt: { amount: 5999, display: "৳5,999" },
    inr: { amount: 4499, display: "₹4,499" },
  },
} as const;

export const VALID_PACK_IDS = Object.keys(CREDIT_PACKS) as PackId[];

export const VALID_CREDIT_AMOUNTS = Object.values(CREDIT_PACKS).map((p) => p.credits);

export type Currency = "usd" | "bdt" | "inr";

export const PROVIDER_CURRENCY: Record<PaymentProvider, Currency> = {
  stripe: "usd",
  bkash: "bdt",
  razorpay: "inr",
};

export const COUNTRY_PROVIDER: Record<string, PaymentProvider> = {
  bangladesh: "bkash",
  india: "razorpay",
};

export function getProviderForCountry(country: string | null): PaymentProvider {
  if (!country) return "stripe";
  const normalized = country.toLowerCase().trim();
  return COUNTRY_PROVIDER[normalized] ?? "stripe";
}

export function getCurrencyForProvider(provider: PaymentProvider): Currency {
  return PROVIDER_CURRENCY[provider];
}

export function getPackPrice(packId: PackId, provider: PaymentProvider): string {
  const pack = CREDIT_PACKS[packId];
  const currency = PROVIDER_CURRENCY[provider];
  return pack[currency].display;
}

export function getPackAmount(packId: PackId, provider: PaymentProvider): number {
  const pack = CREDIT_PACKS[packId];
  const currency = PROVIDER_CURRENCY[provider];
  return pack[currency].amount;
}
