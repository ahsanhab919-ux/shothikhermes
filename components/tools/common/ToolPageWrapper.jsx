"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useGetUsesLimitQuery } from "@/redux/api/tools/toolsApi";
import UsageTracker, { InlineUsageBadge } from "./UsageTracker";
import UpgradePrompt, { UpgradeBanner } from "./UpgradePrompt";

const USE_COUNT_KEY = "shothik_tool_uses";

function getToolUseCount(tool) {
  if (typeof window === "undefined") return 0;
  try {
    const data = JSON.parse(localStorage.getItem(USE_COUNT_KEY) || "{}");
    const today = new Date().toISOString().split("T")[0];
    if (data.date !== today) return 0;
    return data[tool] || 0;
  } catch {
    return 0;
  }
}

function incrementToolUseCount(tool) {
  if (typeof window === "undefined") return;
  try {
    const today = new Date().toISOString().split("T")[0];
    const data = JSON.parse(localStorage.getItem(USE_COUNT_KEY) || "{}");
    if (data.date !== today) {
      localStorage.setItem(USE_COUNT_KEY, JSON.stringify({ date: today, [tool]: 1 }));
      return 1;
    }
    data[tool] = (data[tool] || 0) + 1;
    localStorage.setItem(USE_COUNT_KEY, JSON.stringify(data));
    return data[tool];
  } catch {
    return 0;
  }
}

export default function ToolPageWrapper({ tool, children }) {
  const { user } = useSelector((state) => state.auth);
  const isPro = !!(user?.package && user.package !== "free");
  const isAuthenticated = !!user?.email;

  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("usage_high");
  const [showBanner, setShowBanner] = useState(false);
  const [bannerReason, setBannerReason] = useState("usage_high");

  const serviceMap = {
    paraphrase: "paraphrase",
    grammar: "grammar",
    humanize: "bypass",
    "ai-detector": "ai-detector",
    plagiarism: "plagiarism",
  };

  const { data: limits } = useGetUsesLimitQuery(
    { service: serviceMap[tool] || tool },
    { skip: !isAuthenticated }
  );

  useEffect(() => {
    if (isPro || !isAuthenticated) return;

    const useCount = getToolUseCount(tool);

    if (limits) {
      const remaining = limits.remainingWord;
      const total = limits.totalWordLimit;

      if (total !== 99999) {
        const usedPercentage = ((total - remaining) / total) * 100;

        if (remaining <= 0) {
          setUpgradeReason("word_limit");
          setShowUpgradePrompt(true);
          return;
        }

        if (usedPercentage >= 70) {
          setBannerReason("usage_high");
          setShowBanner(true);
        }
      }
    }

    if (useCount === 3) {
      setBannerReason("third_use");
      setShowBanner(true);
    }
  }, [limits, isPro, isAuthenticated, tool]);

  useEffect(() => {
    const handleToolUse = (e) => {
      if (isPro) return;
      if (e.detail?.tool && e.detail.tool !== tool) return;
      const count = incrementToolUseCount(tool);

      if (count === 3) {
        setTimeout(() => {
          setUpgradeReason("third_use");
          setShowUpgradePrompt(true);
        }, 2000);
      }
    };

    window.addEventListener("shothik_tool_submit", handleToolUse);
    return () => window.removeEventListener("shothik_tool_submit", handleToolUse);
  }, [tool, isPro]);

  return (
    <>
      {showBanner && !isPro && (
        <div className="mb-4">
          <UpgradeBanner trigger={bannerReason} />
        </div>
      )}

      {children}

      <UpgradePrompt
        trigger={upgradeReason}
        open={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
      />
    </>
  );
}

export function useUpgradePrompt() {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [reason, setReason] = useState("pro_feature");

  const triggerUpgrade = useCallback((triggerReason = "pro_feature") => {
    setReason(triggerReason);
    setShowUpgrade(true);
  }, []);

  const dismissUpgrade = useCallback(() => {
    setShowUpgrade(false);
  }, []);

  return {
    showUpgrade,
    upgradeReason: reason,
    triggerUpgrade,
    dismissUpgrade,
  };
}
