"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import type { TPaymentMethod } from "@/types/payment-method.type";
import { CreditCard, Loader2 } from "lucide-react";
import { PaymentMethodSelection } from "./PaymentMethodSelection";
import { PaymentTotal } from "./PaymentTotal";

type PaymentMethodCardProps = {
  methods: TPaymentMethod[];
  selectedMethodId: string;
  selectedPlan: any;
  isBangladesh: boolean | null;
  onMethodSelect: (methodId: string) => void;
  onPaymentInitiate: () => void;
  isProcessing: boolean;
  isDisabled: boolean;
};

export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  methods,
  selectedMethodId,
  selectedPlan,
  isBangladesh,
  onMethodSelect,
  onPaymentInitiate,
  isProcessing,
  isDisabled,
}) => {
  const selectedMethod = methods.find((m) => m._id === selectedMethodId);

  return (
    <Card className="flex flex-col">
      <CardHeader className="border-b">
        <h2 className="text-xl font-semibold">Select Payment Method</h2>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col space-y-4">
        {isBangladesh !== null && (
          <div className="bg-muted/50 mb-2 rounded-md px-3 py-2 text-sm">
            <p className="text-muted-foreground">
              {isBangladesh
                ? "Payment methods available for Bangladesh"
                : "International payment methods available"}
            </p>
          </div>
        )}

        <PaymentMethodSelection
          methods={methods}
          selectedMethodId={selectedMethodId}
          onMethodSelect={onMethodSelect}
          isBangladesh={isBangladesh}
        />

        <PaymentTotal
          selectedMethod={selectedMethod}
          selectedPlan={selectedPlan}
        />
      </CardContent>
      <CardFooter>
        <Button
          onClick={onPaymentInitiate}
          disabled={isDisabled}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              Proceed to Payment
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
