"use client";

import Image from "next/image";
import { useDispatch } from "react-redux";
import { ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { setIsSidebarOpen } from "@/redux/slices/grammar-checker-slice";
import GrammarSidebar from "./GrammarSidebar";

const GrammarResultsPanel = ({
  isMobileTab,
  mobileTab,
  isSidebarOpen,
  isCheckLoading,
  issues,
  recommendations,
  isRecommendationLoading,
  handleAcceptCorrection,
  handleIgnoreError,
  handleAcceptAllCorrections,
}) => {
  const dispatch = useDispatch();

  return (
    <div className={cn(isMobileTab && mobileTab === "results" ? "block" : "hidden lg:block")}>
      <div
        className={cn(
          "absolute top-0 right-0 bottom-0 z-50 flex flex-col transition-all duration-300",
          {
            "right-0": isSidebarOpen,
            "-right-full": !isSidebarOpen,
          },
        )}
      >
        <GrammarSidebar
          handleAccept={handleAcceptCorrection}
          handleIgnore={handleIgnoreError}
          handleAcceptAll={handleAcceptAllCorrections}
        />
      </div>
      <div className="w-80 lg:mt-10">
        <div>
          <div className="mb-4 flex items-center justify-between gap-4">
            <button
              onClick={() => dispatch(setIsSidebarOpen(true))}
              aria-label="Open grammar assistant"
              className="flex h-8 cursor-pointer items-center justify-center rounded-full bg-muted/50 px-3 shadow-sm"
            >
              <ChevronsRight />
              <span>Open assistant</span>
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4" aria-live="polite">
              <div className="flex items-center gap-2">
                <span>
                  {isCheckLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="border-t-muted-foreground h-5 w-5 animate-spin rounded-full border-2"></div>
                    </div>
                  ) : issues?.length ? (
                    <span className="rounded-md bg-red-500 px-1.5 py-1 text-white">
                      {issues?.length}
                    </span>
                  ) : (
                    <Image
                      className="shrink-0"
                      alt="check"
                      src="/favicon.png"
                      height={20}
                      width={20}
                    />
                  )}
                </span>
                <span>Grammar</span>
              </div>
              <div>
                {!!issues?.length && (
                  <button
                    onClick={handleAcceptAllCorrections}
                    className="text-primary bg-primary/10 h-8 cursor-pointer rounded-full px-4 text-sm"
                  >
                    Accept All
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between gap-4" aria-live="polite">
              <div className="flex items-center gap-2">
                <span>
                  {recommendations?.length ? (
                    <span className="rounded-md bg-red-500 px-1.5 py-1 text-white">
                      {recommendations.length || 0}
                    </span>
                  ) : isRecommendationLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="border-t-muted-foreground h-5 w-5 animate-spin rounded-full border-2"></div>
                    </div>
                  ) : (
                    <Image
                      className="shrink-0"
                      alt="check"
                      src="/favicon.png"
                      height={20}
                      width={20}
                    />
                  )}
                </span>
                <span>Recommendation</span>
              </div>
              <div>
                {!!recommendations?.length && (
                  <button className="text-primary bg-primary/10 h-8 cursor-pointer rounded-full px-4 text-sm">
                    Accept All
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrammarResultsPanel;
