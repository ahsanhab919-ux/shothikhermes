"use client";

import { getPlanDuration, getPlanName } from "./utils/plan.utils";
import { getPriceDisplay } from "./utils/price.utils";

type SelectedPlanDetailsProps = {
  plan: any;
  isBangladesh: boolean | null;
};

export const SelectedPlanDetails: React.FC<SelectedPlanDetailsProps> = ({
  plan,
  isBangladesh,
}) => {
  if (!plan) return null;

  const planName = getPlanName(plan.plan);
  const planDuration = getPlanDuration(plan.plan);
  const priceDisplay = getPriceDisplay(plan.price, isBangladesh);

  return (
    <div className="space-y-2 border-t pt-4">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Plan:</span>
        <span className="font-semibold">{planName}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Credits:</span>
        <span className="font-semibold">{plan.token}</span>
      </div>
      {planDuration > 0 && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Duration:</span>
          <span className="font-semibold">{planDuration} days</span>
        </div>
      )}
      <div className="flex justify-between border-t pt-2">
        <span className="text-muted-foreground">Price:</span>
        <div className="text-right">
          {priceDisplay.mode === "BOTH" ? (
            <>
              <div className="font-semibold">{priceDisplay.primary}</div>
              <div className="text-muted-foreground text-sm">
                {priceDisplay.secondary}
              </div>
            </>
          ) : (
            <div className="font-semibold">{priceDisplay.primary}</div>
          )}
        </div>
      </div>
    </div>
  );
};
