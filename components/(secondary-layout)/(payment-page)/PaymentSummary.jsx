"use client";

import { trackEvent } from "@/analysers/eventTracker";
import DotFlashing from "@/components/common/DotFlashing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  useGetAppModeQuery,
  useGetTransactionQuery,
} from "@/redux/api/pricing/pricingApi";
import { Shield } from "lucide-react";
import { useEffect } from "react";
import { useSelector } from "react-redux";

export default function PaymentSummary({
  plan,
  monthly,
  handleMonthly,
  onSubmit,
  isSubmitting,
  setTotalBill,
  country,
  type = "subscription",
}) {
  const { data: modeResult, isLoading } = useGetAppModeQuery();

  const { title, bn, global, amount_monthly, amount_yearly } = plan || {};

  let {
    amount_monthly: price = 0,
    amount_yearly: priceYearly = 0,
    yearly_plan_available,
  } = (country === "bangladesh"
    ? bn
    : country === "india"
      ? plan.in
      : global) || {
    amount_monthly,
    amount_yearly,
  };

  let modePrice;
  if (country === "bangladesh" || country === "india") {
    modePrice = 1;
  } else {
    modePrice = 0.5;
  }

  const { user } = useSelector((state) => state.auth);
  const { data: transection } = useGetTransactionQuery({
    userId: user._id,
    packageName: user.package,
  });

  const paidAmount = transection?.amount || 0;
  const billtopaid = /dev|test/.test(modeResult?.data?.appMode)
    ? modePrice
    : monthly === "monthly"
      ? price - paidAmount
      : priceYearly - paidAmount;

  useEffect(() => {
    setTotalBill(billtopaid);
  }, [monthly, billtopaid]);

  if (isLoading || !plan || !title)
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center">
        <DotFlashing />
      </div>
    );

  return (
    <Card className="bg-muted/50 w-full rounded-lg p-5 sm:w-[500px]">
      <CardContent className="p-0">
        <h2 className="mb-5 text-xl font-semibold">Summary</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">Subscription</p>
            <Label className="bg-destructive/20 text-destructive rounded px-2 py-1 text-sm">
              {title}
            </Label>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">Billed by</p>
            <RadioGroup
              value={monthly}
              onValueChange={handleMonthly}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly">Monthly</Label>
              </div>
              {yearly_plan_available && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yearly" id="yearly" />
                  <Label htmlFor="yearly">Yearly</Label>
                </div>
              )}
            </RadioGroup>
          </div>

          {transection && (
            <div className="bg-primary/20 text-primary rounded-lg px-3 py-2">
              <p className="text-sm">
                You have already purchased the{" "}
                {transection.package.replace("_", " ")}
              </p>
            </div>
          )}

          <div className="flex items-end justify-end gap-1">
            {price > 0 && (
              <span className="text-lg">
                {country === "bangladesh"
                  ? "৳"
                  : country === "india"
                    ? "₹"
                    : "$"}
              </span>
            )}
            <span className="text-4xl font-bold">{billtopaid}</span>
            {price > 0 && (
              <span className="text-muted-foreground mb-1 text-sm">
                {monthly === "monthly" ? "/mo" : "/yr"}
              </span>
            )}
          </div>

          <div className="border-border border-t border-dashed" />

          {monthly !== "monthly" && (
            <h3 className="text-lg font-semibold">2 months free</h3>
          )}

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Total Billed</h3>
            <h3 className="text-lg font-semibold">
              {country === "bangladesh" ? "৳" : country === "india" ? "₹" : "$"}{" "}
              {billtopaid}
            </h3>
          </div>

          <div className="border-border border-t border-dashed" />
        </div>

        <p className="text-muted-foreground mt-1 text-xs">
          * Plus applicable taxes
        </p>

        <Button
          className="mt-5 mb-3 h-12 w-full"
          onClick={(e) => {
            onSubmit(e);
            trackEvent("click", "payment", `submit-checkout`, billtopaid);
          }}
          disabled={isSubmitting || billtopaid < 0}
        >
          {isSubmitting ? "Please wait..." : "Upgrade My Plan"}
        </Button>

        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <Shield className="text-primary h-4 w-4" />
            <span className="text-sm font-medium">
              Secure{" "}
              {country === "bangladesh"
                ? "Bkash"
                : country === "india"
                  ? "razorpay"
                  : "Stripe"}{" "}
              payment
            </span>
          </div>
          <p className="text-muted-foreground text-center text-xs">
            This is a secure 128-bit SSL encrypted payment
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
