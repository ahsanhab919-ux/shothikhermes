/* eslint-disable react-hooks/exhaustive-deps */
import {
  ArrowLeft,
  Bot,
  Download,
  MessageCircle,
  Mic,
  Phone,
  Presentation,
  Send,
  Table,
  User,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
// New imports for 7-agent system
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useFetchLogsQuery,
  useFetchSlidesQuery,
} from "@/redux/api/presentation/presentationApi";
import { useAgentContext } from "./shared/AgentContextProvider";
import InteractiveChatMessage from "./shared/InteractiveChatMessage";
import PlanningProgressIndicator from "./shared/PlanningProgressIndicator";
import QualityValidationPanel from "./shared/QualityValidationPanel";

const NAVIGATION_ITEMS = [
  { id: "slides", label: "AI Slides", icon: Presentation, isNew: true },
  { id: "sheets", label: "AI Sheets", icon: Table, isNew: true },
  {
    id: "download",
    label: "Download For Me",
    icon: Download,
    isNew: true,
  },
  { id: "chat", label: "AI Chat", icon: MessageCircle },
  { id: "call", label: "Call For Me", icon: Phone },
  { id: "agents", label: "All Agents", icon: Users },
];

// Defines the order of phases for progress tracking.
const PHASES_ORDER = [
  "planning",
  "preferences",
  "content",
  "design",
  "validation",
];

// Helper function to determine the most recent phase based on the order.
const getLatestPhase = (completedPhasesSet) => {
  return (
    PHASES_ORDER.slice()
      .reverse()
      .find((phase) => completedPhasesSet.has(phase)) || null
  );
};

export default function AgentPage({ specificAgent, presentationId }) {
  const router = useRouter();
  const { agentType, setAgentType } = useAgentContext();
  const [chatHistory, setChatHistory] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previewTab, setPreviewTab] = useState("preview");
  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides, setTotalSlides] = useState(5);
  const [selectedNavItem, setSelectedNavItem] = useState("chat");

  // State for the presentation generation progress
  const [currentPhase, setCurrentPhase] = useState("planning");
  const [completedPhases, setCompletedPhases] = useState([]);
  const [userPreferences, setUserPreferences] = useState(null);
  const [qualityMetrics, setQualityMetrics] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [presentationBlueprint, setPresentationBlueprint] = useState(null);
  const [shouldPollLogs, setShouldPollLogs] = useState(true);

  // state for slides
  const [slideTabs, setSlideTabs] = useState({});
  const [shouldPollSlides, setShouldPollSlides] = useState(true);

  const chatEndRef = useRef(null);

  // ========== REDUX ==========
  // Fetching logs - only when we have a presentationId
  const {
    data: logsData,
    isLoading: logsLoading,
    error: logsError,
  } = useFetchLogsQuery(presentationId, {
    skip: !presentationId,
    pollingInterval: shouldPollLogs ? 5000 : 0, // Poll every 5 seconds
  });

  useEffect(() => {
    if (logsData?.status === "completed" || logsData?.status === "failed") {
      setShouldPollLogs(false);
    }
  }, [logsData?.status]);

  // Filter logs for chat display, excluding browser and slide generator outputs.
  const realLogs =
    logsData?.data?.filter(
      (log) =>
        log.agent_name !== "browser_agent" &&
        log.agent_name !== "slide_generator_agent" &&
        log.parsed_output,
    ) || [];

  // Fetch slides - only when we have a presentationId
  const {
    data: slidesData,
    isLoading: slidesLoading,
    error: slidesError,
  } = useFetchSlidesQuery(presentationId, {
    skip: !presentationId,
    pollingInterval: shouldPollSlides ? 10000 : 0, // Poll every 10 seconds when status is processing
  });

  useEffect(() => {
    if (slidesData?.status === "completed" || slidesData?.status === "failed") {
      setShouldPollSlides(false);
    }
  }, [slidesData?.status]);

  const currentAgentType = specificAgent || agentType;

  useEffect(() => {
    if (specificAgent && specificAgent !== agentType) {
      setAgentType(specificAgent);
    }
  }, [specificAgent, agentType, setAgentType]);

  useEffect(() => {
    if (currentAgentType === "presentation") {
      setSelectedNavItem("slides");
    } else {
      setSelectedNavItem("chat");
    }
  }, [currentAgentType]);

  // --- New `useEffect` for processing real-time logs ---
  useEffect(() => {
    if (logsData?.data?.length > 0) {
      const completed = new Set();
      let newBlueprint = null;

      logsData.data.forEach((log) => {
        // Phase 1: Planning & Analysis
        if (
          [
            "presentation_spec_extractor_agent",
            "vibe_estimator_agent",
            "planning_agent",
          ].includes(log.agent_name)
        ) {
          completed.add("planning");
        }

        // Phase 3: Content Generation
        if (
          [
            "keyword_research_agent",
            "search_query",
            "content_synthesizer_agent",
          ].includes(log.agent_name)
        ) {
          completed.add("planning"); // Prerequisite
          completed.add("preferences"); // Inferred completion
          completed.add("content");
        }

        // Phase 4: Design & Media
        if (log.agent_name === "slide_generator_agent") {
          completed.add("planning");
          completed.add("preferences");
          completed.add("content");
          completed.add("design");
        }

        // Extract blueprint details from the planning_agent log
        if (log.agent_name === "planning_agent" && log.parsed_output) {
          try {
            const parsed = JSON.parse(log.parsed_output);
            newBlueprint = {
              slideCount: parsed.slides.length,
              duration: "N/A", // Duration is not available in the logs
              structure: `Generated a ${parsed.slides.length}-slide plan.`,
            };
          } catch (e) {
            console.error(
              "Could not parse blueprint from planning_agent log",
              e,
            );
          }
        }
      });

      // Check for the final completion message from the logs
      const lastLog = logsData.data[logsData.data.length - 1];
      if (lastLog?.parsed_output.includes("The presentation is complete")) {
        // Mark all phases, including validation, as complete
        PHASES_ORDER.forEach((p) => completed.add(p));
        setIsLoading(false); // Stop the main loading indicator
      }

      setCompletedPhases(Array.from(completed));
      const latestPhase = getLatestPhase(completed);

      // Update current phase, marking 'completed' if validation is done
      setCurrentPhase(latestPhase === "validation" ? "completed" : latestPhase);

      if (newBlueprint) {
        setPresentationBlueprint(newBlueprint);
      }
    }
  }, [logsData]);

  // Process initial prompt from sessionStorage
  useEffect(() => {
    const initialPrompt = sessionStorage.getItem("initialPrompt");
    if (initialPrompt && specificAgent) {
      sessionStorage.removeItem("initialPrompt");
      setInputValue(initialPrompt);
      // Auto-send the initial prompt
      setTimeout(() => {
        handleSend(initialPrompt);
      }, 500);
    }
  }, [specificAgent]);

  useEffect(() => {
    const handleResize = () => {
      if (chatEndRef.current) {
        setTimeout(() => {
          chatEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }, 100);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSlideTabChange = (slideIndex, newValue) => {
    setSlideTabs((prev) => ({
      ...prev,
      [slideIndex]: newValue,
    }));
  };

  const handleSend = async (promptText) => {
    const prompt = promptText || inputValue;
    if (!prompt.trim() || isLoading) return;

    // NOTE: We only add the user's message to a local chat history for display.
    // The agent's responses are rendered directly from the `realLogs`.
    const newMessage = {
      id: Date.now(),
      sender: "user",
      content: prompt,
      timestamp: new Date(),
    };

    setChatHistory((prev) => [...prev, newMessage]);
    setInputValue("");
    setIsLoading(true);

    // In a real application, this is where you would make the API call
    // to START the presentation generation with the user's prompt.
    // Since this component uses polling via `useFetchLogsQuery` based on
    // a `presentationId`, we assume the generation is triggered elsewhere,
    // and the polling will automatically pick up the logs.
  };

  const handleNavItemClick = (itemId) => {
    setSelectedNavItem(itemId);
    if (itemId === "slides") {
      router.push("/agents/presentation");
    } else if (itemId === "chat") {
      router.push("/agents/super");
    }
  };

  const handleApplyAutoFixes = () => {
    // This can be wired to a future API call for auto-fixing
  };

  const handleRegenerateWithFeedback = () => {
    // This can be wired to a future API call for regeneration
  };

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      {/* Fixed Header */}
      <div className="bg-background fixed top-0 right-0 left-0 z-[1001] flex h-20 items-center border-b shadow-sm">
        <div className="mx-auto flex h-full w-full max-w-6xl items-center px-4">
          <div className="flex w-full items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/agents")}
              className="text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="from-primary to-primary/60 flex-1 bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent">
              Shothik{" "}
              {currentAgentType === "presentation" ? "Presentation" : "Super"}{" "}
              Agent
            </h1>
            <div className="bg-primary h-2 w-2 animate-pulse rounded-full" />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="mt-20 mb-[140px] flex h-[calc(100vh-220px)] flex-1 overflow-hidden">
        {/* Left Side - Chat Area */}
        <div className="relative flex h-full max-h-screen flex-1 flex-col overflow-y-auto md:border-r">
          {/* Planning Progress - now driven by real data */}
          {currentAgentType === "presentation" &&
            (logsData?.data?.length > 0 || isLoading) && (
              <div className="bg-muted sticky top-0 z-[100] flex-shrink-0 border-b p-4">
                <PlanningProgressIndicator
                  currentPhase={currentPhase}
                  completedPhases={completedPhases}
                  estimatedTimeRemaining={
                    isLoading ? "Processing..." : "Completed"
                  }
                />
              </div>
            )}

          {/* Chat Messages */}
          <div className="bg-muted [&::-webkit-scrollbar-track]:bg-muted [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/30 relative h-full flex-1 overflow-x-hidden overflow-y-auto scroll-smooth [scrollbar-color:hsl(var(--muted-foreground)/0.2)_hsl(var(--muted))] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-track]:rounded">
            <div className="flex min-h-full flex-col p-6">
              {chatHistory.length === 0 && realLogs.length === 0 && (
                <div className="flex min-h-[400px] flex-1 flex-col items-center justify-center text-center">
                  <div className="bg-primary/10 mb-6 flex size-20 items-center justify-center rounded-2xl">
                    <Bot className="text-primary h-10 w-10" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">
                    {currentAgentType === "presentation"
                      ? "Presentation Agent"
                      : "Super Agent"}
                  </h3>
                  <p className="text-muted-foreground max-w-sm text-sm">
                    Start a conversation to create something amazing.
                    Type your prompt below to get started.
                  </p>
                </div>
              )}

              {/* Display user's sent messages */}
              {chatHistory.map((message) => (
                <InteractiveChatMessage key={message.id} message={message} />
              ))}

              {realLogs.length > 0 && (
                <div className="mt-4 space-y-3 pb-10">
                  {realLogs.map((log, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2.5"
                    >
                      <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-full">
                        <Bot className="text-primary h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="bg-card rounded-2xl rounded-tl-sm border px-5 py-4 shadow-sm">
                          <div className="text-muted-foreground mb-1.5 flex items-center gap-2 text-xs">
                            <span className="font-medium capitalize">
                              {log.agent_name?.replace(/_/g, " ")}
                            </span>
                            <span className="text-muted-foreground/50">·</span>
                            <span>
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-foreground text-sm leading-relaxed break-words whitespace-pre-wrap">
                            {log.parsed_output}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isLoading && (
                <div className="flex items-center justify-center p-4">
                  <Spinner className="h-6 w-6" />
                  <p className="ml-4">Processing...</p>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>
        </div>

        {/* Right Side - Preview Panel */}
        <div className="bg-background [&::-webkit-scrollbar-track]:bg-muted [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/30 sticky top-5 hidden h-[calc(100vh-80px)] flex-col overflow-y-auto [scrollbar-color:hsl(var(--muted-foreground)/0.2)_hsl(var(--muted))] [scrollbar-width:thin] md:flex md:w-[40%] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-track]:rounded">
          {/* Preview Content */}
          <div className="flex-1">
            <div className="min-h-full p-6 pb-12">
              {previewTab === "preview" && (
                <div>
                  {currentAgentType === "presentation" ? (
                    <>
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-semibold">
                          Your Presentation
                        </h2>
                        <p className="text-muted-foreground">
                          {slidesData?.data?.length || 0} slides
                        </p>
                      </div>

                      {slidesLoading ? (
                        <div className="flex justify-center p-8">
                          <Spinner className="h-8 w-8" />
                        </div>
                      ) : slidesData?.data?.length > 0 ? (
                        <>
                          <div>
                            {slidesData?.data.map((slide, index) => {
                              // Default to 'preview' tab if no specific tab is set for this slide
                              const activeSlideTab =
                                slideTabs[index] || "preview";

                              return (
                                <Card
                                  key={slide.slide_index}
                                  className="mb-6 overflow-hidden shadow-md"
                                >
                                  <CardContent className="p-0">
                                    {/* Tabs for each individual slide */}
                                    <Tabs
                                      value={activeSlideTab}
                                      onValueChange={(newValue) =>
                                        handleSlideTabChange(index, newValue)
                                      }
                                      aria-label={`Tabs for slide ${index + 1}`}
                                    >
                                      <div className="bg-muted border-b px-4">
                                        <TabsList className="bg-transparent">
                                          <TabsTrigger value="preview">
                                            Preview
                                          </TabsTrigger>
                                          <TabsTrigger value="thinking">
                                            Thinking
                                          </TabsTrigger>
                                          <TabsTrigger value="code">
                                            Code
                                          </TabsTrigger>
                                        </TabsList>
                                      </div>

                                      {/* Conditional content based on the active tab for this slide */}
                                      <div className="p-4">
                                        <TabsContent
                                          value="preview"
                                          className="m-0"
                                        >
                                          <div className="relative h-[300px] w-full">
                                            <iframe
                                              srcDoc={slide.body}
                                              className="pointer-events-none absolute top-0 left-0 block border-none"
                                              style={{
                                                width: "333.33%",
                                                height: "333.33%",
                                                transform: "scale(0.3)",
                                                transformOrigin: "top left",
                                              }}
                                              title={`Slide ${slide.slide_index + 1}`}
                                            />
                                          </div>
                                        </TabsContent>
                                        <TabsContent
                                          value="thinking"
                                          className="m-0"
                                        >
                                          <div className="bg-muted max-h-[300px] min-h-[300px] overflow-y-auto rounded-md p-4">
                                            <p className="text-muted-foreground text-sm">
                                              {slide?.thought}
                                            </p>
                                          </div>
                                        </TabsContent>
                                        <TabsContent
                                          value="code"
                                          className="m-0"
                                        >
                                          <div className="min-h-[300px]">
                                            <pre className="bg-muted text-foreground max-h-[300px] overflow-auto rounded-lg border p-4">
                                              <code>{`\n${slide.body}`}</code>
                                            </pre>
                                          </div>
                                        </TabsContent>
                                      </div>
                                    </Tabs>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <Card className="bg-muted mb-8 flex h-[400px] items-center justify-center border shadow-sm">
                          <CardContent className="text-center">
                            <h3 className="text-primary mb-4 text-3xl font-semibold">
                              Your Presentation Title
                            </h3>
                            <p className="text-muted-foreground text-lg">
                              Generated slides will appear here
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  ) : (
                    <div className="mt-16 text-center">
                      <p className="text-muted-foreground">
                        Agent output will appear here
                      </p>
                    </div>
                  )}
                </div>
              )}

              {previewTab === "blueprint" && (
                <div className="pb-8">
                  {presentationBlueprint ? (
                    <Card>
                      <CardContent>
                        <h3 className="mb-4 text-xl font-semibold">
                          Presentation Blueprint
                        </h3>
                        <p className="mb-2">
                          <strong>Slides:</strong>{" "}
                          {presentationBlueprint.slideCount}
                        </p>
                        <p className="mb-2">
                          <strong>Duration:</strong>{" "}
                          {presentationBlueprint.duration}
                        </p>
                        <p>
                          <strong>Structure:</strong>{" "}
                          {presentationBlueprint.structure}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <p className="text-muted-foreground">
                      Blueprint will appear after planning phase is complete.
                    </p>
                  )}
                </div>
              )}

              {previewTab === "quality" && (
                <div className="pb-8">
                  {completedPhases.includes("validation") ? (
                    <QualityValidationPanel
                      qualityMetrics={qualityMetrics} // This remains null as it's not in logs
                      validationResult={validationResult} // Also null
                      isValidating={isValidating}
                      onApplyAutoFixes={handleApplyAutoFixes}
                      onRegenerateWithFeedback={handleRegenerateWithFeedback}
                    />
                  ) : (
                    <p className="text-muted-foreground">
                      Quality metrics will appear after the validation phase.
                    </p>
                  )}
                </div>
              )}

              {previewTab === "preferences" && (
                <div className="pb-8">
                  <p className="text-muted-foreground">
                    This phase is automatically inferred during content
                    generation.
                  </p>
                </div>
              )}

              {previewTab === "code" && (
                <div className="pb-8">
                  <pre className="bg-muted text-foreground overflow-auto rounded-lg border p-4">
                    <code>
                      {`// Code view reflects the latest state
const presentationState = {
  presentationId: "${presentationId}",
  currentPhase: "${currentPhase}",
  completedPhases: ${JSON.stringify(completedPhases)},
  blueprint: ${JSON.stringify(presentationBlueprint, null, 2)},
  slidesAvailable: ${slidesData?.data?.length || 0}
};`}
                    </code>
                  </pre>
                </div>
              )}

              {previewTab === "thinking" && (
                <div className="pb-8">
                  <p className="text-muted-foreground mb-2 text-sm">
                    <strong>Current Phase:</strong> {currentPhase}
                  </p>
                  <p className="text-muted-foreground mb-2 text-sm">
                    <strong>Completed:</strong> {completedPhases.join(", ")}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    The system is processing your request using multiple agents.
                    The progress bar above reflects the current status based on
                    agent activity.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Input Area */}
      <div className="bg-background fixed right-0 bottom-0 left-0 z-[1002] border-t py-4 shadow-[0_-2px_8px_rgba(0,0,0,0.1)]">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="bg-muted rounded-2xl border p-6 shadow-md">
            <div className="mb-4 flex items-center gap-4">
              <Textarea
                className="placeholder:text-muted-foreground flex-1 resize-none border-none bg-transparent text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder={
                  currentAgentType === "presentation"
                    ? "Create a presentation about..."
                    : "Ask anything, create anything..."
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={4}
              />
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-primary"
              >
                <Mic className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-primary hover:bg-primary/10"
              >
                <User className="mr-2 h-4 w-4" />
                Personalize
              </Button>
              <Button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
                className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground h-10 w-10"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
