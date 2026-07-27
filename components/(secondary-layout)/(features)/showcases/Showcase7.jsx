import { useEffect, useState } from "react";

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

const TrendingUp = () => (
  <svg
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

const DollarSign = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 1 3.5v5a3.5 3.5 0 0 1-3.5 3.5H17"></path>
    <path d="M12 12v6"></path>
  </svg>
);

const AlertTriangle = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3l-8.47-14.14a2 2 0 0 0-1.71 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
  </svg>
);

const BarChart = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="12" y1="20" x2="12" y2="10"></line>
    <line x1="18" y1="20" x2="18" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="16"></line>
  </svg>
);

const MindMap = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="3"></circle>
    <circle cx="12" cy="5" r="2"></circle>
    <circle cx="6" cy="8" r="2"></circle>
    <circle cx="18" cy="8" r="2"></circle>
    <circle cx="8" cy="16" r="2"></circle>
    <circle cx="16" cy="16" r="2"></circle>
    <line x1="12" y1="9" x2="12" y2="12"></line>
    <line x1="12" y1="12" x2="6" y2="8"></line>
    <line x1="12" y1="12" x2="18" y2="8"></line>
    <line x1="12" y1="12" x2="8" y2="16"></line>
    <line x1="12" y1="12" x2="16" y2="16"></line>
  </svg>
);

const PerformanceOptimizationAgent = ({ isVisible = false }) => {
  // Start the simulation immediately by default so it runs in all showcases.
  const [agentStage, setAgentStage] = useState(0);
  const [showModal, setShowModal] = useState(true);
  // How long each phase should be visible (ms)
  const PHASE_DELAY_MS = 6000; // 6s per phase
  const [selectedTimeWindow, setSelectedTimeWindow] = useState(null);

  const stages = [
    {
      title: "Performance Analysis",
      description: "Analyzing ROAS, CTR, and frequency metrics",
      progress: 25,
    },
    {
      title: "3-Hour Scaling Detection",
      description: "Identifying optimal scaling windows and opportunities",
      progress: 50,
    },
    {
      title: "AI Decision Making",
      description:
        "Making autonomous budget and creative optimization decisions",
      progress: 75,
    },
    {
      title: "Campaign Optimization",
      description: "Implementing changes and monitoring results",
      progress: 100,
    },
  ];

  const timeWindows = [
    { time: "9:00 AM", status: "missed", opportunity: "$1,200 lost" },
    {
      time: "12:00 PM",
      status: "active",
      opportunity: "Scaling 2x to $800/day",
    },
    {
      time: "3:00 PM",
      status: "upcoming",
      opportunity: "High ROAS window detected",
    },
    {
      time: "6:00 PM",
      status: "upcoming",
      opportunity: "Optimal for new audiences",
    },
    {
      time: "12:00 AM",
      status: "upcoming",
      opportunity: "Weekend peak period",
    },
  ];

  const performanceMetrics = {
    overview: {
      totalSpend: "$2,847",
      totalRevenue: "$12,432",
      roas: "4.37x",
      activeCampaigns: 3,
      ctr: "2.8%",
      frequency: "3.2",
    },
    campaigns: [
      {
        name: "Campaign 1 (ABOS)",
        status: "active",
        spend: "$1,234",
        revenue: "$5,678",
        roas: "4.6x",
        trend: "up",
        lastUpdate: "2 hours ago",
      },
      {
        name: "Campaign 2 (Advantage+)",
        status: "scaling",
        spend: "$987",
        revenue: "$4,234",
        roas: "4.29x",
        trend: "up",
        lastUpdate: "30 minutes ago",
      },
      {
        name: "Campaign 3 (Bid Cap)",
        status: "paused",
        spend: "$626",
        revenue: "$2,520",
        roas: "4.03x",
        trend: "down",
        lastUpdate: "5 hours ago",
      },
    ],
  };

  const aiDecisions = [
    {
      type: "Scaling Opportunity",
      campaign: "Campaign 1",
      action: "Scale budget 2x to $800/day",
      reason: "Consistent 4.6x ROAS over 6 hours",
      confidence: "92%",
      impact: "+$2,340/day projected revenue",
    },
    {
      type: "Creative Fatigue Alert",
      campaign: "Campaign 2",
      action: "Add 4 new TOF creatives",
      reason: "CTR dropped 40% over 3 days",
      confidence: "87%",
      impact: "+30% expected ROAS improvement",
    },
    {
      type: "Frequency Warning",
      campaign: "Campaign 3",
      action: "Expand audience or pause campaign",
      reason: "Frequency at 6.8 (126% above benchmark)",
      confidence: "95%",
      impact: "Prevents audience burnout",
    },
  ];

  // Auto-advance stages with a per-phase delay and loop indefinitely.
  useEffect(() => {
    if (!showModal) return; // pause when hidden
    if (agentStage < 0) return;

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

  const renderStageContent = () => {
    switch (agentStage) {
      case 0:
        return (
          <div className="max-w-4xl space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center space-x-2">
                <Loader2 />
                <span className="text-sm font-semibold text-gray-900">
                  Analyzing campaign performance...
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-black transition-all duration-1000"
                  style={{ width: "25%" }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="rounded border border-gray-200 bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {performanceMetrics.overview.totalSpend}
                </p>
                <p className="mt-1 text-xs text-gray-600">Total Spend</p>
              </div>
              <div className="rounded border border-gray-200 bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {performanceMetrics.overview.totalRevenue}
                </p>
                <p className="mt-1 text-xs text-gray-600">Total Revenue</p>
              </div>
              <div className="rounded border border-gray-200 bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {performanceMetrics.overview.roas}
                </p>
                <p className="mt-1 text-xs text-gray-600">Overall ROAS</p>
              </div>
              <div className="rounded border border-gray-200 bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {performanceMetrics.overview.activeCampaigns}
                </p>
                <p className="mt-1 text-xs text-gray-600">Active Campaigns</p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                Campaign Performance Breakdown
              </h4>
              <div className="space-y-2">
                {performanceMetrics.campaigns.map((campaign, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded border border-gray-200 bg-gray-50 p-3"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {campaign.name}
                      </p>
                      <div className="mt-1 flex items-center space-x-2">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${
                            campaign.status === "active"
                              ? "bg-green-100 text-green-700"
                              : campaign.status === "scaling"
                                ? "bg-blue-100 text-blue-700"
                                : campaign.status === "paused"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {campaign.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          Updated {campaign.lastUpdate}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        ROAS: {campaign.roas}
                      </div>
                      <div className="flex items-center justify-end space-x-2">
                        <span className="text-xs text-gray-600">
                          Spend: {campaign.spend}
                        </span>
                        {campaign.trend === "up" ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingUp className="h-4 w-4 rotate-180 text-red-600" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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
                  Detecting 3-hour scaling windows...
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-black transition-all duration-1000"
                  style={{ width: "50%" }}
                ></div>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-gray-900">
              3-Hour Surf Scaling Windows
            </h4>
            <div className="space-y-2">
              {timeWindows.map((window, i) => (
                <div
                  key={i}
                  className={`rounded border p-3 ${
                    window.status === "active"
                      ? "border-green-300 bg-green-50"
                      : window.status === "missed"
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {window.time}
                      </p>
                      <span
                        className={`ml-2 rounded px-2 py-0.5 text-xs font-medium ${
                          window.status === "active"
                            ? "bg-green-100 text-green-700"
                            : window.status === "missed"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {window.status}
                      </span>
                    </div>
                    {window.opportunity && (
                      <div className="text-right">
                        <p className="text-xs text-gray-600">Opportunity</p>
                        <p className="text-sm font-medium text-gray-900">
                          {window.opportunity}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-gray-200 bg-yellow-50 p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Scaling Window Missed
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    9:00 AM window showed 4.2x ROAS but budget was limited
                  </p>
                  <p className="text-xs text-gray-600">
                    Potential revenue lost: $1,200
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="max-w-4xl space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center space-x-2">
                <Loader2 />
                <span className="text-sm font-semibold text-gray-900">
                  Making AI optimization decisions...
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-black transition-all duration-1000"
                  style={{ width: "75%" }}
                ></div>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-gray-900">
              AI Decision Making in Progress
            </h4>
            <div className="space-y-3">
              {aiDecisions.map((decision, i) => (
                <div
                  key={i}
                  className="rounded border border-gray-200 bg-gray-50 p-3"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {decision.type}
                      </p>
                      <p className="text-xs text-gray-600">
                        {decision.campaign}
                      </p>
                    </div>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        decision.confidence >= 90
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {decision.confidence}% confidence
                    </span>
                  </div>
                  <p className="mb-2 text-xs text-gray-600">
                    Action: {decision.action}
                  </p>
                  <p className="text-xs text-gray-600">
                    Reason: {decision.reason}
                  </p>
                  <div className="mt-2 rounded bg-blue-50 p-2">
                    <p className="text-xs font-medium text-blue-700">
                      Impact: {decision.impact}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="max-w-4xl space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center space-x-2">
                <CheckCircle />
                <span className="text-sm font-semibold text-gray-900">
                  Optimization Complete!
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-black"
                  style={{ width: "100%" }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded border border-gray-200 bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-green-600">+32%</p>
                <p className="mt-1 text-xs text-gray-600">ROAS Improvement</p>
              </div>
              <div className="rounded border border-gray-200 bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">4.2x</p>
                <p className="mt-1 text-xs text-gray-600">Average ROAS</p>
              </div>
              <div className="rounded border border-gray-200 bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">98%</p>
                <p className="mt-1 text-xs text-gray-600">Automation Rate</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h5 className="mb-3 text-sm font-semibold text-gray-900">
                Optimization Summary
              </h5>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Budget Optimized: +$1,800/day efficiency
                    </p>
                    <p className="text-xs text-gray-600">
                      Through 3-hour scaling windows
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <BarChart className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Creative Refresh: 8 new ads deployed
                    </p>
                    <p className="text-xs text-gray-600">
                      Preventing audience fatigue
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Frequency Control: Maintained at 3.1 average
                    </p>
                    <p className="text-xs text-gray-600">
                      Optimal for engagement
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-gray-200 bg-blue-50 p-4">
              <div className="flex items-center space-x-2">
                <MindMap className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    MindMap Learning Active
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    AI continuously learning from optimization patterns
                  </p>
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
      <div className="flex h-screen items-center justify-center bg-white">
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-black px-6 py-3 text-white shadow-lg transition-all hover:bg-gray-800"
        >
          Open Performance Optimization Agent
        </button>
      </div>
    );
  }

  return (
    <div
      className="relative h-full min-h-[600px] w-full"
      id="marketing-automation3"
    >
      <div className="mx-auto max-w-6xl rounded-xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex h-full min-h-[600px] rounded-xl">
          {/* Left sidebar - Performance monitoring */}
          <div className="w-80 rounded-xl border-r border-gray-200 bg-gray-50">
            <div className="rounded-xl border-b border-gray-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                  <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                  <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                </div>
                <span className="text-sm font-semibold text-black">
                  Performance Optimization Agent
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
                    Optimization Pipeline
                  </h3>
                </div>
              </div>
              <div className="space-y-2">
                {stages.map((stage, index) => (
                  <div
                    key={index}
                    className={`group cursor-pointer rounded-lg p-3 transition-all ${
                      index <= agentStage
                        ? "border border-gray-300 bg-white shadow-md"
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

            {agentStage === 3 && (
              <div className="mt-6 rounded-lg border border-gray-300 bg-white p-4 shadow-md">
                <div className="flex items-start space-x-3">
                  <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-black" />
                  <div>
                    <p className="text-sm font-semibold text-black">
                      Optimization Complete
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      All campaigns optimized and monitoring active
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right side - Main content */}
          <div className="flex flex-1 flex-col rounded-xl">
            {/* Header */}
            <div className="flex items-center justify-between rounded-xl border-b border-gray-200 bg-white px-6 py-4">
              <h2 className="text-lg font-bold text-black">
                AI-Powered Performance Optimization
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
            </div>

            {/* Footer with MindMap toggle */}
            <div className="space-y-3 rounded-xl border-t border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() =>
                    setSelectedTimeWindow(
                      selectedTimeWindow ? null : timeWindows[1],
                    )
                  }
                  className="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-900 transition-colors hover:bg-gray-50"
                >
                  <BarChart className="h-4 w-4 text-gray-700" />
                  <span>View 3-Hour Scaling Windows</span>
                </button>
                <button className="flex items-center space-x-2 rounded-lg bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-gray-800">
                  <MindMap className="h-4 w-4 text-white" />
                  <span>Open MindMap Insights</span>
                </button>
              </div>

              {selectedTimeWindow && (
                <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h5 className="mb-3 text-sm font-semibold text-gray-900">
                    Scaling Window Details - {selectedTimeWindow.time}
                  </h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="mb-1 text-xs font-semibold text-gray-600 uppercase">
                        Status
                      </p>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          selectedTimeWindow.status === "active"
                            ? "bg-green-100 text-green-700"
                            : selectedTimeWindow.status === "missed"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {selectedTimeWindow.status}
                      </span>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-semibold text-gray-600 uppercase">
                        Opportunity
                      </p>
                      <p className="text-sm text-gray-900">
                        {selectedTimeWindow.opportunity}
                      </p>
                    </div>
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

export default PerformanceOptimizationAgent;
