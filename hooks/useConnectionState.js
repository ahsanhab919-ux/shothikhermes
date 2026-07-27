"use client";

import { useState, useEffect, useCallback } from "react";

export const useConnectionState = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isPageVisible, setIsPageVisible] = useState(!document.hidden);
  const [lastDisconnectTime, setLastDisconnectTime] = useState(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setLastDisconnectTime(Date.now());
    };

    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsPageVisible(isVisible);

      if (!isVisible) {
        setLastDisconnectTime(Date.now());
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const storeConnectionMetadata = useCallback((jobId, step = "queued") => {
    const metadata = {
      jobId,
      lastStep: step,
      timestamp: Date.now(),
      chatId: sessionStorage.getItem("activeResearchChatId"),
    };
    sessionStorage.setItem("currentResearchJobId", jobId);
    sessionStorage.setItem(
      "researchConnectionMetadata",
      JSON.stringify(metadata),
    );
  }, []);

  const getStoredMetadata = useCallback(() => {
    const stored = sessionStorage.getItem("researchConnectionMetadata");
    return stored ? JSON.parse(stored) : null;
  }, []);

  const clearConnectionMetadata = useCallback(() => {
    sessionStorage.removeItem("currentResearchJobId");
    sessionStorage.removeItem("researchConnectionMetadata");
  }, []);

  const isConnectionInterrupted = useCallback(() => {
    const metadata = getStoredMetadata();
    if (!metadata) return false;

    const timeSinceLastUpdate = Date.now() - metadata.timestamp;
    const hasStoredJob = !!sessionStorage.getItem("currentResearchJobId");

    return hasStoredJob && timeSinceLastUpdate > 30000; // 30 seconds threshold
  }, [getStoredMetadata]);

  return {
    isOnline,
    isPageVisible,
    lastDisconnectTime,
    storeConnectionMetadata,
    getStoredMetadata,
    clearConnectionMetadata,
    isConnectionInterrupted,
  };
};
