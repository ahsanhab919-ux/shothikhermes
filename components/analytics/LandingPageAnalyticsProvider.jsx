"use client";

import { useAnalytics } from "@/hooks/useAnalytics";
import { useScrollTracking } from "@/hooks/useScrollTracking";
import { useSession } from "@/hooks/useSession";
import { trackingList } from "@/lib/trackingList";
import { useEffect } from "react";

export default function LandingPageAnalyticsProvider({ children }) {
  const { trackEvent, trackPageView } = useAnalytics();
  // Tracking STARTS
  // Initialize scroll tracking for the entire page
  useSession();
  useScrollTracking();

  useEffect(() => {
    trackPageView(trackingList.LANDING_PAGE); // Page view
  }, [trackPageView]);
  // Tracking ENDS
  return <>{children}</>;
}
