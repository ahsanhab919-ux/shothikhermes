"use client";
import LoadingScreen from "@/components/common/LoadingScreen";
import Footer from "@/components/partials/footer";
import Header from "@/components/partials/header";
import { SidebarProvider } from "@/components/ui/sidebar";
import {
  useGetUserLimitQuery,
  useGetUserQuery,
} from "@/redux/api/auth/authApi";
import { AppProgressProvider as ProgressProvider } from "@bprogress/next";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

export default function SecondaryLayout({ children }) {
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const { accessToken } = useSelector((state) => state.auth);
  useGetUserQuery(undefined, {
    skip: !accessToken,
  });
  useGetUserLimitQuery();

  useEffect(() => {
    setIsLoadingPage(false);
  }, []);

  if (isLoadingPage) return <LoadingScreen />;

  return (
    <ProgressProvider
      height="3px"
      color="#00AB55"
      options={{ showSpinner: false }}
      shallowRouting
    >
      <SidebarProvider>
        <div className="flex h-screen w-full flex-col">
          <div className="flex min-h-screen flex-1 flex-col">
            <div className="bg-card relative z-50 h-12 border-b backdrop-blur-lg lg:h-16">
              <Header className={"container"} layout={"secondary"} />
            </div>
            <div className="flex max-w-full flex-1 flex-col overflow-y-auto">
              <div className="">{children}</div>
              <Footer />
            </div>
          </div>
        </div>
      </SidebarProvider>
    </ProgressProvider>
  );
}
