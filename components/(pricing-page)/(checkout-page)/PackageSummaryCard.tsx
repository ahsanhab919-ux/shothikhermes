"use client";

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import type { TPackage } from "@/types/package.type";
import { PlanSelection } from "./PlanSelection";
import { SelectedPlanDetails } from "./SelectedPlanDetails";

type PackageSummaryCardProps = {
  package: TPackage;
  availablePlans: any[];
  selectedPlanId: string;
  selectedPlan: any;
  onPlanSelect: (planId: string) => void;
  isBangladesh: boolean | null;
};

export const PackageSummaryCard: React.FC<PackageSummaryCardProps> = ({
  package: pkg,
  availablePlans,
  selectedPlanId,
  selectedPlan,
  onPlanSelect,
  isBangladesh,
}) => {
  return (
    <Card className="flex flex-col">
      <CardHeader className="border-b">
        <h2 className="text-xl font-semibold">Package Summary</h2>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{pkg.name}</h3>
          {pkg.description && (
            <p className="text-muted-foreground text-sm">{pkg.description}</p>
          )}
        </div>

        {/* Plan Selection */}
        <div>
          <PlanSelection
            plans={availablePlans}
            selectedPlanId={selectedPlanId}
            onPlanSelect={onPlanSelect}
            isBangladesh={isBangladesh}
          />
        </div>

        {/* Selected Plan Details */}
        <div className="mt-auto">
          <SelectedPlanDetails plan={selectedPlan} isBangladesh={isBangladesh} />
        </div>
      </CardContent>
    </Card>
  );
};

