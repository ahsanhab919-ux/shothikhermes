"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { TPackage } from "@/types/package.type";
import { CheckCircle, User } from "lucide-react";
import Link from "next/link";

type PaymentSuccessViewProps = {
  package: TPackage;
  transactionId?: string;
};

export const PaymentSuccessView: React.FC<PaymentSuccessViewProps> = ({
  package: pkg,
  transactionId,
}) => {
  return (
    <div className="container mx-auto max-w-2xl space-y-6 py-6 lg:py-12">
      <Card className="border-green-500/50 bg-green-500/5">
        <CardContent className="space-y-4 py-6 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="text-3xl font-bold text-green-500">
            Payment Successful!
          </h2>
          <p className="text-muted-foreground">
            Your payment has been processed successfully.
          </p>
          {transactionId && (
            <p className="text-muted-foreground text-sm">
              Transaction ID: {transactionId}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold">Package Details</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold">{pkg.name}</h4>
            <p className="text-muted-foreground text-sm">{pkg.description}</p>
          </div>
          {pkg.plans && pkg.plans.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Purchased Plan:</h4>
              {pkg.plans
                .filter((pp) => pp.is_initial)
                .map((pp) => (
                  <div key={pp._id} className="flex justify-between">
                    <span className="text-muted-foreground">Plan:</span>
                    <span className="font-semibold">
                      {pp.plan?.name} ({pp.plan?.duration} days)
                    </span>
                  </div>
                ))}
              {pkg.plans
                .filter((pp) => pp.is_initial)
                .map((pp) => (
                  <div key={pp._id} className="flex justify-between">
                    <span className="text-muted-foreground">Credits:</span>
                    <span className="font-semibold">{pp.token}</span>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/account/settings">
          <Button asChild size="lg">
            <User className="h-4 w-4" />
            View Profile
          </Button>
        </Link>

        <Link href="/pricing">
          <Button asChild variant="outline" size="lg">
            Browse More Packages
          </Button>
        </Link>
      </div>
    </div>
  );
};
