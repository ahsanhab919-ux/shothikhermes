/**
 * Utility functions for price formatting and display
 */

export const formatPrice = (amount: number, currency: string): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export type PriceDisplayMode = "BDT" | "USD" | "BOTH";

/**
 * Get price display based on location
 */
export const getPriceDisplay = (
  price: { USD: number; BDT: number },
  isBangladesh: boolean | null,
): { primary: string; secondary?: string; mode: PriceDisplayMode } => {
  if (isBangladesh === true) {
    return {
      primary: formatPrice(price.BDT, "BDT"),
      mode: "BDT",
    };
  } else if (isBangladesh === false) {
    return {
      primary: formatPrice(price.USD, "USD"),
      mode: "USD",
    };
  } else {
    // null - show both
    return {
      primary: formatPrice(price.USD, "USD"),
      secondary: formatPrice(price.BDT, "BDT"),
      mode: "BOTH",
    };
  }
};

