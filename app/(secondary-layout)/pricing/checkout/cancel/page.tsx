"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  fetchPublicPackages,
} from "@/services/pricing.service";
import type { TPackage } from "@/types/package.type";
import { useQuery } from "@tanstack/react-query";
import { User, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const CheckoutCancelPage = () => {
  const searchParams = useSearchParams();
  const packageId = searchParams.get("package_id");
  const planId = searchParams.get("plan_id");

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

  return (
    <div className="container mx-auto max-w-2xl space-y-6 py-12">
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="space-y-4 py-12 text-center">
          <XCircle className="text-destructive mx-auto h-16 w-16" />
          <h2 className="text-3xl font-bold">Payment Cancelled</h2>
          <p className="text-muted-foreground">
            Your payment was cancelled. No charges were made to your account.
          </p>
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
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        {packageData && (
          <Button asChild size="lg">
            <Link
              href={`/pricing/checkout?package_id=${packageData._id}${planId ? `&plan_id=${planId}` : ""}`}
            >
              Try Again
            </Link>
          </Button>
        )}
        <Button asChild variant="outline" size="lg">
          <Link href="/pricing">Back to Pricing</Link>
        </Button>

        <Button asChild variant="outline" size="lg">
          <Link href="/account/settings">
            <User className="h-4 w-4" />
            View Profile
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default CheckoutCancelPage;
