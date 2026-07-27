import { cn } from "@/lib/utils";
import {
  setIsSidebarOpen,
  setSelectedIssue,
  setSelectedTab,
} from "@/redux/slices/grammar-checker-slice";
import { ChevronsRight } from "lucide-react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import GrammarIssueCard from "../GrammarIssueCard";

const GrammarSidebar = ({ handleAccept, handleIgnore, handleAcceptAll }) => {
  const dispatch = useDispatch();
  const {
    isCheckLoading,
    score,
    issues,
    selectedIssue,

    recommendations,
    selectedRecommendation,

    isSidebarOpen,
    // tabs
    tabs,
    selectedTab,
  } = useSelector((state) => state.grammar_checker) || {};

  return (
    <div className="h-full w-full flex-1 self-stretch overflow-y-auto rounded-xl shadow-sm lg:mt-10 lg:w-80">
      <div className="bg-card flex h-full flex-col">
        <div className="flex items-center justify-between gap-2 p-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch(setIsSidebarOpen(false))}
              className="flex aspect-square h-8 items-center justify-center rounded-md bg-muted/50"
              aria-label="Close grammar assistant"
            >
              <ChevronsRight />
            </button>
            {/* <div
              className={cn(
                "flex aspect-square h-8 items-center justify-center rounded-md border bg-red-500/15 px-2 text-xs",
              )}
            >
              {score || 0}/100
            </div>
            <p className="text-xs">Writing score</p> */}
          </div>
          {/* <div className="text-primary flex cursor-pointer items-center text-xs"> */}
          <div className="flex items-center text-xs">Grammar Details</div>
        </div>

        <div className="flex items-center px-4">
          {tabs?.map((tab, index) => (
            <div
              onClick={() => dispatch(setSelectedTab(tab))}
              key={index}
              className={cn(
                "flex cursor-pointer items-center gap-1.5 border-b border-b-transparent px-2 py-1 transition-colors",
                {
                  "text-primary border-b-primary bg-primary/10": tab === selectedTab,
                },
                {
                  "hover:bg-muted/50": tab !== selectedTab,
                },
              )}
            >
              <span className="text-xs capitalize">{tab}</span>{" "}
              <span className="shrink-0">
                {tab === "all" ? (
                  issues?.length ? (
                    <span className="bg-muted rounded-full p-1 text-xs">
                      {(issues?.length || 0) + (recommendations?.length || 0)}
                    </span>
                  ) : (
                    <Image
                      className="shrink-0"
                      alt="check"
                      src={"/favicon.png"}
                      height={16}
                      width={16}
                    />
                  )
                ) : tab === "grammar" ? (
                  issues?.length ? (
                    <span className="rounded-full bg-red-500/15 p-1 text-xs text-red-500">
                      {issues?.length || 0}
                    </span>
                  ) : (
                    <Image
                      className="shrink-0"
                      alt="check"
                      src={"/favicon.png"}
                      height={16}
                      width={16}
                    />
                  )
                ) : issues?.length ? (
                  <span className="bg-primary/10 text-primary rounded-full p-1 text-xs">
                    {recommendations?.length || 0}
                  </span>
                ) : (
                  <Image
                    className="shrink-0"
                    alt="check"
                    src={"/favicon.png"}
                    height={16}
                    width={16}
                  />
                )}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="flex flex-1 flex-col px-4">
            {selectedTab === "all" && (
              <>
                <div className="flex flex-col space-y-4 py-4">
                  <div className="flex flex-col gap-2">
                    {!!issues?.length && (
                      <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/50 px-4 py-2">
                        <div className="text-sm">
                          <span className="text-red-500">
                            {issues?.length} Grammar
                          </span>{" "}
                          <span>suggestions</span>
                        </div>
                        <div>
                          {!!issues?.length && (
                            <button
                              onClick={handleAcceptAll}
                              className="text-primary bg-primary/10 h-6 cursor-pointer rounded-full px-2 text-xs"
                            >
                              Accept All
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    {!!recommendations?.length && (
                      <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/50 px-4 py-2">
                        <div className="text-sm">
                          <span className="text-primary">
                            {recommendations?.length} recommendations
                          </span>
                        </div>
                        <div>
                          {!!recommendations?.length && (
                            <button className="text-primary bg-primary/10 h-6 cursor-pointer rounded-full px-4 text-xs">
                              Accept All
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {isCheckLoading ? (
                    <div className="flex flex-1 items-center justify-center p-8">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="relative">
                          <div className="border-muted border-t-primary h-12 w-12 animate-spin rounded-full border-4"></div>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          Checking your text...
                        </p>
                      </div>
                    </div>
                  ) : issues?.length > 0 ? (
                    <div className="divide-y">
                      {issues?.map((issue, index) => (
                        <div
                          className="cursor-pointer"
                          key={`${issue?.error}-${index}`}
                        >
                          <GrammarIssueCard
                            issue={issue}
                            handleAccept={handleAccept}
                            handleIgnore={handleIgnore}
                            isCollapsed={issue?.error === selectedIssue?.error}
                            handleIsCollapsed={() =>
                              dispatch(setSelectedIssue(issue))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-1 items-center justify-center">
                      <div className="p-8 text-center">
                        <Image
                          className="mx-auto mb-2 w-full object-contain object-center"
                          alt="moscot"
                          src={"/moscot.png"}
                          height={100}
                          width={100}
                        />
                        <p>You are all set!</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
            {selectedTab === "grammar" && (
              <>
                <div className="flex flex-col space-y-4 py-4">
                  <div className="flex flex-col gap-2">
                    {!!issues?.length && (
                      <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/50 px-4 py-2">
                        <div className="text-sm">
                          <span className="text-red-500">
                            {issues?.length} Grammar
                          </span>{" "}
                          <span>suggestions</span>
                        </div>
                        <div>
                          {!!issues?.length && (
                            <button
                              onClick={handleAcceptAll}
                              className="text-primary bg-primary/10 h-6 cursor-pointer rounded-full px-2 text-xs"
                            >
                              Accept All
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {isCheckLoading ? (
                    <div className="flex flex-1 items-center justify-center p-8" aria-live="polite">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="relative">
                          <div className="border-muted border-t-primary h-12 w-12 animate-spin rounded-full border-4"></div>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          Checking your text...
                        </p>
                      </div>
                    </div>
                  ) : issues?.length > 0 ? (
                    <div className="divide-y" aria-label="Grammar issues" aria-live="polite">
                      {issues?.map((issue, index) => (
                        <div
                          className="cursor-pointer"
                          key={`${issue?.error}-${index}`}
                        >
                          <GrammarIssueCard
                            issue={issue}
                            handleAccept={handleAccept}
                            handleIgnore={handleIgnore}
                            isCollapsed={issue?.error === selectedIssue?.error}
                            handleIsCollapsed={() =>
                              dispatch(setSelectedIssue(issue))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-1 items-center justify-center">
                      <div className="p-8 text-center">
                        <Image
                          className="mx-auto mb-2 w-full object-contain object-center"
                          alt="moscot"
                          src={"/moscot.png"}
                          height={100}
                          width={100}
                        />
                        <p>You are all set!</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
            {selectedTab === "recommendation" && (
              <>
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col gap-2">
                    {!!recommendations?.length && (
                      <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/50 px-4 py-2">
                        <div className="text-sm">
                          <span className="text-primary">
                            {recommendations?.length} recommendations
                          </span>
                        </div>
                        <div>
                          {!!recommendations?.length && (
                            <button className="text-primary bg-primary/10 h-6 cursor-pointer rounded-full px-4 text-xs">
                              Accept All
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {isCheckLoading ? (
                    <div className="flex flex-1 items-center justify-center p-8">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="relative">
                          <div className="border-muted border-t-primary h-12 w-12 animate-spin rounded-full border-4"></div>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          Checking your text...
                        </p>
                      </div>
                    </div>
                  ) : recommendations?.length > 0 ? (
                    <div className="divide-y">
                      {recommendations?.map((issue, index) => (
                        <div
                          className="cursor-pointer"
                          key={`${issue?.error}-${index}`}
                        >
                          <GrammarIssueCard
                            issue={issue}
                            handleAccept={handleAccept}
                            handleIgnore={handleIgnore}
                            isCollapsed={issue?.error === selectedIssue?.error}
                            handleIsCollapsed={() =>
                              dispatch(setSelectedIssue(issue))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-1 items-center justify-center">
                      <div className="p-8 text-center">
                        <Image
                          className="mx-auto mb-2 w-full object-contain object-center"
                          alt="moscot"
                          src={"/moscot.png"}
                          height={100}
                          width={100}
                        />
                        <p>You are all set!</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrammarSidebar;
