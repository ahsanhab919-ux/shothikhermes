"use client";

import { useEffect, useRef } from "react";
import { useAnalytics } from "./useAnalytics";

export const useSession = () => {
  const { trackEvent } = useAnalytics();
  const sessionStart = useRef(Date.now());
  const heartbeatInterval = useRef(null);

  useEffect(() => {
    // Track session start
    trackEvent("session_start", {
      referrer: document.referrer,
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
    });

    // Send heartbeat every 30 seconds
    heartbeatInterval.current = setInterval(() => {
      trackEvent("session_heartbeat", {
        session_duration: Date.now() - sessionStart.current,
        page_url: window.location.href,
      });
    }, 30000);

    // Track session end on beforeunload
    const handleBeforeUnload = () => {
      trackEvent("session_end", {
        session_duration: Date.now() - sessionStart.current,
        final_page: window.location.href,
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [trackEvent]);
};
