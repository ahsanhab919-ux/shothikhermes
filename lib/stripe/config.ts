const sandboxMode =
  process.env.NEXT_PUBLIC_STRIPE_MODE !== "live" &&
  process.env.NODE_ENV !== "production";

if (process.env.NODE_ENV === "production") {
  if (sandboxMode) {
    throw new Error(
      "Stripe sandbox mode must not be enabled in production. " +
      "Set NEXT_PUBLIC_STRIPE_MODE=live in your production environment."
    );
  }
  const secretKey = process.env.STRIPE_SECRET_KEY || "";
  if (secretKey && !secretKey.startsWith("sk_live_")) {
    throw new Error(
      "Production environment requires a live Stripe secret key (sk_live_...). " +
      "Test keys (sk_test_...) are not permitted in production."
    );
  }
}

export const stripeConfig = {
  mode: process.env.NEXT_PUBLIC_STRIPE_MODE || (process.env.NODE_ENV === "production" ? "live" : "sandbox"),

  apiVersion: "2024-12-18.acacia" as const,

  sandbox: {
    enabled: sandboxMode,
    testCards: sandboxMode
      ? [
          { number: "4242424242424242", brand: "Visa", description: "Success" },
          { number: "4000000000000002", brand: "Visa", description: "Declined" },
          { number: "4000002500003155", brand: "Visa", description: "3D Secure" },
          { number: "4000003560000008", brand: "Visa", description: "India" },
          { number: "4000000000003220", brand: "Visa", description: "Subscription" },
        ]
      : [],
  },

  connect: {
    autoApprove: sandboxMode,
    skipOnboarding: false,
  },

  webhooks: {
    localTesting: process.env.NODE_ENV === "development",
  },
};

export const isSandbox = () => stripeConfig.sandbox.enabled;

export const getStripe = () => {
  const Stripe = require("stripe");
  return Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: stripeConfig.apiVersion,
  });
};
