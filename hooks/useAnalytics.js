"use client";

import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  initializeAnalytics,
  setConsent,
  trackEvent as trackEventAction,
} from "@/redux/slices/analyticsSlice";

export const useAnalytics = () => {
  const dispatch = useDispatch();
  const analytics = useSelector((state) => state.analytics);

  const trackEvent = useCallback(
    (eventName, parameters = {}) => {
      dispatch(trackEventAction({ event_name: eventName, parameters }));
    },
    [dispatch],
  );

  const trackPageView = useCallback(
    (page) => {
      trackEvent("page_view", {
        page_title: document.title,
        page_location: window.location.href,
        page: page,
      });
    },
    [trackEvent],
  );

  const initializeWithConsent = useCallback(
    (consentGiven) => {
      dispatch(setConsent(consentGiven));

      if (consentGiven) {
        dispatch(initializeAnalytics({ consent: consentGiven }));
      }
    },
    [dispatch],
  );

  const setABTest = useCallback(
    (testName, variant) => {
      dispatch(setABTestVariant({ testName, variant }));
      trackEvent("ab_test_assignment", { testName, variant });
    },
    [dispatch, trackEvent],
  );

  return {
    ...analytics,
    trackEvent,
    trackPageView,
    initializeWithConsent,
    setABTest,
  };
};
