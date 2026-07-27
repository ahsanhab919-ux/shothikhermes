"use client";

import { cn } from "@/lib/utils";
import type { TPaymentMethod } from "@/types/payment-method.type";
import Image from "next/image";

type PaymentMethodSelectionProps = {
  methods: TPaymentMethod[];
  selectedMethodId: string;
  onMethodSelect: (methodId: string) => void;
  isBangladesh: boolean | null;
};

const PaymentMethodIcon = ({
  method,
  className,
}: {
  method: TPaymentMethod;
  className?: string;
}) => {
  const url =
    method?.value === "stripe"
      ? "/images/pricing/stripe-icon.png"
      : method?.value === "sslcommerz"
        ? "/images/pricing/sslcommerz-icon.png"
        : method?.value === "bkash"
          ? "/images/pricing/bkash-icon.png"
          : "/images/pricing/icon.png";
  return (
    <Image
      src={url}
      alt={method.name}
      className={cn("h-6 w-6 rounded", className)}
      width={24}
      height={24}
    />
  );
};

export const PaymentMethodSelection: React.FC<PaymentMethodSelectionProps> = ({
  methods,
  selectedMethodId,
  onMethodSelect,
  isBangladesh,
}) => {
  return (
    <div className="grow">
      {methods.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">
            No payment methods available for your location at the moment.
          </p>
          {isBangladesh === null && (
            <p className="text-muted-foreground mt-2 text-xs">
              Unable to detect your location. Please refresh the page.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((method: TPaymentMethod) => (
            <label
              key={method._id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                selectedMethodId === method._id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              } `}
            >
              <input
                hidden
                type="radio"
                name="paymentMethod"
                value={method._id}
                checked={selectedMethodId === method._id}
                onChange={(e) => onMethodSelect(e.target.value)}
                className="h-4 w-4"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1">
                    <PaymentMethodIcon method={method} />
                    <span className="text-xl font-semibold">{method.name}</span>
                  </div>

                  <span className="text-muted-foreground text-sm">
                    {method.currency}
                  </span>
                </div>
                {method.description && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    {method.description}
                  </p>
                )}
                {method.is_test && (
                  <span className="mt-1 inline-block rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                    Test Mode
                  </span>
                )}
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};
