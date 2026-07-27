"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

// SwaggerUI doesn't support SSR properly, so we dynamically import it
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto py-8">
        <SwaggerUI url="/api/docs/swagger.json" />
      </div>
    </div>
  );
}
