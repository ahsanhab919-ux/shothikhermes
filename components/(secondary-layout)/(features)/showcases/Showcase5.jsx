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

const MetaAutomationAgent = () => {
  const [position, setPosition] = useState({ x: 0, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const windowRef = useRef(null);

  const [agentStage, setAgentStage] = useState(0);
  const [showModal, setShowModal] = useState(true);
  const [productLink, setProductLink] = useState("");

  // How long each phase should be visible (ms)
  const PHASE_DELAY_MS = 6000; // 6 seconds per phase

  const stages = [
    {
      title: "Product Analysis",
      description: "Extracting product data and competitor landscape",
      progress: 15,
    },
    {
      title: "AI Personas & Campaigns",
      description: "Generating targeted personas and campaign structure",
      progress: 30,
    },
    {
      title: "Vibe Canvas - Ad Creatives",
      description: "Creating compelling ad copy and variations",
      progress: 50,
    },
    {
      title: "Media Canvas Generation",
      description: "Generating UGC, influencers, and content formats",
      progress: 70,
    },
    {
      title: "Campaign Launch",
      description: "Publishing to Facebook with targeting configuration",
      progress: 90,
    },
    {
      title: "Dashboard & Optimization",
      description: "Live insights, mindmap learning, and AI suggestions",
      progress: 100,
    },
  ];

  const exampleLinks = [
    "Analyze my SaaS product",
    "Create campaign for e-commerce",
    "Launch new app ads",
  ];

  const productData = {
    name: "CloudSync Pro",
    price: "$99/month",
    features: ["Real-time sync", "Team collaboration", "Enterprise security"],
    competitors: ["Dropbox Business", "Google Workspace", "Microsoft OneDrive"],
  };

  const personas = [
    {
      name: "Sarah Chen",
      role: "Tech Startup Founder",
      painPoint: "Team data fragmentation",
      budget: "$2000/mo",
    },
    {
      name: "Marcus Johnson",
      role: "Marketing Manager",
      painPoint: "Collaboration delays",
      budget: "$5000/mo",
    },
    {
      name: "Alex Rivera",
      role: "Enterprise CTO",
      painPoint: "Security compliance",
      budget: "$10000/mo",
    },
  ];

  const adCopies = [
    {
      headline: "Sync faster than ever",
      cta: "Start Free Trial",
      focus: "Speed",
    },
    {
      headline: "Teams that sync, win",
      cta: "Join 5000+ teams",
      focus: "Social proof",
    },
    {
      headline: "Enterprise security, simple interface",
      cta: "Schedule demo",
      focus: "Security",
    },
  ];

  const contentTypes = [
    {
      type: "Problem",
      desc: "Show the pain point",
      sample: "Scattered files across tools?",
    },
    {
      type: "Solution",
      desc: "Present your product",
      sample: "One unified workspace",
    },
    {
      type: "Testimonial",
      desc: "Customer success story",
      sample: '"Saved us 10 hours/week"',
    },
    {
      type: "Product Demo",
      desc: "Show features in action",
      sample: "30-sec walkthrough",
    },
    {
      type: "Before/After",
      desc: "Transform perspective",
      sample: "Chaos → Organization",
    },
    {
      type: "UGC",
      desc: "User-generated content",
      sample: "Authentic use cases",
    },
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

  // Advance stages but allow each phase to be visible for PHASE_DELAY_MS.
  // Uses a timeout that reschedules on agentStage change so each phase
  // stays visible for the configured duration. Pauses when modal is closed.
  useEffect(() => {
    if (!showModal) return; // pause when modal is closed

    const timer = setTimeout(() => {
      setAgentStage((prev) => (prev + 1) % stages.length);
    }, PHASE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [agentStage, showModal]);

  const handleStartCampaign = () => {
    if (productLink.trim()) {
      setAgentStage(0);
    }
  };

  const renderStageContent = () => {
    switch (agentStage) {
      case 0:
        return (
          <div className="max-w-2xl space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center space-x-2">
                <Loader2 />
                <span className="text-sm font-semibold text-gray-900">
                  Analyzing product data...
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-black transition-all duration-500"
                  style={{ width: "15%" }}
                ></div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                Product Details
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Product Name:</span>
                  <span className="font-medium text-gray-900">
                    {productData.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pricing:</span>
                  <span className="font-medium text-gray-900">
                    {productData.price}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                Key Features Extracted
              </h4>
              <div className="space-y-2">
                {productData.features.map((f, i) => (
                  <div
                    key={i}
                    className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900"
                  >
                    ✓ {f}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                Competitors Identified
              </h4>
              <div className="space-y-2">
                {productData.competitors.map((c, i) => (
                  <div
                    key={i}
                    className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900"
                  >
                    {c}
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
                  Generating AI personas...
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-black transition-all duration-500"
                  style={{ width: "30%" }}
                ></div>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-gray-900">
              Generated Personas
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {personas.map((p, i) => (
                <div
                  key={i}
                  className="rounded border border-gray-200 bg-gray-50 p-3"
                >
                  <p className="text-sm font-medium text-gray-900">{p.name}</p>
                  <p className="mt-1 text-xs text-gray-600">{p.role}</p>
                  <p className="mt-2 text-xs text-gray-600">
                    Pain: {p.painPoint}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-gray-900">
                    Budget: {p.budget}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                Campaign Structure
              </h4>
              <div className="space-y-2 text-xs text-gray-700">
                <div>• 3 Campaigns created based on personas</div>
                <div>• 9 Adsets configured (3 per campaign)</div>
                <div>• Targeting: Demographics, interests, behaviors</div>
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
                  Creating ad creatives...
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-black transition-all duration-500"
                  style={{ width: "50%" }}
                ></div>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-gray-900">
              Ad Copy Variations
            </h4>
            <div className="space-y-3">
              {adCopies.map((ad, i) => (
                <div
                  key={i}
                  className="rounded border border-gray-200 bg-gray-50 p-3"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <span className="text-xs font-semibold text-gray-600 uppercase">
                      {ad.focus}
                    </span>
                    <span className="rounded bg-black px-2 py-1 text-xs text-white">
                      {ad.cta}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900">{ad.headline}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-2 text-sm font-semibold text-gray-900">
                Creative Assets
              </h4>
              <p className="mb-3 text-xs text-gray-600">
                24 ad creative variations ready
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex aspect-video items-center justify-center rounded border border-gray-200 bg-gray-100 text-xs text-gray-600"
                  >
                    Creative {i}
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
                <Loader2 />
                <span className="text-sm font-semibold text-gray-900">
                  Generating media content...
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-black transition-all duration-500"
                  style={{ width: "70%" }}
                ></div>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-gray-900">
              AI Media Canvas - Content Types
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {contentTypes.map((c, i) => (
                <div
                  key={i}
                  className="rounded border border-gray-200 bg-gray-50 p-3"
                >
                  <p className="text-sm font-semibold text-gray-900">
                    {c.type}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">{c.desc}</p>
                  <p className="mt-2 text-xs text-gray-500 italic">
                    Ex: {c.sample}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-2 text-sm font-semibold text-gray-900">
                Generated Formats
              </h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded border border-gray-200 bg-gray-50 p-2 text-center text-gray-900">
                  Images (High-res)
                </div>
                <div className="rounded border border-gray-200 bg-gray-50 p-2 text-center text-gray-900">
                  Videos (30-60s)
                </div>
                <div className="rounded border border-gray-200 bg-gray-50 p-2 text-center text-gray-900">
                  Reels & Shorts
                </div>
                <div className="rounded border border-gray-200 bg-gray-50 p-2 text-center text-gray-900">
                  Carousels
                </div>
                <div className="rounded border border-gray-200 bg-gray-50 p-2 text-center text-gray-900">
                  UGC Content
                </div>
                <div className="rounded border border-gray-200 bg-gray-50 p-2 text-center text-gray-900">
                  Story Ads
                </div>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="max-w-2xl space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center space-x-2">
                <Loader2 />
                <span className="text-sm font-semibold text-gray-900">
                  Launching campaign...
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-black transition-all duration-500"
                  style={{ width: "90%" }}
                ></div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                Campaign Configuration
              </h4>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex justify-between rounded bg-gray-50 p-2">
                  <span>Campaigns:</span>
                  <span className="font-semibold">3 Active</span>
                </div>
                <div className="flex justify-between rounded bg-gray-50 p-2">
                  <span>Adsets:</span>
                  <span className="font-semibold">9 Configured</span>
                </div>
                <div className="flex justify-between rounded bg-gray-50 p-2">
                  <span>Ad Creatives:</span>
                  <span className="font-semibold">24 Ready</span>
                </div>
                <div className="flex justify-between rounded bg-gray-50 p-2">
                  <span>Daily Budget:</span>
                  <span className="font-semibold">$100</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                Targeting Summary
              </h4>
              <div className="space-y-2 text-xs text-gray-700">
                <div>✓ Age: 25-55 years</div>
                <div>✓ Interests: Technology, Business, Productivity</div>
                <div>✓ Behaviors: Recent B2B software engagement</div>
                <div>✓ Regions: US, UK, Canada, Australia</div>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="max-w-3xl space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center space-x-2">
                <CheckCircle />
                <span className="text-sm font-semibold text-gray-900">
                  Campaign Live!
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-black"
                  style={{ width: "100%" }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded border border-gray-200 bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">2.4K</p>
                <p className="mt-1 text-xs text-gray-600">Impressions</p>
              </div>
              <div className="rounded border border-gray-200 bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">156</p>
                <p className="mt-1 text-xs text-gray-600">Clicks</p>
              </div>
              <div className="rounded border border-gray-200 bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">12</p>
                <p className="mt-1 text-xs text-gray-600">Conversions</p>
              </div>
              <div className="rounded border border-gray-200 bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">3.2x</p>
                <p className="mt-1 text-xs text-gray-600">ROAS</p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                Campaign Insights Mindmap
              </h4>
              <div className="flex h-40 items-center justify-center rounded border border-gray-200 bg-gray-50 text-xs text-gray-600">
                Interactive mindmap showing campaign learnings, patterns, and
                key insights
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                AI Optimization Suggestions
              </h4>
              <div className="space-y-2 text-xs">
                <div className="rounded border border-gray-200 bg-gray-50 p-2">
                  ✓ Increase budget on Persona 1 adset by 25% (2.8x ROAS)
                </div>
                <div className="rounded border border-gray-200 bg-gray-50 p-2">
                  ✓ Pause low-performing creative variant (0.8x ROAS)
                </div>
                <div className="rounded border border-gray-200 bg-gray-50 p-2">
                  ✓ A/B test new audience segment (Geo expansion)
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!showModal) {
    return (
      <div className="relative w-full h-[60vh] min-h-[400px] flex items-center justify-center bg-white">
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-black px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base text-white shadow-lg transition-all hover:bg-gray-800"
        >
          Open Meta Automation
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full" id="marketing-automation1">
      <div
        ref={windowRef}
        className="z-10 flex flex-col sm:flex-row rounded-xl border border-gray-200 bg-white shadow-2xl"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: "100%",
          maxWidth: "100%",
          height: "auto",
          maxHeight: "90vh",
        }}
      >
        {/* Left sidebar - Process overview */}
        <div className="w-full sm:w-80 rounded-xl sm:border-r sm:border-gray-200 bg-white border-b sm:border-b-0 border-gray-200">
          <div className="drag-handle rounded-xl border-b border-gray-200 bg-white px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                <div className="h-3 w-3 rounded-full bg-gray-400"></div>
              </div>
              <span className="text-sm text-gray-600">Meta Automation</span>
              <button className="no-drag text-sm text-gray-600 hover:text-gray-800">
                Get started
              </button>
            </div>
          </div>

          <div className="h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] overflow-y-auto p-3 sm:p-4">
            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Campaign Pipeline
                </h3>
              </div>
              <div className="space-y-2">
                {stages.map((stage, index) => (
                  <div
                    key={index}
                    role="button"
                    tabIndex={0}
                    onClick={() => setAgentStage(index)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setAgentStage(index);
                      }
                    }}
                    className={`group cursor-pointer rounded-lg p-3 shadow-sm transition-all ${
                      index <= agentStage
                        ? "border border-gray-200 bg-white hover:border-gray-300"
                        : "border border-gray-200 bg-gray-50 opacity-60"
                    } ${index === agentStage ? "ring-2 ring-black" : ""}`}
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex items-start space-x-2">
                        {index < agentStage ? (
                          <CheckCircle />
                        ) : index === agentStage ? (
                          <Loader2 />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-gray-300"></div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {stage.title}
                          </p>
                          <p className="text-xs text-gray-600">
                            {stage.description}
                          </p>
                        </div>
                      </div>
                    </div>
                    {index <= agentStage && (
                      <div>
                        <div className="h-1.5 w-full rounded-full bg-gray-200">
                          <div
                            className="h-1.5 rounded-full bg-black transition-all duration-500"
                            style={{
                              width: `${index < agentStage ? 100 : stage.progress}%`,
                            }}
                          ></div>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {Math.round(
                            index < agentStage ? 100 : stage.progress,
                          )}
                          % complete
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Main content */}
        <div className="flex flex-1 flex-col rounded-xl">
          {/* Header */}
          <div
            className="drag-handle flex cursor-grab items-center justify-between rounded-xl border-b border-gray-200 bg-white px-6 py-4 active:cursor-grabbing"
            onMouseDown={handleMouseDown}
          >
            <h2 className="text-lg font-semibold text-gray-900">
              {stages[agentStage].title}
            </h2>
            <button
              onClick={() => setShowModal(false)}
              className="no-drag rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X />
            </button>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto bg-white p-6">
            {renderStageContent()}

            {productLink && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <p className="mb-2 text-xs font-semibold text-gray-600 uppercase">
                  Product Link
                </p>
                <p className="truncate text-sm text-gray-900">{productLink}</p>
              </div>
            )}
          </div>

          {/* Footer input area */}
          <div className="no-drag rounded-xl border-t border-gray-200 bg-white p-4">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={productLink}
                onChange={(e) => setProductLink(e.target.value)}
                placeholder="Paste your product link..."
                className="focus:ring-opacity-20 flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-600 outline-none focus:border-black focus:ring-2 focus:ring-black"
                onKeyPress={(e) => e.key === "Enter" && handleStartCampaign()}
              />
              <button
                onClick={handleStartCampaign}
                disabled={!productLink.trim()}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Build Campaign
              </button>
            </div>
            {productLink === "" && (
              <div className="mt-3 text-xs text-gray-600">
                <p className="mb-2 font-semibold">Examples:</p>
                <div className="flex flex-wrap gap-2">
                  {exampleLinks.map((link) => (
                    <button
                      key={link}
                      onClick={() => setProductLink(link)}
                      className="rounded bg-gray-100 px-3 py-1 text-gray-900 hover:bg-gray-200"
                    >
                      {link}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Left side promotional content */}
      {/* <div className="absolute top-1/2 left-12 max-w-sm -translate-y-1/2">
        <h1 className="mb-4 text-5xl font-bold text-gray-900">
          Meta campaigns on autopilot
        </h1>
        <p className="mb-6 text-xl text-gray-600">
          From product link to live Facebook campaign with AI-generated
          creatives, optimized targeting, and real-time insights.
        </p>
        <button className="flex items-center space-x-2 text-lg font-semibold text-black transition-colors hover:text-gray-700">
          <span>Learn more</span>
          <span>→</span>
        </button>
      </div> */}
    </div>
  );
};

export default MetaAutomationAgent;