"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAnalytics } from "./useAnalytics";

export const useComponentTracking = (componentName, trackingConfig = {}) => {
  const { trackEvent, isLoaded, consent } = useAnalytics();
  const componentRef = useRef(null);
  const viewedRef = useRef(false);

  // Track component view
  useEffect(() => {
    if (!componentRef.current || viewedRef.current || !isLoaded || !consent)
      return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !viewedRef.current) {
          viewedRef.current = true;
          trackEvent("component_viewed", {
            component_name: componentName,
            viewport_position: entry.boundingClientRect.top,
            intersection_ratio: entry.intersectionRatio,
          });
        }
      },
      { threshold: trackingConfig.viewThreshold || 0.5 },
    );

    observer.observe(componentRef.current);
    return () => observer.disconnect();
  }, [
    componentName,
    trackEvent,
    trackingConfig.viewThreshold,
    isLoaded,
    consent,
  ]);

  // Track click events
  const trackClick = useCallback(
    (elementName, additionalData = {}) => {
      if (!isLoaded || !consent) return;

      trackEvent("component_click", {
        component_name: componentName,
        element_name: elementName,
        timestamp: Date.now(),
        ...additionalData,
      });
    },
    [componentName, trackEvent, isLoaded, consent],
  );

  // Track form interactions
  const trackFormInteraction = useCallback(
    (action, fieldName, value = null) => {
      if (!isLoaded || !consent) return;

      trackEvent("form_interaction", {
        component_name: componentName,
        action, // 'focus', 'blur', 'change', 'submit', 'error'
        field_name: fieldName,
        field_value: value ? String(value).length : null, // Don't send actual values for privacy
      });
    },
    [componentName, trackEvent, isLoaded, consent],
  );

  // Track conversion events
  const trackConversion = useCallback(
    (conversionType, value = null) => {
      trackEvent("conversion", {
        component_name: componentName,
        conversion_type: conversionType,
        conversion_value: value,
        timestamp: Date.now(),
      });
    },
    [componentName, trackEvent],
  );

  return {
    componentRef,
    trackClick,
    trackFormInteraction,
    trackConversion,
  };
};
