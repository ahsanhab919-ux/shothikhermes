/**
 * Utility functions for payment method filtering
 */

import type { TPaymentMethod } from "@/types/payment-method.type";

/**
 * Filter payment methods based on user location
 */
export const filterPaymentMethodsByLocation = (
  allMethods: TPaymentMethod[],
  isBangladesh: boolean | null,
  locationLoading: boolean,
): TPaymentMethod[] => {
  if (locationLoading || isBangladesh === null) {
    // Location not determined yet, show all methods
    return allMethods;
  }

  if (isBangladesh) {
    // Bangladesh: Show only SSL Commerz (BDT currency)
    return allMethods.filter(
      (method: TPaymentMethod) =>
        method.currency === "BDT" &&
        (method.value?.toLowerCase() === "sslcommerz" ||
          method.name.toLowerCase().includes("ssl") || method.name.toLowerCase() === "bkash"),
    );
  } else {
    // Other countries: Show only Stripe (USD currency)
    return allMethods.filter(
      (method: TPaymentMethod) =>
        method.currency === "USD" &&
        (method.value?.toLowerCase() === "stripe" ||
          method.name.toLowerCase().includes("stripe")),
    );
  }
};
