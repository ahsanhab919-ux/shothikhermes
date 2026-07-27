"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Coins } from "lucide-react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import CreditPurchaseModal from "@/components/credits/CreditPurchaseModal";

const formatCompactNumber = (num) => {
  if (num === 0) return "0";
  if (num < 1000) return num.toString();

  const absNum = Math.abs(num);
  const sign = num < 0 ? "-" : "";

  if (absNum >= 1000000000) {
    const value = absNum / 1000000000;
    return `${sign}${value % 1 === 0 ? value : value.toFixed(1)}b`;
  } else if (absNum >= 1000000) {
    const value = absNum / 1000000;
    return `${sign}${value % 1 === 0 ? value : value.toFixed(1)}m`;
  } else if (absNum >= 1000) {
    const value = absNum / 1000;
    return `${sign}${value % 1 === 0 ? value : value.toFixed(1)}k`;
  }

  return num.toString();
};

export default function WalletCredits({ isCompact }) {
  const { wallet, isLoading } = useSelector(
    (state) => state.user_wallet || { wallet: null, isLoading: false },
  );
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const creditBalance = useQuery(api.credits.getBalance);

  const toolCredits = wallet?.token || 0;
  const giftCredits = creditBalance?.balance ?? 0;

  if (isLoading) {
    return (
      <div className="border-sidebar-border flex w-full items-center justify-center border-b px-2 py-2">
        <Skeleton className={cn("h-8", isCompact ? "w-8" : "w-full")} />
      </div>
    );
  }

  if (isCompact) {
    const formattedToolCredits = formatCompactNumber(toolCredits);
    const formattedGiftCredits = formatCompactNumber(giftCredits);
    return (
      <>
        <div className="border-sidebar-border flex w-full flex-col items-center border-b px-2 py-2 gap-1">
          <Link
            href="/account/settings?section=wallet"
            className="text-primary hover:text-primary/80 flex w-full items-center justify-between transition-colors"
            title={`${toolCredits.toLocaleString()} Tool Credits`}
          >
            <div className="relative flex w-full items-center justify-between">
              <Coins className="h-5 w-5" />
              {toolCredits > 0 && (
                <span className="bg-primary text-primary-foreground flex min-w-4 items-center justify-center rounded px-2 text-sm font-semibold">
                  {formattedToolCredits}
                </span>
              )}
            </div>
          </Link>
          <button
            onClick={() => setCreditModalOpen(true)}
            className="flex w-full items-center justify-between text-amber-400 hover:text-amber-300 transition-colors"
            title={`${giftCredits.toLocaleString()} Gift Credits`}
            aria-label={`Credit balance: ${giftCredits}`}
          >
            <Coins className="h-5 w-5 fill-amber-400" />
            {giftCredits > 0 && (
              <span className="flex min-w-4 items-center justify-center rounded bg-amber-950/50 px-2 text-sm font-semibold text-amber-400">
                {formattedGiftCredits}
              </span>
            )}
          </button>
        </div>
        <CreditPurchaseModal open={creditModalOpen} onOpenChange={setCreditModalOpen} />
      </>
    );
  }

  return (
    <>
      <div className="border-sidebar-border flex w-full flex-col border-b">
        <Link
          href="/account/settings?section=wallet"
          className="hover:bg-sidebar-accent flex w-full items-center justify-between px-3 py-2.5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Coins className="text-primary h-4 w-4" />
            <span className="text-muted-foreground text-sm">Credits</span>
          </div>
          <span className="text-primary font-semibold">
            {toolCredits.toLocaleString()}
          </span>
        </Link>
        <button
          onClick={() => setCreditModalOpen(true)}
          className="hover:bg-sidebar-accent flex w-full items-center justify-between px-3 py-2.5 transition-colors"
          aria-label={`Gift credit balance: ${giftCredits}. Click to purchase credits.`}
        >
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-muted-foreground text-sm">Gift Credits</span>
          </div>
          <span className="font-semibold text-amber-400">
            {giftCredits.toLocaleString()}
          </span>
        </button>
      </div>
      <CreditPurchaseModal open={creditModalOpen} onOpenChange={setCreditModalOpen} />
    </>
  );
}
