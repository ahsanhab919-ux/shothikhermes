"use client";

import { useState, useCallback } from "react";
import { useUsageLimits } from "@/hooks/subscription/useUsageLimits";
import { useSubscription } from "@/hooks/subscription/useSubscription";
import UpgradeModal from "@/components/subscription/UpgradeModal";

interface UsageGateProps {
  tool: string;
  toolDisplayName?: string;
  children: (props: {
    canUse: boolean;
    checkAndIncrement: () => Promise<boolean>;
    used: number;
    limit: number;
    isUnlimited: boolean;
    showUpgrade: () => void;
  }) => React.ReactNode;
}

export default function UsageGate({
  tool,
  toolDisplayName,
  children,
}: UsageGateProps) {
  const { checkTool, incrementTool } = useUsageLimits();
  const { tier } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const toolInfo = checkTool(tool);

  const checkAndIncrement = useCallback(async () => {
    if (toolInfo.isUnlimited) return true;
    if (toolInfo.isAtLimit) {
      setShowUpgradeModal(true);
      return false;
    }
    const result = await incrementTool(tool);
    if (!result.success) {
      setShowUpgradeModal(true);
      return false;
    }
    return true;
  }, [tool, toolInfo, incrementTool]);

  return (
    <>
      {children({
        canUse: !toolInfo.isAtLimit || toolInfo.isUnlimited,
        checkAndIncrement,
        used: toolInfo.used,
        limit: toolInfo.limit,
        isUnlimited: toolInfo.isUnlimited,
        showUpgrade: () => setShowUpgradeModal(true),
      })}

      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        currentTier={tier}
        toolName={toolDisplayName || tool}
        usageInfo={{
          used: toolInfo.used,
          limit: toolInfo.limit,
        }}
      />
    </>
  );
}
