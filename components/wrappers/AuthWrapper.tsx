"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";

interface AuthWrapperProps {
  readonly children: React.ReactNode;
  readonly redirect?: string;
}

const AuthWrapper = ({ children, redirect }: AuthWrapperProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { accessToken } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Check for accessToken in Redux state or localStorage
    const isClient = globalThis.window !== undefined;
    const token =
      accessToken || (isClient ? localStorage.getItem("accessToken") : null);

    if (!token) {
      const redirectPath = redirect || searchParams.get("redirect") || "/";

      // Add current path as query parameter
      const path = pathname || "/";
      const separator = redirectPath.includes("?") ? "&" : "?";
      const redirectTo = `${redirectPath}${separator}from=${encodeURIComponent(path)}`;

      router.replace(redirectTo);
    }
  }, [accessToken, redirect, router, searchParams, pathname]);

  // Check if user is authenticated
  const isClient = globalThis.window !== undefined;
  const token =
    accessToken || (isClient ? localStorage.getItem("accessToken") : null);

  // If not authenticated, don't render children (will redirect)
  if (!token) {
    return (
      <div className="bg-background flex min-h-[calc(100vh-3rem)] items-center justify-center lg:min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <Loader2 className="text-primary mx-auto mb-4 h-12 w-12 animate-spin" />
          <p className="text-muted-foreground text-lg">Loading accounts...</p>
        </div>
      </div>
    );
  }

  // If authenticated, render children
  return <>{children}</>;
};

export default AuthWrapper;
