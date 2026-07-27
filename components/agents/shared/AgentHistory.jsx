"use client";

import useResponsive from "@/hooks/ui/useResponsive";
import { useFetchAllPresentationsQuery } from "@/redux/api/presentation/presentationApi";
import { useGetMyResearchChatsQuery } from "@/redux/api/research/researchChatApi";
import { useGetMySheetsQuery as useGetMyChatsQuery } from "@/redux/api/sheet/sheetApi";
import { setAgentHistoryMenu } from "@/redux/slices/tools";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import ChatSidebar from "../ChatSidebar";
import AgentHistoryButton from "./AgentHistoryButton";

export default function AgentHistory() {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useResponsive("down", "sm");
  const { accessToken, sheetToken, researchToken } = useSelector(
    (state) => state.auth,
  );
  const sidebarOpen = useSelector((state) => state.tools.agentHistoryMenu);

  // Only show on agent pages
  const isAgentPage = pathname?.startsWith("/agents");

  // Fetch all chat histories
  const {
    data: myChats,
    isLoading: SheetDataLoading,
    error,
    refetch: refetchChatHistory,
  } = useGetMyChatsQuery(undefined, {
    skip: !accessToken,
  });

  const {
    data: slidesChats,
    isLoading: SlideDataLoading,
    error: SlideDataLoadingError,
    refetch: refetchSlidesHistory,
  } = useFetchAllPresentationsQuery(undefined, {
    skip: !accessToken,
  });

  const {
    data: researchData,
    isLoading: researchDataLoading,
    isError: researchDataError,
    refetch: refetchResearchHistory,
  } = useGetMyResearchChatsQuery(undefined, {
    skip: !accessToken,
  });

  // Refetch history when sidebar opens
  useEffect(() => {
    if (sidebarOpen && accessToken) {
      // Refetch all histories when sidebar opens
      if (sheetToken) {
        refetchChatHistory();
      }
      refetchSlidesHistory();
      if (researchToken) {
        refetchResearchHistory();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidebarOpen, accessToken, sheetToken, researchToken]);

  // Refetch history when navigating to agent pages
  useEffect(() => {
    if (isAgentPage && accessToken) {
      // Small delay to ensure route is fully loaded
      const timer = setTimeout(() => {
        if (sheetToken) {
          refetchChatHistory();
        }
        refetchSlidesHistory();
        if (researchToken) {
          refetchResearchHistory();
        }
      }, 300);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isAgentPage, accessToken, sheetToken, researchToken]);

  // Refetch history when window regains focus (user returns to tab)
  useEffect(() => {
    if (!isAgentPage || !accessToken) return;

    const handleFocus = () => {
      // Refetch when user returns to the tab
      if (sheetToken) {
        refetchChatHistory();
      }
      refetchSlidesHistory();
      if (researchToken) {
        refetchResearchHistory();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAgentPage, accessToken, sheetToken, researchToken]);

  // Close sidebar on route change (Next.js App Router)
  useEffect(() => {
    if (sidebarOpen) {
      dispatch(setAgentHistoryMenu(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()]);

  if (!isAgentPage) {
    return null;
  }

  return (
    <>
      <AgentHistoryButton />
      <ChatSidebar
        sidebarOpen={sidebarOpen}
        toggleDrawer={(open) => () => {
          dispatch(setAgentHistoryMenu(open));
        }}
        isMobile={isMobile}
        isLoading={SheetDataLoading}
        error={error}
        router={router}
        myChats={myChats}
        SlideDataLoading={SlideDataLoading}
        slidesChats={slidesChats}
        SlideDataLoadingError={SlideDataLoadingError}
        researchData={researchData}
        researchDataLoading={researchDataLoading}
        researchDataError={researchDataError}
      />
    </>
  );
}
