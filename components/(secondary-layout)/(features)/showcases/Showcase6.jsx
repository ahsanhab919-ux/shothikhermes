import { useEffect, useState } from "react";

const X = (props) => (
  <svg
    {...props}
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

const CheckCircle = (props) => (
  <svg
    {...props}
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

const Loader2 = ({ className, ...props }) => (
  <svg
    {...props}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className={`${className ?? ""} animate-spin`.trim()}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
  </svg>
);

const Users = (props) => (
  <svg
    {...props}
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const Target = (props) => (
  <svg
    {...props}
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <circle cx="12" cy="12" r="6"></circle>
    <circle cx="12" cy="12" r="2"></circle>
  </svg>
);

const TrendingUp = (props) => (
  <svg
    {...props}
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="23 6 13.5 15.5 8 21"></polyline>
    <polyline points="17 7 13.5 11.5 9 17"></polyline>
    <polyline points="21 3 13.5 9.5 8 15"></polyline>
  </svg>
);

const CampaignStrategyAgent = ({ isVisible = false }) => {
  // Start the simulation immediately by default. If a parent wants to
  // control visibility before starting, pass a prop and we can adapt.
  const [agentStage, setAgentStage] = useState(0);
  const [showModal, setShowModal] = useState(true);
  const [productUrl, setProductUrl] = useState("");

  // How long each phase should be visible (ms)
  const PHASE_DELAY_MS = 6000; // 6 seconds per phase

  const stages = [
    {
      title: "Product Analysis",
      description:
        "Analyzing product features, benefits, and market positioning",
      progress: 20,
    },
    {
      title: "AI Persona Generation",
      description:
        "Creating detailed customer personas with pain points and motivations",
      progress: 40,
    },
    {
      title: "Campaign Structure",
      description: "Building awareness ladder and ad campaign architecture",
      progress: 60,
    },
    {
      title: "Creative Canvas",
      description: "Generating ad copy, visuals, and multi-format creatives",
      progress: 80,
    },
    {
      title: "Campaign Ready",
      description: "Complete campaign strategy ready for launch",
      progress: 100,
    },
  ];

  const exampleUrls = [
    "https://example.com/fitness-product",
    "https://example.com/saas-tool",
    "https://example.com/ecommerce-store",
  ];

  // Mock data for different stages
  const productAnalysis = {
    name: "FitTrack Pro",
    category: "Fitness Technology",
    price: "$99/month",
    features: [
      "AI-powered workout recommendations",
      "Real-time progress tracking",
      "Social community features",
      "Integration with fitness devices",
    ],
    competitors: ["Fitbit Premium", "MyFitnessPal", "Apple Fitness+"],
    targetMarket: "Fitness enthusiasts aged 25-45",
  };

  const personas = [
    {
      name: "Sarah Chen",
      age: "32",
      role: "Busy Professional",
      income: "$85k/year",
      painPoints: [
        "No time for gym workouts",
        "Struggles with consistency",
        "Needs efficient solutions",
      ],
      goals: ["Stay fit", "Save time", "Track progress"],
      preferredChannels: ["Instagram", "YouTube", "TikTok"],
    },
    {
      name: "Mike Johnson",
      age: "28",
      role: "Fitness Enthusiast",
      income: "$65k/year",
      painPoints: [
        "Workout plateau",
        "Needs variety in routines",
        "Wants data-driven insights",
      ],
      goals: ["Break plateau", "Optimize performance", "Compete in events"],
      preferredChannels: ["YouTube", "Reddit", "Fitness forums"],
    },
    {
      name: "Emily Rodriguez",
      age: "45",
      role: "New Mom",
      income: "$120k/household",
      painPoints: [
        "Post-pregnancy weight loss",
        "Time constraints with baby",
        "Safe exercise guidance",
      ],
      goals: ["Lose weight safely", "Build energy", "Join mom community"],
      preferredChannels: ["Facebook Groups", "Instagram", "Pinterest"],
    },
  ];

  const awarenessLadder = {
    TOF: {
      title: "Top of Funnel",
      description: "Problem awareness stage",
      adTypes: [
        "Educational content",
        "Thought-provoking questions",
        "Statistics",
      ],
      examples: [
        "Did you know 80% of busy professionals skip workouts?",
        "The real reason your fitness progress stalled",
        "3 mistakes killing your workout efficiency",
      ],
    },
    MOF: {
      title: "Middle of Funnel",
      description: "Solution awareness stage",
      adTypes: ["How-to demos", "Product explanations", "Benefit showcases"],
      examples: [
        "How to stay fit with a 60-hour work week",
        "20-minute workouts that actually work",
        "AI-powered fitness tracking explained",
      ],
    },
    BOF: {
      title: "Bottom of Funnel",
      description: "Conversion ready stage",
      adTypes: ["Testimonials", "Case studies", "Strong CTAs"],
      examples: [
        "Join 10,000 professionals who transformed",
        "Sarah lost 15 lbs in 8 weeks with FitTrack",
        "Start your free 14-day trial today",
      ],
    },
  };

  const creativeFormats = [
    {
      name: "Short Video",
      duration: "15-30s",
      style: "Reels/TikTok format",
      count: 8,
    },
    {
      name: "Long Video",
      duration: "60-90s",
      style: "Demo/explainer",
      count: 4,
    },
    {
      name: "Static Images",
      duration: "Static",
      style: "Product shots + bold copy",
      count: 6,
    },
    {
      name: "Carousel",
      duration: "Multi-slide",
      style: "Problem → Solution flow",
      count: 3,
    },
    { name: "Stories", duration: "15s", style: "Immersive swipe-up", count: 5 },
  ];

  // Auto-advance stages with a per-phase delay. Uses functional update
  // and loops through stages indefinitely. Pauses when modal is closed.
  useEffect(() => {
    if (!showModal) return; // pause when hidden
    if (agentStage < 0) return; // not started

    const timer = setTimeout(() => {
      setAgentStage((prev) => (prev + 1) % stages.length);
    }, PHASE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [agentStage, showModal, stages.length]);

  useEffect(() => {
    if (isVisible && agentStage === -1) {
      setAgentStage(0);
    }
  }, [isVisible, agentStage]);

  useEffect(() => {
    // Start simulation immediately when component is visible
    if (isVisible && showModal && agentStage === 0) {
      const timer = setTimeout(() => setAgentStage(1), 1000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, showModal, agentStage]);

  const handleAnalyzeProduct = () => {
    if (productUrl.trim()) {
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
                  Analyzing product...
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
                Product Analysis Results
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-2 text-xs font-semibold text-gray-600 uppercase">
                    Product Details
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium text-gray-900">
                        {productAnalysis.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium text-gray-900">
                        {productAnalysis.category}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium text-gray-900">
                        {productAnalysis.price}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold text-gray-600 uppercase">
                    Key Features Extracted
                  </p>
                  <div className="space-y-1">
                    {productAnalysis.features.map((feature, i) => (
                      <div
                        key={i}
                        className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-900"
                      >
                        ✓ {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold text-gray-600 uppercase">
                  Competitors Identified
                </p>
                <div className="flex space-x-2">
                  {productAnalysis.competitors.map((competitor, i) => (
                    <span
                      key={i}
                      className="rounded border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-900"
                    >
                      {competitor}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="max-w-4xl space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center space-x-2">
                <Loader2 />
                <span className="text-sm font-semibold text-gray-900">
                  Generating AI personas...
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-black transition-all duration-1000"
                  style={{ width: "40%" }}
                ></div>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-gray-900">
              Generated Customer Personas
            </h4>
            <div className="grid grid-cols-3 gap-4">
              {personas.map((persona, i) => (
                <div
                  key={i}
                  className="rounded border border-gray-200 bg-gray-50 p-3"
                >
                  <div className="mb-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {persona.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {persona.age} • {persona.role}
                    </p>
                    <p className="text-xs text-gray-600">
                      Income: {persona.income}
                    </p>
                  </div>
                  <div className="mb-2">
                    <p className="mb-1 text-xs font-semibold text-gray-600 uppercase">
                      Pain Points
                    </p>
                    <div className="space-y-1">
                      {persona.painPoints.map((point, j) => (
                        <div key={j} className="text-xs text-gray-700">
                          • {point}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold text-gray-600 uppercase">
                      Goals
                    </p>
                    <div className="space-y-1">
                      {persona.goals.map((goal, j) => (
                        <div key={j} className="text-xs text-gray-700">
                          • {goal}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="mb-1 text-xs font-semibold text-gray-600 uppercase">
                      Preferred Channels
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {persona.preferredChannels.map((channel, j) => (
                        <span
                          key={j}
                          className="rounded bg-black px-2 py-0.5 text-xs text-white"
                        >
                          {channel}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
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
                  Building campaign structure...
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-black transition-all duration-1000"
                  style={{ width: "60%" }}
                ></div>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-gray-900">
              Awareness Ladder Campaign Structure
            </h4>
            <div className="space-y-3">
              {Object.entries(awarenessLadder).map(([stage, data]) => (
                <div
                  key={stage}
                  className="rounded border border-gray-200 bg-gray-50 p-3"
                >
                  <div className="mb-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {data.title} ({stage})
                    </p>
                    <p className="text-xs text-gray-600">{data.description}</p>
                  </div>
                  <div className="mb-2">
                    <p className="mb-1 text-xs font-semibold text-gray-600 uppercase">
                      Ad Types
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {data.adTypes.map((type, i) => (
                        <span
                          key={i}
                          className="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-700"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold text-gray-600 uppercase">
                      Example Hooks
                    </p>
                    <div className="space-y-1">
                      {data.examples.map((example, i) => (
                        <div key={i} className="text-xs text-gray-700 italic">
                          "{example}"
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
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
                  Generating creative assets...
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-black transition-all duration-1000"
                  style={{ width: "80%" }}
                ></div>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-gray-900">
              Creative Canvas - Multi-Format Assets
            </h4>
            <div className="grid grid-cols-5 gap-3">
              {creativeFormats.map((format, i) => (
                <div
                  key={i}
                  className="rounded border border-gray-200 bg-gray-50 p-3 text-center"
                >
                  <div className="mb-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {format.name}
                    </p>
                    <p className="text-xs text-gray-600">{format.duration}</p>
                    <p className="text-xs text-gray-600">{format.style}</p>
                  </div>
                  <div className="mt-2">
                    <div className="rounded bg-black px-2 py-1 text-xs text-white">
                      {format.count} creatives
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h5 className="mb-3 text-sm font-semibold text-gray-900">
                AI Creative Generation Status
              </h5>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Short Videos (Reels)</span>
                  <span className="rounded bg-green-100 px-2 py-0.5 text-green-700">
                    8/8 Complete
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Long Videos (Demos)</span>
                  <span className="rounded bg-green-100 px-2 py-0.5 text-green-700">
                    4/4 Complete
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Static Images</span>
                  <span className="rounded bg-yellow-100 px-2 py-0.5 text-yellow-700">
                    4/6 In Progress
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Carousel Ads</span>
                  <span className="rounded bg-yellow-100 px-2 py-0.5 text-yellow-700">
                    2/3 In Progress
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="max-w-3xl space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center space-x-2">
                <CheckCircle />
                <span className="text-sm font-semibold text-gray-900">
                  Campaign Strategy Complete!
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
                <p className="text-2xl font-bold text-gray-900">3</p>
                <p className="mt-1 text-xs text-gray-600">AI Personas</p>
              </div>
              <div className="rounded border border-gray-200 bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">26</p>
                <p className="mt-1 text-xs text-gray-600">Total Creatives</p>
              </div>
              <div className="rounded border border-gray-200 bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">5</p>
                <p className="mt-1 text-xs text-gray-600">Format Types</p>
              </div>
              <div className="rounded border border-gray-200 bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">100%</p>
                <p className="mt-1 text-xs text-gray-600">Ready</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h5 className="mb-3 text-sm font-semibold text-gray-900">
                Campaign Architecture Summary
              </h5>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <Target className="mt-0.5 h-5 w-5 shrink-0 text-black" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Multi-Persona Targeting
                    </p>
                    <p className="text-xs text-gray-600">
                      3 personas covering different demographics and pain points
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="mt-0.5 h-5 w-5 shrink-0 text-black" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Awareness Ladder Structure
                    </p>
                    <p className="text-xs text-gray-600">
                      TOF → MOF → BOF funnel for maximum conversion
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-black" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Creative Diversification
                    </p>
                    <p className="text-xs text-gray-600">
                      26 creatives across 5 formats to prevent fatigue
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-center gap-3">
              <button className="flex items-center space-x-2 rounded-lg bg-black px-6 py-2 font-medium text-white transition-colors hover:bg-gray-800">
                <span>Launch Campaign</span>
              </button>
              <button className="rounded-lg border border-gray-300 bg-white px-6 py-2 font-medium text-gray-900 transition-colors hover:bg-gray-50">
                Export Strategy
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
          Open Campaign Strategy Agent
        </button>
      </div>
    );
  }

  return (
    <div
      className="relative h-full min-h-[600px] w-full"
      id="marketing-automation2"
    >
      <div className="mx-auto max-w-6xl rounded-xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex h-full min-h-[600px] rounded-xl bg-white">
          {/* Left sidebar - Campaign Structure */}
          <div className="w-80 rounded-xl border-r border-gray-200 bg-gray-50">
            <div className="rounded-xl border-b border-gray-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                  <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                  <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                </div>
                <span className="text-sm font-semibold text-black">
                  Campaign Strategy Agent
                </span>
                <button className="text-sm text-gray-500 hover:text-black">
                  ?
                </button>
              </div>
            </div>

            <div className="h-[650px] space-y-3 overflow-y-auto p-4">
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-bold tracking-wider text-gray-500 uppercase">
                    Strategy Pipeline
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
                      aria-current={index === agentStage}
                      className={`group cursor-pointer rounded-lg p-3 transition-all ${
                        index <= agentStage
                          ? "border border-gray-300 bg-white shadow-md"
                          : "border border-gray-200 bg-gray-50 opacity-60"
                      } ${index === agentStage ? "ring-2 ring-black" : ""}`}
                    >
                      <div className="flex items-start space-x-2">
                        {index < agentStage ? (
                          <CheckCircle />
                        ) : index === agentStage ? (
                          <Loader2 />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-gray-300"></div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {stage.title}
                          </p>
                          <p className="mt-1 text-xs text-gray-600">
                            {stage.description}
                          </p>
                        </div>
                      </div>
                      {index <= agentStage && (
                        <div className="mt-2">
                          <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-full rounded-full bg-black transition-all duration-1000"
                              style={{
                                width: `${
                                  index < agentStage ? 100 : stage.progress
                                }%`,
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

              {agentStage === 4 && (
                <div className="mt-6 rounded-lg border border-gray-300 bg-white p-4 shadow-md">
                  <div className="flex items-start space-x-3">
                    <Users className="mt-0.5 h-5 w-5 shrink-0 text-black" />
                    <div>
                      <p className="text-sm font-semibold text-black">
                        Campaign Strategy Ready
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        Complete strategy with personas and creatives
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Main content */}
          <div className="flex flex-1 flex-col rounded-xl">
            {/* Header */}
            <div className="flex items-center justify-between rounded-xl border-b border-gray-200 bg-white px-6 py-4">
              <h2 className="text-lg font-bold text-black">
                AI-Powered Campaign Strategy
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X />
              </button>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
              {renderStageContent()}

              {productUrl && (
                <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="mb-2 text-xs font-semibold text-gray-600 uppercase">
                    Product URL
                  </p>
                  <p className="truncate text-sm text-gray-900">{productUrl}</p>
                </div>
              )}
            </div>

            {/* Footer input area */}
            <div className="space-y-3 rounded-xl border-t border-gray-200 bg-white p-4">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                    placeholder="Enter your product URL..."
                    className="focus:ring-opacity-20 flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-black placeholder-gray-600 outline-none focus:border-black focus:ring-2 focus:ring-gray-200"
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleAnalyzeProduct()
                    }
                  />
                  <button
                    onClick={handleAnalyzeProduct}
                    disabled={!productUrl.trim()}
                    className="rounded-lg bg-black px-6 py-2 font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Analyze Product
                  </button>
                </div>
                {productUrl === "" && (
                  <div className="px-4 text-xs text-gray-600">
                    <p className="mb-2 font-semibold">Try these examples:</p>
                    <div className="flex flex-wrap gap-2">
                      {exampleUrls.map((url) => (
                        <button
                          key={url}
                          onClick={() => setProductUrl(url)}
                          className="rounded bg-gray-100 px-3 py-1 text-left text-xs text-gray-900 transition-colors hover:bg-gray-200"
                        >
                          {url}
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
    </div>
  );
};

export default CampaignStrategyAgent;