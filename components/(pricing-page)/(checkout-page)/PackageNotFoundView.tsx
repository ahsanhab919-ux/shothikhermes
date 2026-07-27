"use client";

import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import Link from "next/link";

export const PackageNotFoundView = () => {
  return (
    <div className="container mx-auto space-y-4 py-12 text-center">
      <XCircle className="text-destructive mx-auto h-12 w-12" />
      <h2 className="text-2xl font-bold">Package Not Found</h2>
      <p className="text-muted-foreground">
        The package you're looking for doesn't exist or is no longer available.
      </p>
      <Button asChild>
        <Link href="/pricing">Back to Pricing</Link>
      </Button>
    </div>
  );
};

