"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const errorInfo = {
      message: error?.message || "Unknown error",
      name: error?.name || "Error",
      digest: error?.digest || undefined,
      stack: error?.stack?.split("\n").slice(0, 5).join("\n") || undefined,
    };
    console.error("Dashboard error:", errorInfo.message, errorInfo);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-muted/50 p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <svg className="h-7 w-7 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">This tool encountered an error</h2>
          <p className="text-sm text-muted-foreground">
            Don&apos;t worry — your input text is auto-saved. Try again or switch to another tool.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset} variant="default">
            Try Again
          </Button>
          <Button onClick={() => window.location.href = "/writing-studio"} variant="outline">
            Back to Writing Studio
          </Button>
        </div>
      </div>
    </div>
  );
}
