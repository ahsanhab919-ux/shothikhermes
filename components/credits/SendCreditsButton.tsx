"use client";

import { useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSelector } from "react-redux";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import CreditGiftAnimation from "./CreditGiftAnimation";

const QUICK_AMOUNTS = [10, 50, 100];

interface SendCreditsButtonProps {
  targetType: "forum" | "agent";
  targetId: string;
  size?: "sm" | "md";
  className?: string;
}

export default function SendCreditsButton({
  targetType,
  targetId,
  size = "md",
  className,
}: SendCreditsButtonProps) {
  const { accessToken } = useSelector((state: any) => state.auth);
  const isAuthenticated = !!accessToken;

  const balanceData = useQuery(api.credits.getBalance);
  const giftsData = useQuery(api.credits.getGiftsForTarget, { targetType, targetId });
  const sendCredits = useMutation(api.credits.sendCredits);

  const [open, setOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalCredits = giftsData?.totalCredits ?? 0;
  const balance = balanceData?.balance ?? 0;

  const handleSend = useCallback(
    async (amount: number) => {
      if (!isAuthenticated || sending) return;
      setError(null);
      setSending(true);
      try {
        await sendCredits({ targetType, targetId, amount });
        setShowAnimation(true);
        setOpen(false);
        setCustomAmount("");
      } catch (err: any) {
        setError(err.message || "Failed to send Credits");
      } finally {
        setSending(false);
      }
    },
    [isAuthenticated, sending, sendCredits, targetType, targetId]
  );

  const handleCustomSend = () => {
    const amount = parseInt(customAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      setError("Enter a valid amount");
      return;
    }
    handleSend(amount);
  };

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  const padding = size === "sm" ? "gap-1 px-2 py-1" : "gap-1.5 px-3 py-1.5";

  return (
    <div className={cn("relative inline-flex", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "inline-flex items-center rounded-full font-medium transition-colors",
              "text-amber-400 hover:bg-amber-950/30",
              padding,
              textSize,
              !isAuthenticated && "cursor-default opacity-50"
            )}
            onClick={() => {
              if (!isAuthenticated) {
                window.location.href = "/account";
                return;
              }
            }}
            aria-label={`Send Credits. Total received: ${totalCredits}`}
          >
            <Coins className={cn(iconSize, "fill-amber-400")} />
            <span className="tabular-nums">{totalCredits > 0 ? totalCredits.toLocaleString() : "Gift"}</span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="w-64 border-border bg-card p-4"
          align="center"
          sideOffset={8}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Send Credits</span>
            <span className="inline-flex items-center gap-1 text-xs text-amber-400">
              <Coins className="h-3 w-3 fill-amber-400" />
              {balance.toLocaleString()} available
            </span>
          </div>

          <div className="mb-3 grid grid-cols-3 gap-2">
            {QUICK_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => handleSend(amount)}
                disabled={sending || balance < amount}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg bg-muted/50 px-3 py-2.5 text-sm font-medium transition-colors",
                  "hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40",
                  "min-h-[44px]"
                )}
                aria-label={`Send ${amount} credits`}
              >
                <span className="text-amber-400">{amount}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setError(null);
              }}
              placeholder="Custom"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Custom credit amount"
            />
            <button
              onClick={handleCustomSend}
              disabled={sending || !customAmount}
              className="flex-shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]"
              aria-label="Send custom amount of credits"
            >
              {sending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent inline-block" />
              ) : (
                "Send"
              )}
            </button>
          </div>

          {error && (
            <p role="alert" className="mt-2 text-xs text-destructive">
              {error}
            </p>
          )}
        </PopoverContent>
      </Popover>

      <CreditGiftAnimation
        active={showAnimation}
        onComplete={() => setShowAnimation(false)}
      />
    </div>
  );
}
