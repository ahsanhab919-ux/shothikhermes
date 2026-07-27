/**
 * Custom hook for checkout data management
 */

import { useUserLocation } from "@/hooks/utils/useUserLocation";
import {
  fetchPublicPackages,
  fetchPublicPaymentMethods,
} from "@/services/pricing.service";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { filterPaymentMethodsByLocation } from "../utils/payment.utils";
import { getPlanId } from "../utils/plan.utils";

export const useCheckoutData = (
  packageId: string | null,
  planIdFromQuery: string | null,
) => {
  const { isBangladesh, loading: locationLoading } = useUserLocation();
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  // Fetch package
  const { data: packageResponse, isLoading: packageLoading } = useQuery({
    queryKey: ["public-package", packageId],
    queryFn: () => {
      if (!packageId) throw new Error("Package ID is required");
      return fetchPublicPackages({ _id: packageId, is_active: true });
    },
    enabled: !!packageId,
  });

  // Fetch payment methods
  const { data: paymentMethodsResponse, isLoading: methodsLoading } = useQuery({
    queryKey: ["public-payment-methods"],
    queryFn: () =>
      fetchPublicPaymentMethods({ is_active: true, sort: "sequence" }),
  });

  const currentPackage = packageResponse?.data?.[0];
  const allPaymentMethods = paymentMethodsResponse?.data || [];

  // Filter payment methods based on location
  const paymentMethods = useMemo(
    () =>
      filterPaymentMethodsByLocation(
        allPaymentMethods,
        isBangladesh,
        locationLoading,
      ),
    [allPaymentMethods, isBangladesh, locationLoading],
  );

  // Determine initial plan - filter only active plans
  const allPlans = currentPackage?.plans || [];
  const availablePlans = allPlans.filter((pp: any) => pp.is_active !== false);
  const initialPlan =
    availablePlans.find((pp: any) => pp.is_initial) || availablePlans[0];

  // Set selected plan on mount
  useEffect(() => {
    if (planIdFromQuery) {
      setSelectedPlanId(planIdFromQuery);
    } else if (initialPlan) {
      const planId = getPlanId(initialPlan.plan);
      if (planId) {
        setSelectedPlanId(planId);
      }
    }
  }, [planIdFromQuery, initialPlan]);

  // Get selected plan details
  const selectedPlan = useMemo(() => {
    return (
      availablePlans.find((pp: any) => {
        const planId = getPlanId(pp.plan);
        return planId === selectedPlanId;
      }) || initialPlan
    );
  }, [availablePlans, selectedPlanId, initialPlan]);

  return {
    currentPackage,
    paymentMethods,
    availablePlans,
    selectedPlan,
    selectedPlanId,
    setSelectedPlanId,
    isBangladesh,
    locationLoading,
    packageLoading,
    methodsLoading,
  };
};
