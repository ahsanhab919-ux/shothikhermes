import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-muted/50 p-8 text-center shadow-sm">
        <div className="text-6xl font-bold text-muted-foreground/30">404</div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Page not found</h2>
          <p className="text-sm text-muted-foreground">
            This tool or page doesn&apos;t exist or may have been moved.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/writing-studio">
            <Button variant="default">Go to Writing Studio</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Go Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
