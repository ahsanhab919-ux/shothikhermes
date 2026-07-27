"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSelector } from "react-redux";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Coins, Sparkles, Zap, Crown, CreditCard, Smartphone, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CREDIT_PACKS,
  type PackId,
  type PaymentProvider,
  getProviderForCountry,
  getPackPrice,
} from "@/lib/payment-config";
import { trackCreditPurchaseStarted } from "@/lib/posthog";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PACK_LIST: { id: PackId; icon: typeof Coins; popular?: boolean }[] = [
  { id: "starter", icon: Coins },
  { id: "popular", icon: Sparkles, popular: true },
  { id: "value", icon: Zap },
  { id: "mega", icon: Crown },
];

const PROVIDER_LABELS: Record<PaymentProvider, { label: string; icon: typeof CreditCard }> = {
  stripe: { label: "Card", icon: CreditCard },
  bkash: { label: "bKash", icon: Smartphone },
  razorpay: { label: "Razorpay", icon: Landmark },
};

interface CreditPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreditPurchaseModal({ open, onOpenChange }: CreditPurchaseModalProps) {
  const { accessToken, user } = useSelector((state: any) => state.auth);
  const isAuthenticated = !!accessToken;
  const balanceData = useQuery(api.credits.getBalance);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<PaymentProvider>("stripe");
  const [geoLoaded, setGeoLoaded] = useState(false);

  useEffect(() => {
    if (!open || geoLoaded) return;
    fetch("/api/geolocation", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.location) {
          setProvider(getProviderForCountry(data.location));
        }
        setGeoLoaded(true);
      })
      .catch(() => setGeoLoaded(true));
  }, [open, geoLoaded]);

  const loadRazorpayScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      if (document.getElementById("razorpay-script")) {
        const check = setInterval(() => {
          if (window.Razorpay) {
            clearInterval(check);
            resolve(true);
          }
        }, 100);
        setTimeout(() => { clearInterval(check); resolve(false); }, 5000);
        return;
      }
      const script = document.createElement("script");
      script.id = "razorpay-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const handleStripeCheckout = async (packId: PackId) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch("/api/stripe/credits/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ packId }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMsg = "Purchase failed";
      try {
        const data = await response.json();
        errorMsg = data.error || errorMsg;
      } catch {
        errorMsg = `Server error (${response.status}). Please try again.`;
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    }
  };

  const handleBkashCheckout = async (packId: PackId) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch("/api/bkash/credits/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ packId }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMsg = "bKash payment failed";
      try {
        const data = await response.json();
        errorMsg = data.error || errorMsg;
      } catch {
        errorMsg = `Server error (${response.status}). Please try again.`;
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    if (data.bkashURL) {
      window.location.href = data.bkashURL;
    }
  };

  const handleRazorpayCheckout = async (packId: PackId) => {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      throw new Error("Failed to load Razorpay. Please refresh and try again.");
    }

    const response = await fetch("/api/razorpay/credits/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ packId }),
    });

    if (!response.ok) {
      let errorMsg = "Payment failed";
      try {
        const data = await response.json();
        errorMsg = data.error || errorMsg;
      } catch {
        errorMsg = `Server error (${response.status}). Please try again.`;
      }
      throw new Error(errorMsg);
    }

    const orderData = await response.json();
    const pack = CREDIT_PACKS[packId];

    return new Promise<void>((resolve, reject) => {
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Shothik AI",
        description: `${pack.credits} Credits`,
        order_id: orderData.orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await fetch("/api/razorpay/credits/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                packId,
              }),
            });

            if (verifyRes.ok) {
              window.location.href = `/account/settings?section=wallet&credit_purchase=success&credits=${pack.credits}&provider=razorpay&pack=${packId}`;
              resolve();
            } else {
              const errData = await verifyRes.json();
              reject(new Error(errData.error || "Payment verification failed"));
            }
          } catch {
            reject(new Error("Payment verification failed. Please contact support."));
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: { color: "#f59e0b" },
        modal: {
          ondismiss: () => {
            reject(new Error("Payment cancelled"));
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    });
  };

  const handlePurchase = async (packId: PackId) => {
    if (!isAuthenticated || purchasing) return;
    setPurchasing(packId);
    setError(null);
    trackCreditPurchaseStarted(provider, packId);
    try {
      switch (provider) {
        case "stripe":
          await handleStripeCheckout(packId);
          break;
        case "bkash":
          await handleBkashCheckout(packId);
          break;
        case "razorpay":
          await handleRazorpayCheckout(packId);
          break;
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        setError("Request timed out. Please check your connection and try again.");
      } else if (err.message === "Payment cancelled") {
        setError(null);
      } else {
        setError(err.message || "Purchase failed. Please try again.");
      }
    } finally {
      setPurchasing(null);
    }
  };

  const availableProviders: PaymentProvider[] = ["stripe", "bkash", "razorpay"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Coins className="h-6 w-6 fill-amber-400 text-amber-400" />
            Get Credits
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4 flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
          <span className="text-sm text-muted-foreground">Your Balance</span>
          <div className="flex items-center gap-1.5 text-lg font-bold text-amber-400">
            <Coins className="h-5 w-5 fill-amber-400" />
            {(balanceData?.balance ?? 0).toLocaleString()}
          </div>
        </div>

        <div className="mb-4 flex gap-1 rounded-lg bg-muted/30 p-1" role="tablist" aria-label="Payment method">
          {availableProviders.map((p) => {
            const { label, icon: Icon } = PROVIDER_LABELS[p];
            return (
              <button
                key={p}
                role="tab"
                aria-selected={provider === p}
                onClick={() => { setProvider(p); setError(null); }}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-all",
                  provider === p
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3" role="list" aria-label="Credit packs available for purchase">
          {PACK_LIST.map((packEntry) => {
            const pack = CREDIT_PACKS[packEntry.id];
            const Icon = packEntry.icon;
            const isLoading = purchasing === packEntry.id;
            const priceDisplay = getPackPrice(packEntry.id, provider);
            return (
              <button
                key={packEntry.id}
                onClick={() => handlePurchase(packEntry.id)}
                disabled={!isAuthenticated || !!purchasing}
                role="listitem"
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-xl p-5 text-center transition-all",
                  "bg-muted/50 hover:bg-muted",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  packEntry.popular && "ring-2 ring-amber-500/40"
                )}
                aria-label={`${pack.name} pack: ${pack.credits} credits for ${priceDisplay}`}
              >
                {packEntry.popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold text-background">
                    BEST VALUE
                  </span>
                )}

                {pack.bonus && (
                  <span className="rounded-full bg-emerald-950/30 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                    {pack.bonus}
                  </span>
                )}

                <Icon className="h-8 w-8 text-amber-400" />

                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {pack.credits.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Credits</div>
                </div>

                <div className="mt-1 w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                  {isLoading ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Processing
                    </span>
                  ) : (
                    priceDisplay
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <p role="alert" className="mt-2 text-center text-xs text-destructive">
            {error}
          </p>
        )}

        <p className="mt-2 text-center text-xs text-muted-foreground">
          Credits are non-refundable. 70% of gifted Credits go to the content creator.
        </p>
      </DialogContent>
    </Dialog>
  );
}
