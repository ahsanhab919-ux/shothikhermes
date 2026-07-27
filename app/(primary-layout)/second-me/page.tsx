"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SecondMeRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/twin");
  }, [router]);

  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto" />
        <p className="text-muted-foreground text-sm">Redirecting to Twin dashboard...</p>
      </div>
    </div>
  );
}
