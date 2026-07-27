import { useEffect, useRef, useState } from "react";

const X = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const CheckCircle = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

const Loader2 = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="animate-spin"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
  </svg>
);

const Sparkles = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
  </svg>
);

const SlideGenAgent = () => {
  const [position, setPosition] = useState({ x: 500, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const windowRef = useRef(null);
  const [agentStage, setAgentStage] = useState(0);
  const [showModal, setShowModal] = useState(true);
  const [userPrompt, setUserPrompt] = useState("");
  const PHASE_DELAY_MS = 6000; // 6 seconds per phase

  const stages = [
    {
      title: "Parse Requirements & Intent",
      desc: "Analyzing your query for optimal structure",
      progress: 20,
    },
    {
      title: "Search & Gather Content",
      desc: "Researching and extracting key information",
      progress: 40,
    },
    {
      title: "Plan Slide Layout",
      desc: "Organizing content into slide structure",
      progress: 70,
    },
    {
      title: "Generate Presentation",
      desc: "Creating and finalizing your presentation",
      progress: 100,
    },
  ];

  const examplePrompts = [
    "Create a presentation about AI in healthcare",
    "Generate slides for a startup pitch deck",
    "Make a presentation on climate change solutions",
  ];

  // Mock data for requirements
  const requirements = {
    numSlides: "8-10 slides recommended",
    colorScheme: [
      { name: "Modern Blue", colors: ["#0F172A", "#3B82F6", "#FFFFFF"] },
      { name: "Professional Gray", colors: ["#1F2937", "#6B7280", "#FFFFFF"] },
      { name: "Warm Orange", colors: ["#7C2D12", "#F97316", "#FFFFFF"] },
    ],
    topic: "Business / Technology",
    intent: "Inform & Educate",
    audience: "Business professionals & Tech enthusiasts",
  };

  const searchQueries = [
    "AI healthcare applications 2024",
    "Healthcare AI market size statistics",
    "AI diagnostic tools and use cases",
    "Healthcare AI implementation challenges",
  ];

  const searchResults = [
    {
      source: "Healthcare AI Report 2024",
      fact: "AI market in healthcare projected to reach $67.4B by 2027",
      relevance: 98,
    },
    {
      source: "McKinsey Healthcare Study",
      fact: "55% of healthcare organizations have deployed AI solutions",
      relevance: 96,
    },
    {
      source: "WHO Digital Health Report",
      fact: "AI can improve diagnostic accuracy by up to 94%",
      relevance: 94,
    },
  ];

  const slidePlan = [
    {
      slide: 1,
      type: "Title Slide",
      content: "Title + Subtitle + Company Logo",
    },
    {
      slide: 2,
      type: "Problem Statement",
      content: "Healthcare challenges - 3 key pain points",
    },
    {
      slide: 3,
      type: "Market Opportunity",
      content: "$67.4B market opportunity by 2027",
    },
    {
      slide: 4,
      type: "Solution Overview",
      content: "How AI transforms healthcare",
    },
    {
      slide: 5,
      type: "Use Cases",
      content: "3-4 real-world AI healthcare applications",
    },
    {
      slide: 6,
      type: "Statistics & Results",
      content: "55% adoption rate, 94% diagnostic accuracy",
    },
    {
      slide: 7,
      type: "Implementation",
      content: "Integration process and benefits",
    },
    {
      slide: 8,
      type: "Call-to-Action",
      content: "Next steps and contact information",
    },
  ];

  const handleMouseDown = (e) => {
    if (e.target.closest(".no-drag")) return;
    if (!e.target.closest(".drag-handle")) return;
    e.preventDefault();
    setIsDragging(true);
    const rect = windowRef.current.getBoundingClientRect();
    setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging, dragStart]);

  useEffect(() => {
    if (!showModal) return;
    if (agentStage < 0) return;

    const timer = setTimeout(() => {
      setAgentStage((prev) => (prev + 1) % stages.length);
    }, PHASE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [agentStage, showModal, stages.length]);

  const handleGeneratePresentation = () => {
    if (userPrompt.trim()) {
      setAgentStage(0);
    }
  };

  const renderStageContent = () => {
    switch (agentStage) {
      case 0:
        return (
          <div className="max-w-3xl space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center space-x-2">
                <Loader2 />
                <span className="text-sm font-semibold text-gray-900">
                  Parsing your query...
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-black transition-all duration-1000"
                  style={{ width: "20%" }}
                ></div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                Extracted Requirements
              </h4>
              <div className="space-y-3">
                <div className="flex items-start justify-between rounded bg-gray-50 p-2">
                  <span className="text-xs font-medium text-gray-600">
                    Recommended Slides:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {requirements.numSlides}
                  </span>
                </div>
                <div className="flex items-start justify-between rounded bg-gray-50 p-2">
                  <span className="text-xs font-medium text-gray-600">
                    Topic Classification:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {requirements.topic}
                  </span>
                </div>
                <div className="flex items-start justify-between rounded bg-gray-50 p-2">
                  <span className="text-xs font-medium text-gray-600">
                    Presentation Intent:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {requirements.intent}
                  </span>
                </div>
                <div className="flex items-start justify-between rounded bg-gray-50 p-2">
                  <span className="text-xs font-medium text-gray-600">
                    Target Audience:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {requirements.audience}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                Selected Color Schemes
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {requirements.colorScheme.map((scheme, i) => (
                  <div key={i} className="rounded border border-gray-200 p-2">
                    <p className="mb-2 text-xs font-medium text-gray-900">
                      {scheme.name}
                    </p>
                    <div className="flex gap-1">
                      {scheme.colors.map((color, j) => (
                        <div
                          key={j}
                          className="h-6 w-6 rounded border border-gray-300"
                          style={{ backgroundColor: color }}
                        ></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="max-w-3xl space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center space-x-2">
                <Loader2 />
                <span className="text-sm font-semibold text-gray-900">
                  Searching for relevant content...
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-black transition-all duration-1000"
                  style={{ width: "40%" }}
                ></div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                Active Search Queries
              </h4>
              <div className="space-y-2">
                {searchQueries.map((query, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-2 rounded bg-gray-50 p-2 text-xs text-gray-700"
                  >
                    <Loader2 className="h-3 w-3" />
                    <span>{query}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                Extracted Key Facts & Statistics
              </h4>
              <div className="space-y-2">
                {searchResults.map((result, i) => (
                  <div
                    key={i}
                    className="rounded border border-gray-200 bg-gray-50 p-3"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <span className="text-xs font-semibold text-gray-600 uppercase">
                        {result.source}
                      </span>
                      <span className="rounded bg-black px-2 py-1 text-xs text-white">
                        {result.relevance}% relevance
                      </span>
                    </div>
                    <p className="text-sm text-gray-900">{result.fact}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="max-w-3xl space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center space-x-2">
                <Loader2 />
                <span className="text-sm font-semibold text-gray-900">
                  Planning slide structure...
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-black transition-all duration-1000"
                  style={{ width: "70%" }}
                ></div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                Presentation Structure ({slidePlan.length} slides)
              </h4>
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {slidePlan.map((slide, i) => (
                  <div
                    key={i}
                    className="flex items-start space-x-3 rounded border border-gray-200 bg-gray-50 p-2"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-black text-xs font-semibold text-white">
                      {slide.slide}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {slide.type}
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        {slide.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="max-w-3xl space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center space-x-2">
                <CheckCircle />
                <span className="text-sm font-semibold text-gray-900">
                  Presentation generated successfully!
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-black"
                  style={{ width: "100%" }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="rounded border border-gray-200 bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">8</p>
                <p className="mt-1 text-xs text-gray-600">Total Slides</p>
              </div>
              <div className="rounded border border-gray-200 bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">15</p>
                <p className="mt-1 text-xs text-gray-600">Key Facts</p>
              </div>
              <div className="rounded border border-gray-200 bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">3</p>
                <p className="mt-1 text-xs text-gray-600">Sources</p>
              </div>
              <div className="rounded border border-gray-200 bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">100%</p>
                <p className="mt-1 text-xs text-gray-600">Ready</p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                Slide Preview
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {slidePlan.slice(0, 8).map((slide) => (
                  <div
                    key={slide.slide}
                    className="flex aspect-video items-center justify-center rounded border border-gray-200 bg-gray-100 text-xs font-semibold text-gray-600"
                  >
                    {slide.type}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <button className="rounded-lg bg-black px-6 py-2 font-medium text-white transition-colors hover:bg-gray-800">
                Download Presentation
              </button>
              <button className="rounded-lg border border-gray-300 bg-white px-6 py-2 font-medium text-gray-900 transition-colors hover:bg-gray-50">
                Generate Another
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!showModal) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-black px-6 py-3 text-white shadow-lg transition-all hover:bg-gray-800"
        >
          Open Slide Gen Agent
        </button>
      </div>
    );
  }

  return (
    <div className="h-70vw relative w-full" id="ai-slides">
      <div
        ref={windowRef}
        className="flex rounded-xl border border-gray-200 bg-white shadow-2xl"
        style={{
          // left: `${position.x}px`,
          // top: `${position.y}px`,
          width: "1000px",
          maxWidth: "calc(100vw - 40px)",
        }}
      >
        {/* Left sidebar */}
        <div className="w-72 rounded-xl border-r border-gray-200 bg-white">
          <div
            className="drag-handle cursor-grab rounded-xl border-b border-gray-200 bg-white px-4 py-3 active:cursor-grabbing"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                <div className="h-3 w-3 rounded-full bg-gray-400"></div>
              </div>
              <span className="text-sm font-semibold text-gray-700">
                Slide Gen Agent
              </span>
              <button className="no-drag text-sm text-gray-600 hover:text-gray-800">
                ?
              </button>
            </div>
          </div>

          <div className="h-[650px] space-y-3 overflow-y-auto rounded-xl p-4">
            <h3 className="mb-4 text-xs font-bold tracking-widest text-gray-500 uppercase">
              Agent Pipeline
            </h3>

            {stages.map((stage, index) => (
              <div
                key={index}
                className={`rounded-lg p-3 transition-all ${
                  index <= agentStage
                    ? "border border-gray-200 bg-white shadow-sm"
                    : "border border-gray-200 bg-gray-50 opacity-60"
                }`}
              >
                <div className="flex items-start space-x-2">
                  {index < agentStage ? (
                    <CheckCircle />
                  ) : index === agentStage ? (
                    <Loader2 />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-gray-300"></div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {stage.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">{stage.desc}</p>
                    {index <= agentStage && (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-black transition-all duration-1000"
                          style={{
                            width: `${index < agentStage ? 100 : stage.progress}%`,
                          }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {agentStage === 3 && (
              <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start space-x-3">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-gray-900" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Presentation Ready!
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      Ready to download and share
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Main content */}
        <div className="flex flex-1 flex-col rounded-xl">
          <div
            className="drag-handle flex cursor-grab items-center justify-between rounded-xl border-b border-gray-200 bg-white px-6 py-4 active:cursor-grabbing"
            onMouseDown={handleMouseDown}
          >
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {stages[agentStage].title}
              </h2>
              <p className="mt-1 text-xs text-gray-600">
                {stages[agentStage].desc}
              </p>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="no-drag rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-white p-8">
            {renderStageContent()}
            {userPrompt && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <p className="mb-2 text-xs font-semibold text-gray-600 uppercase">
                  Your Prompt
                </p>
                <p className="text-gray-900">{userPrompt}</p>
              </div>
            )}
          </div>

          <div className="no-drag space-y-3 rounded-xl border-t border-gray-200 bg-white p-4">
            {userPrompt && agentStage === 3 && (
              <div className="px-4 text-xs text-gray-600">
                Try another prompt to create a new presentation
              </div>
            )}
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="Describe your presentation topic..."
                  className="focus:ring-opacity-20 flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm placeholder-gray-600 outline-none focus:border-black focus:ring-2 focus:ring-black"
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleGeneratePresentation()
                  }
                />
                <button
                  onClick={handleGeneratePresentation}
                  disabled={!userPrompt.trim()}
                  className="rounded-lg bg-black px-6 py-2 font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Generate
                </button>
              </div>
              {userPrompt === "" && (
                <div className="px-4 text-xs text-gray-600">
                  <p className="mb-2 font-semibold">Try these examples:</p>
                  <div className="flex flex-wrap gap-2">
                    {examplePrompts.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => setUserPrompt(prompt)}
                        className="rounded bg-gray-100 px-3 py-1 text-left text-xs text-gray-900 transition-colors hover:bg-gray-200"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideGenAgent;