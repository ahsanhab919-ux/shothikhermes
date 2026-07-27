"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  fetchPaymentTransactionStatus,
  fetchPublicPackages,
} from "@/services/pricing.service";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Copy, CreditCard, User } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

// Extend Window interface for analytics
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>,
    ) => void;
    fbq?: (
      command: string,
      eventName: string,
      params?: Record<string, any>,
    ) => void;
    analytics?: {
      track: (eventName: string, params?: Record<string, any>) => void;
    };
  }
}

const CheckoutSuccessPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageId = searchParams.get("package_id");
  const planId = searchParams.get("plan_id"); // Get plan_id from search params
  const [isVerifying, setIsVerifying] = useState<boolean>(true);
  const [showRetryButton, setShowRetryButton] = useState<boolean>(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    amount: number;
    currency: string;
    paymentMethodName?: string;
  } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const analyticsTracked = useRef<boolean>(false);

  // Get transaction ID from URL params (payment server redirect adds transaction_id)
  // transaction_id should be the payment transaction document _id (MongoDB ObjectId)
  // Fallback to sessionStorage if not in URL
  const transactionId =
    searchParams.get("transaction_id") ||
    (globalThis.window === undefined
      ? null
      : globalThis.window.sessionStorage.getItem("pending_transaction_id"));

  // Fetch package details if packageId is provided
  const { data: packageResponse } = useQuery({
    queryKey: ["public-package", packageId],
    queryFn: () => {
      if (!packageId) throw new Error("Package ID is required");
      return fetchPublicPackages({ _id: packageId, is_active: true });
    },
    enabled: !!packageId,
  });

  const packageData = packageResponse?.data?.[0];

  // Find the purchased plan from package plans array
  // Match by plan_id if provided, otherwise fallback to is_initial
  const purchasedPlan = packageData?.plans?.find(
    (pp) => pp.plan?._id === planId || (!planId && pp.is_initial),
  );

  // Handle copy transaction ID
  const handleCopyTransactionId = async () => {
    if (!transactionId) return;

    try {
      await navigator.clipboard.writeText(transactionId);
      setCopied(true);
      toast.success("Transaction ID copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy Transaction ID");
    }
  };

  // Poll for payment status until webhook processes
  const pollPaymentStatus = async () => {
    if (!transactionId) {
      setIsVerifying(false);
      return;
    }

    setIsVerifying(true);
    setShowRetryButton(false);

    const maxAttempts = 10; // 10 attempts = 30 seconds (3s interval)
    const interval = 3000; // 3 seconds between attempts

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const statusResponse =
          await fetchPaymentTransactionStatus(transactionId);

        if (statusResponse.data?.status === "success") {
          // Webhook processed successfully
          setIsVerifying(false);
          setShowRetryButton(false);

          // Store payment details for display
          if (statusResponse.data) {
            setPaymentDetails({
              amount: statusResponse.data.amount || 0,
              currency: statusResponse.data.currency || "USD",
              paymentMethodName: statusResponse.data.payment_method_name,
            });
          }

          // Track conversion event (analytics)
          if (
            globalThis.window !== undefined &&
            !analyticsTracked.current &&
            statusResponse.data
          ) {
            analyticsTracked.current = true;

            // Google Analytics 4 (gtag)
            if (
              globalThis.window !== undefined &&
              typeof globalThis.window.gtag === "function"
            ) {
              globalThis.window.gtag("event", "purchase", {
                transaction_id: transactionId,
                value: statusResponse.data.amount,
                currency: statusResponse.data.currency,
                items: packageData
                  ? [
                      {
                        item_id: packageData._id,
                        item_name: packageData.name,
                        price: statusResponse.data.amount,
                        quantity: 1,
                      },
                    ]
                  : [],
              });
            }

            // Facebook Pixel (fbq)
            if (
              globalThis.window !== undefined &&
              typeof globalThis.window.fbq === "function"
            ) {
              globalThis.window.fbq("track", "Purchase", {
                value: statusResponse.data.amount,
                currency: statusResponse.data.currency,
                content_ids: packageData ? [packageData._id] : [],
                content_name: packageData?.name,
              });
            }

            // Custom analytics event
            if (
              globalThis.window !== undefined &&
              globalThis.window.analytics !== undefined
            ) {
              try {
                globalThis.window.analytics.track("Payment Successful", {
                  transaction_id: transactionId,
                  amount: statusResponse.data.amount,
                  currency: statusResponse.data.currency,
                  payment_method: statusResponse.data.payment_method_name,
                  package_id: packageId,
                });
              } catch {
                // Analytics might not be available, ignore
              }
            }
          }

          if (globalThis.window !== undefined) {
            globalThis.window.sessionStorage.removeItem(
              "pending_transaction_id",
            );
          }
          return;
        }

        if (statusResponse.data?.status === "failed") {
          // Payment failed - redirect to cancel_url
          setIsVerifying(false);
          setShowRetryButton(false);
          if (globalThis.window !== undefined) {
            globalThis.window.sessionStorage.removeItem(
              "pending_transaction_id",
            );
          }

          const cancelUrl = statusResponse.data?.cancel_url;

          if (cancelUrl) {
            // Extract relative path from cancel_url (remove domain)
            try {
              const url = new URL(cancelUrl);
              const relativePath = url.pathname + url.search + url.hash;
              router.push(relativePath);
              return;
            } catch {
              // If URL parsing fails, try to extract path manually
              const urlMatch = cancelUrl.match(/\/\/[^/]+(\/.*)/);
              const relativePath = urlMatch?.[1];
              if (relativePath) {
                router.push(relativePath);
                return;
              }
              // If extraction fails, use cancelUrl as-is (might be relative)
              router.push(cancelUrl);
              return;
            }
          }

          // Fallback: show error and redirect to pricing page
          toast.error("Payment failed. Please try again.");
          router.push("/pricing");
          return;
        }

        // Still pending, wait and retry
        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, interval));
        }
      } catch (error) {
        console.error("Error polling payment status:", error);
        // Continue polling on error (might be temporary)
        if (attempt < maxAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, interval));
        }
      }
    }

    // Timeout - webhook might be delayed
    setIsVerifying(false);
    setShowRetryButton(true);
    toast.warning(
      "Payment is being processed. Please check back in a few moments or click retry to check again.",
    );
  };

  useEffect(() => {
    pollPaymentStatus();
  }, [transactionId]);

  if (isVerifying) {
    return (
      <div className="container mx-auto max-w-2xl space-y-6 py-12">
        <Card>
          <CardContent className="space-y-4 py-12 text-center">
            <Spinner className="text-primary mx-auto h-16 w-16" />
            <h2 className="text-2xl font-bold">Verifying Payment...</h2>
            <p className="text-muted-foreground">
              Please wait while we verify your payment.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showRetryButton) {
    return (
      <div className="container mx-auto max-w-2xl space-y-6 py-12">
        <Card>
          <CardContent className="space-y-4 py-12 text-center">
            <Spinner className="text-primary mx-auto h-16 w-16" />
            <h2 className="text-2xl font-bold">Processing Payment...</h2>
            <p className="text-muted-foreground">
              Your payment is being processed. This may take a few moments.
            </p>
            <Button onClick={pollPaymentStatus} className="mt-4">
              Check Payment Status Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl space-y-6 py-12">
      <Card className="border-green-600/50 bg-green-600/5">
        <CardContent className="space-y-4 py-12 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="text-3xl font-bold text-green-500">
            Payment Successful!
          </h2>
          <p className="text-muted-foreground">
            Your payment has been processed successfully.
          </p>

          {/* Payment Details */}
          {paymentDetails && (
            <div className="bg-background/50 mx-auto mt-4 max-w-md space-y-2 rounded-lg p-4 text-left">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid:</span>
                <span className="font-semibold">
                  {paymentDetails.amount.toLocaleString(undefined, {
                    minimumFractionDigits:
                      paymentDetails.amount % 1 === 0 ? 0 : 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  {paymentDetails.currency}
                </span>
              </div>
              {paymentDetails.paymentMethodName && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    Payment Method:
                  </span>
                  <span className="font-semibold">
                    {paymentDetails.paymentMethodName}
                  </span>
                </div>
              )}
              {transactionId && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs break-all">
                      {transactionId}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyTransactionId}
                      className="h-7 w-7 p-0"
                      title="Copy Transaction ID"
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!paymentDetails && transactionId && (
            <div className="flex items-center justify-center gap-2">
              <p className="text-muted-foreground text-sm">
                Transaction ID:{" "}
                <span className="font-mono text-xs">{transactionId}</span>
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyTransactionId}
                className="h-7 w-7 p-0"
                title="Copy Transaction ID"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {packageData && (
        <Card>
          <CardHeader className="border-b">
            <h3 className="text-xl font-semibold">Package Details</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <h4 className="font-semibold">{packageData.name}</h4>
              {packageData.description && (
                <p className="text-muted-foreground text-sm">
                  {packageData.description}
                </p>
              )}
            </div>
            {purchasedPlan && (
              <div className="space-y-2">
                <h4 className="font-semibold">Purchased Plan:</h4>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan:</span>
                  <span className="font-semibold">
                    {purchasedPlan.plan?.name} ({purchasedPlan.plan?.duration}{" "}
                    days)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Credits:</span>
                  <span className="font-semibold">
                    {purchasedPlan.token.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild size="lg">
          <Link href="/account/settings">
            <User className="mr-2 h-4 w-4" />
            View Profile
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/pricing">Browse More Packages</Link>
        </Button>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;
