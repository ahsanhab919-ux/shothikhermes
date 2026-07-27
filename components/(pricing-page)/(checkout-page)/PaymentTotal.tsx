"use client";

import type { TPaymentMethod } from "@/types/payment-method.type";

type PaymentTotalProps = {
  selectedMethod: TPaymentMethod | undefined;
  selectedPlan: any;
};

export const PaymentTotal: React.FC<PaymentTotalProps> = ({
  selectedMethod,
  selectedPlan,
}) => {
  if (!selectedMethod || !selectedPlan) return null;

  const amount =
    selectedMethod.currency === "USD"
      ? selectedPlan.price.USD
      : selectedPlan.price.BDT;

  return (
    <div className="border-t pt-4">
      <div className="space-y-2">
        <div className="flex justify-between text-lg font-semibold">
          <span>Total:</span>
          <span>
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: selectedMethod.currency,
            }).format(amount)}
          </span>
        </div>
      </div>
    </div>
  );
};

