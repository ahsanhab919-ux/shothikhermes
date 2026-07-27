"use client";

import React from "react";
import { Suspense } from "react";
import GoogleAnalytics from "./GoogleAnalytics";
import GoogleTagManager from "./GoogleTagManager";
import PostHogProvider from "@/components/providers/PostHogProvider";

const Analytics = () => {
  return (
    <>
      <GoogleAnalytics />
      <GoogleTagManager />
      <Suspense fallback={null}>
        <PostHogProvider />
      </Suspense>
    </>
  );
};

export default Analytics;
