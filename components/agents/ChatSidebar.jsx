"use client";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { format } from "date-fns";
import {
  Clock,
  FileSpreadsheet,
  Loader2,
  MessageCircle,
  Presentation,
  Search,
} from "lucide-react";
import { useState } from "react";

function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-muted mb-4 flex size-14 items-center justify-center rounded-2xl">
        <Icon className="text-muted-foreground size-6" />
      </div>
      <p className="text-sm font-medium">No chats yet</p>
      <p className="text-muted-foreground mt-1 max-w-[200px] text-xs">
        {message}
      </p>
    </div>
  );
}

function ChatCard({ title, date, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "bg-card hover:bg-accent group w-full rounded-xl border p-3.5 text-left transition-all duration-200",
        "hover:shadow-sm active:scale-[0.98]",
      )}
    >
      <p className="truncate text-sm font-medium" title={title}>
        {title}
      </p>
      <p className="text-muted-foreground mt-1.5 flex items-center gap-1.5 text-xs">
        <Clock className="size-3" />
        {format(new Date(date), "MMM d, yyyy · h:mm a")}
      </p>
    </button>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="text-primary size-5 animate-spin" />
      <span className="text-muted-foreground ml-2 text-sm">Loading...</span>
    </div>
  );
}

export default function ChatSidebar({
  sidebarOpen,
  toggleDrawer,
  isMobile,
  isLoading,
  error,
  router,
  myChats = [],
  SlideDataLoading,
  slidesChats,
  SlideDataLoadingError,
  researchData,
  researchDataLoading,
  researchDataError,
}) {
  const [tabIndex, setTabIndex] = useState("slide");

  return (
    <Sheet open={sidebarOpen} onOpenChange={(open) => toggleDrawer(open)()}>
      <SheetContent
        side="left"
        className={cn(
          "absolute w-screen overflow-hidden p-0 sm:w-80 sm:max-w-[calc(100vw-320px)] md:w-[360px]",
        )}
        style={{ zIndex: 1102 }}
      >
        <VisuallyHidden>
          <SheetTitle>Chat History</SheetTitle>
        </VisuallyHidden>
        <div className="flex h-screen w-full flex-col">
          <div className="border-b px-4 pt-4 pb-3">
            <h2 className="mb-3 text-sm font-semibold">History</h2>
            <Tabs
              value={tabIndex}
              onValueChange={setTabIndex}
              className="w-full"
            >
              <TabsList className="h-9 w-full gap-1 rounded-lg p-1">
                <TabsTrigger value="slide" className="flex-1 gap-1.5 rounded-md text-xs">
                  <Presentation className="size-3.5" />
                  Slides
                </TabsTrigger>
                <TabsTrigger value="sheet" className="flex-1 gap-1.5 rounded-md text-xs">
                  <FileSpreadsheet className="size-3.5" />
                  Sheets
                </TabsTrigger>
                <TabsTrigger value="research" className="flex-1 gap-1.5 rounded-md text-xs">
                  <Search className="size-3.5" />
                  Research
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex-1 overflow-auto p-3">
            {tabIndex === "slide" && (
              <>
                {SlideDataLoading && <LoadingState />}
                {SlideDataLoadingError && (
                  <p className="text-muted-foreground p-4 text-center text-sm">
                    Could not load chats
                  </p>
                )}
                {!SlideDataLoading && slidesChats?.length === 0 && (
                  <EmptyState
                    icon={Presentation}
                    message="Create a presentation to see your history here"
                  />
                )}
                {slidesChats?.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {slidesChats.map((chat) => (
                      <ChatCard
                        key={chat.p_id}
                        title={chat.title}
                        date={chat.creation_date}
                        onClick={() => {
                          toggleDrawer(false)();
                          router.push(
                            `/agents/presentation?id=${chat.p_id}`,
                          );
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {tabIndex === "sheet" && (
              <>
                {isLoading && <LoadingState />}
                {error && (
                  <p className="text-muted-foreground p-4 text-center text-sm">
                    Could not load chats
                  </p>
                )}
                {!isLoading && myChats.length === 0 && (
                  <EmptyState
                    icon={FileSpreadsheet}
                    message="Generate a spreadsheet to see your history here"
                  />
                )}
                {myChats.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {myChats.map((chat) => (
                      <ChatCard
                        key={chat._id || chat.id}
                        title={chat.name}
                        date={chat.createdAt}
                        onClick={() => {
                          toggleDrawer(false)();
                          router.push(`/agents/sheets?id=${chat._id}`);
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {tabIndex === "research" && (
              <>
                {researchDataLoading && <LoadingState />}
                {researchDataError && (
                  <p className="text-muted-foreground p-4 text-center text-sm">
                    Could not load chats
                  </p>
                )}
                {!researchDataLoading && researchData?.length === 0 && (
                  <EmptyState
                    icon={Search}
                    message="Run a deep research to see your history here"
                  />
                )}
                {researchData?.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {researchData.map((chat) => (
                      <ChatCard
                        key={chat._id}
                        title={chat.name}
                        date={chat.createdAt}
                        onClick={() => {
                          toggleDrawer(false)();
                          router.push(`/agents/research?id=${chat._id}`);
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
