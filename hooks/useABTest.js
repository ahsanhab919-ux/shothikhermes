"use client";

import { useEffect, useState } from "react";
import { useAnalytics } from "./useAnalytics";

export const useABTest = (testName, variants = ["A", "B"]) => {
  const { trackEvent } = useAnalytics();
  const [variant, setVariant] = useState(null);

  useEffect(() => {
    // Get or assign variant
    const storageKey = `ab_test_${testName}`;
    let userVariant = localStorage.getItem(storageKey);

    if (!userVariant) {
      // Assign random variant
      userVariant = variants[Math.floor(Math.random() * variants.length)];
      localStorage.setItem(storageKey, userVariant);
    }

    setVariant(userVariant);

    // Track variant assignment
    trackEvent("ab_test_assignment", {
      test_name: testName,
      variant: userVariant,
      timestamp: Date.now(),
    });
  }, [testName, variants, trackEvent]);

  const trackTestConversion = (conversionType) => {
    trackEvent("ab_test_conversion", {
      test_name: testName,
      variant: variant,
      conversion_type: conversionType,
      timestamp: Date.now(),
    });
  };

  return { variant, trackTestConversion };
};
