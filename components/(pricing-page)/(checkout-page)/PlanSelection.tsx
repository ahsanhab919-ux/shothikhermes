"use client";

import * as React from "react";
import { getPlanDuration, getPlanId, getPlanName } from "./utils/plan.utils";
import { getPriceDisplay } from "./utils/price.utils";

type PlanSelectionProps = {
  plans: any[];
  selectedPlanId: string;
  onPlanSelect: (planId: string) => void;
  isBangladesh: boolean | null;
};

export const PlanSelection: React.FC<PlanSelectionProps> = ({
  plans,
  selectedPlanId,
  onPlanSelect,
  isBangladesh,
}) => {
  if (plans.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Select Plan:</div>
      <div className="space-y-2">
        {plans.map((pp: any) => {
          const plan = pp.plan;
          const planId = getPlanId(plan);
          const planName = getPlanName(plan);
          const planDuration = getPlanDuration(plan);
          const isSelected = selectedPlanId === planId;
          const inputId = `plan-${planId || pp._id}`;
          const priceDisplay = getPriceDisplay(pp.price, isBangladesh);

          return (
            <label
              key={planId || pp._id}
              htmlFor={inputId}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-accent"
              }`}
            >
              <input
                hidden
                type="radio"
                id={inputId}
                name="plan"
                value={planId}
                checked={isSelected}
                onChange={(e) => onPlanSelect(e.target.value)}
                className="mt-1"
                aria-label={`Select ${planName} plan`}
              />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {planName} ({planDuration} days)
                      </span>
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {pp.token} Credits
                    </div>
                  </div>
                  <div className="mt-1 text-sm font-medium">
                    {priceDisplay.mode === "BOTH" ? (
                      <>
                        <span className="font-semibold">
                          {priceDisplay.primary}
                        </span>
                        {" / "}
                        <span>{priceDisplay.secondary}</span>
                      </>
                    ) : (
                      <span className="font-semibold">
                        {priceDisplay.primary}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};
