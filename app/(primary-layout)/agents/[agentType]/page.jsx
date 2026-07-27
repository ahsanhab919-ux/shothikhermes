"use client";
import NotFound from "@/app/not-found";
import { AgentContextProvider } from "@/components/agents/shared/AgentContextProvider";
import ChatAgentPage from "@/components/agents/ChatAgentPage";
import ChatInput from "@/components/research/ui/ChatInput";
import ResearchPageSkeletonLoader from "@/components/research/ui/ResearchPageSkeletonLoader";
import { FooterCta } from "@/components/sheet/SheetAgentPage"; // Needs to move it to common or shared folder.
import { researchCoreState } from "@/redux/slices/researchCoreSlice";
import dynamic from "next/dynamic";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
// import PresentationAgentPage from "@/components/presentation/PresentationAgentPage";
// import ResearchAgentPage from "@/components/research/ResearchAgentPage";
// const PresentationAgentPage = dynamic(
//   () => import("@/components/presentation/PresentationAgentPage"),
//   {
//     loading: () => <ResearchPageSkeletonLoader />,
//     ssr: false,
//   },
// );
const PresentationAgentPageV2 = dynamic(
  () => import("@/components/presentation/PresentationAgentPageV2"),
  {
    loading: () => <ResearchPageSkeletonLoader />,
    ssr: false,
  },
);
const SheetAgentPage = dynamic(
  () => import("@/components/sheet/SheetAgentPage"),
  {
    loading: () => <ResearchPageSkeletonLoader />,
    ssr: false,
  },
);
const ResearchAgentPage = dynamic(
  () => import("@/components/research/ResearchAgentPage"),
  {
    loading: () => <ResearchPageSkeletonLoader />,
    ssr: false,
  },
);

export default function SpecificAgentPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const params = useParams();
  const agentType = params.agentType;

  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const researchId = searchParams.get("r_id"); // this ID is presents when we are on research simulation mode
  const isResarchSimulating = !!researchId;

  // 

  const [loadingResearchHistory, setLoadingResearchHistory] = useState(true);

  const { isSimulating, simulationStatus } = useSelector(researchCoreState);

  // Media query hook for responsive design
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const handleMediaQueryChange = (e) => setIsMobile(e.matches);

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleMediaQueryChange);

    return () =>
      mediaQuery.removeEventListener("change", handleMediaQueryChange);
  }, []);

  // Function to render the appropriate component based on agentType
  const renderComponent = () => {
    switch (agentType) {
      case "chat":
        return <ChatAgentPage />;
      case "presentation":
        return (
          // <PresentationAgentPage
          //   specificAgent={agentType}
          //   presentationId={id}
          // /> // working version previously
          <PresentationAgentPageV2 presentationId={id} />
        );
      case "sheets":
        return <SheetAgentPage specificAgent={agentType} sheetId={id} />;
      case "research":
        return (
          <ResearchAgentPage
            loadingResearchHistory={loadingResearchHistory}
            setLoadingResearchHistory={setLoadingResearchHistory}
          />
        );
      case "browse":
        return (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="rounded-2xl border border-border bg-muted/30 p-10 max-w-md">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Browse Agents</h2>
              <p className="text-muted-foreground mb-6">Discover and explore AI agents built by the community. This feature is coming soon.</p>
              <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">Coming Soon</span>
            </div>
          </div>
        );
      case "call":
        return (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
            <div className="rounded-2xl border border-border bg-muted/30 p-10 max-w-md">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Call Agent</h2>
              <p className="text-muted-foreground mb-6">Voice-call AI agents for real-time conversations and assistance. This feature is coming soon.</p>
              <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">Coming Soon</span>
            </div>
          </div>
        );
      default:
        return <NotFound />;
    }
  };

  return (
    <AgentContextProvider>
      <div className="relative min-h-[calc(100dvh-200px)] overflow-y-auto">
        {renderComponent()}

        {/* chat input for research agents */}
        {agentType === "research" && !isResarchSimulating && (
          <>
            {!loadingResearchHistory && (
              <div className="absolute bottom-[0.7rem] left-0 w-full px-2 sm:px-0">
                <ChatInput />
              </div>
            )}
          </>
        )}

        {/* join the beta list footer cta for research only now */}
        {!isSimulating && simulationStatus === "completed" && (
          <div className="absolute bottom-0 flex w-full items-center justify-center">
            <FooterCta
              isMobile={isMobile}
              showModal={showModal}
              setShowModal={setShowModal}
            />
          </div>
        )}
      </div>
    </AgentContextProvider>
  );
}
