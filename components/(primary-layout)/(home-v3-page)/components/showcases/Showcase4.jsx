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

const Image = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="3" width="18" height="18" rx="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <path d="M21 15l-5-5L5 21"></path>
  </svg>
);

const FileText = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const Download = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const Shield = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

const DeepResearchAgent = () => {
  const [position, setPosition] = useState({ x: 500, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const windowRef = useRef(null);

  const [agentStage, setAgentStage] = useState(0);
  const [showModal, setShowModal] = useState(true);
  const [researchTopic, setResearchTopic] = useState("");
  const [foundImages, setFoundImages] = useState([]);

  const stages = [
    {
      title: "Processing Research Request",
      description:
        "Analyzing your investigation query and breaking it into research steps",
      icon: "🔎",
      progress: 15,
      details: "Identifying key topics, search terms, and research angles...",
    },
    {
      title: "Executing Multi-Step Searches",
      description:
        "Running comprehensive searches across multiple databases and sources",
      icon: "🌐",
      progress: 35,
      details: "Searching academic papers, articles, databases, archives...",
    },
    {
      title: "Finding & Curating Images",
      description: "Locating relevant images, diagrams, and visual evidence",
      icon: "🖼️",
      progress: 50,
      details: "Sourcing visual assets, infographics, charts, photographs...",
    },
    {
      title: "Validating Information",
      description: "Cross-referencing sources and verifying factual accuracy",
      icon: "✓",
      progress: 75,
      details:
        "Checking sources, identifying contradictions, verifying claims...",
    },
    {
      title: "Compiling Report",
      description:
        "Organizing findings into a professional, comprehensive report",
      icon: "📄",
      progress: 100,
      details:
        "Structuring content, adding citations, formatting presentation...",
    },
  ];

  const exampleTopics = [
    "Research the history and impact of renewable energy",
    "Deep dive into AI adoption trends in healthcare",
    "Investigate climate change solutions and effectiveness",
  ];

  const sampleImages = [
    { id: 1, title: "Research visualization", size: "2.4 MB" },
    { id: 2, title: "Data chart", size: "1.8 MB" },
    { id: 3, title: "Key findings", size: "3.1 MB" },
    { id: 4, title: "Timeline diagram", size: "1.5 MB" },
  ];

  const handleMouseDown = (e) => {
    if (e.target.closest(".no-drag")) return;
    if (!e.target.closest(".drag-handle")) return;

    e.preventDefault();
    setIsDragging(true);

    const rect = windowRef.current.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

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
    if (agentStage < 5) {
      const timer = setTimeout(() => {
        if (agentStage === 2) {
          setFoundImages(sampleImages);
        }
        setAgentStage(agentStage + 1);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [agentStage]);

  const handleStartResearch = () => {
    if (researchTopic.trim()) {
      setAgentStage(0);
      setFoundImages([]);
    }
  };

  if (!showModal) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <button
          onClick={() => setShowModal(true)}
          className="rounded-xl bg-black px-8 py-4 text-lg font-semibold text-white shadow-2xl transition-all hover:scale-105 hover:shadow-gray-500/30"
        >
          Open Deep Research Agent
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-50">
      {/* Subtle gradient orbs */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gray-300 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gray-400 blur-3xl"></div>
      </div>

      <div
        ref={windowRef}
        className="absolute z-10 flex overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: "1200px",
          maxWidth: "calc(100vw - 40px)",
        }}
      >
        {/* Left sidebar */}
        <div className="w-80 border-r border-gray-200 bg-gray-50">
          <div
            className="drag-handle cursor-grab border-b border-gray-200 bg-white px-4 py-3 active:cursor-grabbing"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                <div className="h-3 w-3 rounded-full bg-gray-400"></div>
              </div>
              <span className="text-sm font-semibold text-black">
                Deep Research Agent
              </span>
              <button className="no-drag text-sm text-gray-500 hover:text-black">
                ?
              </button>
            </div>
          </div>

          <div className="h-[650px] space-y-3 overflow-y-auto p-4">
            <h3 className="mb-4 text-xs font-bold tracking-widest text-gray-500 uppercase">
              Research Pipeline
            </h3>

            {stages.map((stage, index) => (
              <div
                key={index}
                className={`rounded-xl p-3 transition-all ${
                  index <= agentStage
                    ? "border border-gray-300 bg-white shadow-md"
                    : "bg-gray-100/50 opacity-60"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 text-xl">{stage.icon}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-black">
                      {index < agentStage && (
                        <CheckCircle className="mr-2 inline text-black" />
                      )}
                      {index === agentStage && (
                        <Loader2 className="mr-2 inline text-black" />
                      )}
                      {stage.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      {stage.description}
                    </p>
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

            {agentStage === 5 && (
              <div className="mt-6 rounded-xl border border-gray-300 bg-white p-4 shadow-md">
                <div className="flex items-start space-x-3">
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-black" />
                  <div>
                    <p className="text-sm font-semibold text-black">
                      Research Report Ready!
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      Your comprehensive report with validated findings and
                      visual assets is complete.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex flex-1 flex-col">
          <div
            className="drag-handle flex cursor-grab items-center justify-between border-b border-gray-200 bg-white px-6 py-4 active:cursor-grabbing"
            onMouseDown={handleMouseDown}
          >
            <div>
              <h2 className="text-lg font-bold text-black">
                Deep Research & Analysis
              </h2>
              <p className="mt-1 text-xs text-gray-600">
                From investigation to professional report automatically
              </p>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="no-drag rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-black"
            >
              <X />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
            {agentStage < 5 ? (
              <div className="max-w-2xl space-y-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
                  <div className="text-center">
                    <div className="mb-4 text-6xl">
                      {stages[agentStage].icon}
                    </div>
                    <h3 className="mb-2 text-2xl font-bold text-black">
                      {stages[agentStage].title}
                    </h3>
                    <p className="mb-6 text-gray-600">
                      {stages[agentStage].description}
                    </p>

                    <div className="space-y-4">
                      <div className="mb-2 flex justify-between text-xs text-gray-600">
                        <span>Researching</span>
                        <span>{Math.round(stages[agentStage].progress)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-black transition-all duration-1000"
                          style={{ width: `${stages[agentStage].progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-sm text-gray-800">
                        <Loader2 className="mr-2 inline text-black" />
                        {stages[agentStage].details}
                      </p>
                    </div>

                    {agentStage >= 2 && foundImages.length > 0 && (
                      <div className="mt-6 text-left">
                        <h4 className="mb-3 flex items-center space-x-2 text-sm font-semibold text-black">
                          <Image className="h-4 w-4" />
                          <span>Images & Assets Found</span>
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {foundImages.map((img, idx) => (
                            <div
                              key={idx}
                              className="flex items-center space-x-2 rounded-lg border border-gray-200 bg-white p-3"
                            >
                              <Image className="h-4 w-4 shrink-0 text-black" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium text-black">
                                  {img.title}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {img.size}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {researchTopic && (
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="mb-2 text-xs font-semibold text-gray-500 uppercase">
                      Research Topic
                    </p>
                    <p className="text-black">{researchTopic}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-3xl space-y-6">
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                  <div className="bg-black p-8 text-white">
                    <div className="mb-4 flex items-center space-x-3">
                      <FileText className="h-8 w-8" />
                      <div>
                        <h3 className="text-2xl font-bold">Research Report</h3>
                        <p className="text-sm text-gray-300">
                          Comprehensive findings & analysis
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 p-8">
                    <div>
                      <h4 className="mb-3 text-lg font-bold text-black">
                        Executive Summary
                      </h4>
                      <p className="text-sm leading-relaxed text-gray-700">
                        This comprehensive research report provides validated
                        findings across multiple sources. The investigation
                        identified 47 peer-reviewed sources, 23 industry
                        reports, and 156 data points across the topic. All
                        findings have been cross-referenced and verified for
                        accuracy.
                      </p>
                    </div>

                    <div>
                      <h4 className="mb-3 text-lg font-bold text-black">
                        Key Findings
                      </h4>
                      <ul className="space-y-2">
                        {[
                          "Finding 1: Primary research insight with supporting evidence",
                          "Finding 2: Secondary analysis with cross-referenced data",
                          "Finding 3: Comparative analysis across multiple sources",
                          "Finding 4: Validated conclusions with citation support",
                        ].map((finding, idx) => (
                          <li
                            key={idx}
                            className="flex items-start space-x-3 text-sm text-gray-700"
                          >
                            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-black" />
                            <span>{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="mb-3 flex items-center space-x-2 text-lg font-bold text-black">
                        <Image className="h-5 w-5" />
                        <span>Included Media Assets</span>
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="flex aspect-video items-center justify-center rounded-xl border border-gray-200 bg-gray-50"
                          >
                            <span className="font-medium text-gray-600">
                              Asset {i}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 rounded-xl border border-gray-300 bg-gray-50 p-4">
                      <Shield className="mt-0.5 h-5 w-5 shrink-0 text-black" />
                      <div>
                        <p className="text-sm font-semibold text-black">
                          Information Validated
                        </p>
                        <p className="mt-1 text-xs text-gray-600">
                          All findings cross-referenced across 47 sources with
                          98% consistency verified
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-black">47</p>
                        <p className="text-xs text-gray-600">Sources</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-black">156</p>
                        <p className="text-xs text-gray-600">Data Points</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-black">12</p>
                        <p className="text-xs text-gray-600">Visuals</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-black">98%</p>
                        <p className="text-xs text-gray-600">Verified</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-3">
                  <button className="flex items-center space-x-2 rounded-xl bg-black px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-gray-500/30">
                    <Download className="h-4 w-4" />
                    <span>Download Report</span>
                  </button>
                  <button
                    onClick={() => {
                      setAgentStage(0);
                      setResearchTopic("");
                      setFoundImages([]);
                    }}
                    className="rounded-xl border-2 border-black bg-white px-6 py-3 font-semibold text-black transition-all hover:bg-gray-50"
                  >
                    Research Another Topic
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="no-drag space-y-3 border-t border-gray-200 bg-white p-4">
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={researchTopic}
                  onChange={(e) => setResearchTopic(e.target.value)}
                  placeholder="What would you like to research?"
                  className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-black placeholder-gray-500 transition-all outline-none focus:border-black focus:ring-2 focus:ring-gray-200"
                  onKeyPress={(e) => e.key === "Enter" && handleStartResearch()}
                />
                <button
                  onClick={handleStartResearch}
                  disabled={!researchTopic.trim()}
                  className="rounded-xl bg-black px-6 py-2 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-gray-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  Research
                </button>
              </div>

              {researchTopic === "" && (
                <div className="px-4 text-xs text-gray-600">
                  <p className="mb-2 font-semibold">Try these examples:</p>
                  <div className="flex flex-wrap gap-2">
                    {exampleTopics.map((topic) => (
                      <button
                        key={topic}
                        onClick={() => setResearchTopic(topic)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-left text-xs text-gray-700 transition-all hover:border-black hover:bg-gray-50"
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Left side promotional content */}
      <div className="absolute top-1/2 left-12 max-w-sm -translate-y-1/2">
        <h1 className="mb-4 text-5xl font-bold text-black">
          Deep research made effortless
        </h1>
        <p className="mb-6 text-xl text-gray-700">
          Tell us what to investigate. Our agent executes multi-step searches,
          finds relevant images, validates information, and delivers a
          professional report automatically.
        </p>
        <button className="group flex items-center space-x-2 text-lg font-semibold text-black transition-all hover:text-gray-700">
          <span>Learn more</span>
          <span className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </button>
      </div>
    </div>
  );
};

export default DeepResearchAgent;
