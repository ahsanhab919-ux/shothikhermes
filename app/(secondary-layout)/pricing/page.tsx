"use client";

import { PricingCard } from "@/components/(pricing-page)/PricingCard";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserLocation } from "@/hooks/utils/useUserLocation";
import {
  fetchPublicPackages,
  fetchPublicPlans,
} from "@/services/pricing.service";
import type { TPackage } from "@/types/package.type";
import type { TPlan } from "@/types/plan.type";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const PricingPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>("all");

  // Use location hook
  const { isBangladesh } = useUserLocation();

  // Get plan from URL params
  useEffect(() => {
    const planParam = searchParams.get("plan");
    if (planParam) {
      setSelectedPlanId(planParam);
    } else {
      setSelectedPlanId("all");
    }
  }, [searchParams]);

  // Fetch plans with retry and timeout
  const { data: plansResponse, isLoading: plansLoading, isError: isPlansError, refetch: refetchPlans } = useQuery({
    queryKey: ["public-plans"],
    queryFn: () => fetchPublicPlans({ is_active: true, sort: "sequence" }),
    retry: 1,
    retryDelay: 2000,
    staleTime: 5 * 60 * 1000,
  });

  const plans = plansResponse?.data || [];

  // Fetch packages with plan filter
  const {
    data: packagesResponse,
    isLoading: isPackagesLoading,
    isError: isPackagesError,
    refetch: refetchPackages,
  } = useQuery({
    queryKey: ["public-packages", selectedPlanId],
    queryFn: () => {
      const query: Record<string, unknown> = {
        is_active: true,
        sort: "sequence",
      };
      if (selectedPlanId && selectedPlanId !== "all") {
        query.plans = selectedPlanId;
      }
      return fetchPublicPackages(query);
    },
    retry: 1,
    retryDelay: 2000,
    staleTime: 5 * 60 * 1000,
    enabled: !isPlansError && !plansLoading,
  });

  const packages = packagesResponse?.data || [];

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    if (planId === "all") {
      router.push("/pricing");
    } else {
      router.push(`/pricing?plan=${planId}`);
    }
  };

  const handleRetry = () => {
    refetchPlans();
    refetchPackages();
  };

  if (plansLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-6 lg:py-12">
        <Spinner className="text-primary h-8 w-8" />
        <p className="text-muted-foreground mt-4">Loading pricing plans...</p>
      </div>
    );
  }

  if (isPlansError || isPackagesError) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-6 lg:py-12">
        <AlertCircle className="text-destructive mb-4 h-12 w-12" />
        <h2 className="mb-2 text-xl font-semibold">Unable to load pricing</h2>
        <p className="text-muted-foreground mb-6 max-w-md text-center">
          We're having trouble connecting to our servers. Please try again or contact us for assistance.
        </p>
        <div className="flex gap-4">
          <Button onClick={handleRetry} variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Link href="/contact-us">
            <Button variant="outline">Contact Us</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <div
        style={{ backgroundImage: `url('/pricing_bg_img.webp')` }}
        className="dark text-foreground bg-cover bg-center bg-no-repeat"
      >
        <div className="text-primary-foreground bg-black/15 py-6 pb-46 lg:py-12 lg:pb-52">
          <div>
            <div className="container mx-auto mb-6 max-w-4xl space-y-6 text-center">
              <h1 className="text-4xl font-bold capitalize">
                Our pricing plan made simple
              </h1>
              <p className="text-lg">
                Discover the right plan for your needs and take advantage of
                Shothik.ai's powerful tools. Whether you're just getting started
                or need advanced features for your business, we've got you
                covered.
              </p>
            </div>

            {/* Plan Tabs */}
            <div className="mb-6">
              {plans.length > 0 && (
                <div className="flex w-full justify-center p-0.5">
                  <Tabs
                    value={selectedPlanId || "all"}
                    onValueChange={handlePlanChange}
                    className="w-full max-w-4xl"
                  >
                    <TabsList className="border-foreground/15 mx-auto inline-flex w-full max-w-md flex-wrap justify-center gap-1 rounded-full border bg-transparent">
                      <TabsTrigger
                        value="all"
                        className="text-primary-foreground! data-[state=active]:text-foreground! data-[state=active]:bg-foreground/15! flex cursor-pointer items-center gap-2 rounded-full backdrop-blur-xl data-[state=active]:border-current/50!"
                      >
                        All
                      </TabsTrigger>
                      {plans.map((plan: TPlan) => (
                        <TabsTrigger
                          key={plan._id}
                          value={plan._id}
                          className="text-primary-foreground! data-[state=active]:text-foreground! data-[state=active]:bg-foreground/15! flex cursor-pointer items-center gap-2 rounded-full backdrop-blur-xl data-[state=active]:border-current/50!"
                        >
                          {plan.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto pb-6 lg:pb-12">
        {isPackagesLoading && (
          <div className="flex flex-1 items-center justify-center py-6 lg:py-12">
            <Spinner className="text-primary h-8 w-8" />
          </div>
        )}

        {packages.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              No packages available at the moment.
            </p>
          </div>
        ) : (
          <div className="relative -mt-30 grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {packages.map((pkg: TPackage) => (
              <PricingCard
                key={pkg._id}
                package={pkg}
                selectedPlanId={selectedPlanId}
                isBangladesh={isBangladesh}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingPage;
