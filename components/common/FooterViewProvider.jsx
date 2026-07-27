"use client";

import { usePathname } from "next/navigation";

export default function FooterViewProvider({ children }) {
  const pathname = usePathname();

  // Split pathname into segments: ["agents", "research"] for /agents/research
  const pathSegments = pathname.split("/").filter(Boolean);

  const isOnAgentRoute = pathSegments[0] === "agents";

  if (isOnAgentRoute) {
    return null;
  }

  return <>{children}</>;
}
