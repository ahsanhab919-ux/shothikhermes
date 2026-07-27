"use client";

import { useEffect, useRef } from "react";
import { useAnalytics } from "./useAnalytics";

export const useExitIntent = (onExitIntent) => {
  const { trackEvent } = useAnalytics();
  const hasTriggered = useRef(false);

  const navigationEntry = performance.getEntriesByType("navigation")[0];

  let timeElapsed;
  if (navigationEntry) {
    timeElapsed = performance.now();
  }

  useEffect(() => {
    const handleMouseLeave = (event) => {
      if (
        event.clientY <= 0 &&
        !hasTriggered.current &&
        event.relatedTarget === null
      ) {
        hasTriggered.current = true;

        trackEvent("exit_intent", {
          time_on_page: Date.now() - timeElapsed,
          scroll_position: window.scrollY,
          viewport_height: window.innerHeight,
        });

        onExitIntent?.();
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [trackEvent, onExitIntent, timeElapsed]);
};
