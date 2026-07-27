"use client";

import { AppProgressProvider } from "@bprogress/next";

const ProgressProvider = ({ children, ...props }) => {
  return <AppProgressProvider {...props}>{children}</AppProgressProvider>;
};

export default ProgressProvider;
