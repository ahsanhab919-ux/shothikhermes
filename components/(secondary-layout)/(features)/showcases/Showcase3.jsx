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

const Database = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
    <path d="M3 5v14a9 3 0 0 0 18 0V5"></path>
    <path d="M3 12a9 3 0 0 0 18 0"></path>
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

const DataAnalysisAgent = () => {
  const [position, setPosition] = useState({ x: 500, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const windowRef = useRef(null);

  const [agentStage, setAgentStage] = useState(0);
  const [showModal, setShowModal] = useState(true);
  const [userQuery, setUserQuery] = useState("");

  const PHASE_DELAY_MS = 6000; // 6 seconds per phase

  const stages = [
    {
      title: "Parse Data Request",
      desc: "Analyzing your query and identifying data needs",
      progress: 15,
    },
    {
      title: "Search Multiple Sources",
      desc: "Finding and accessing relevant data sources",
      progress: 35,
    },
    {
      title: "Extract & Clean Data",
      desc: "Scraping and processing data from sources",
      progress: 60,
    },
    {
      title: "Analyze & Structure",
      desc: "Organizing data into logical categories",
      progress: 80,
    },
    {
      title: "Build Spreadsheet",
      desc: "Creating professional spreadsheet with formulas",
      progress: 100,
    },
  ];

  const exampleQueries = [
    "Get me data on renewable energy adoption by country",
    "Extract tech company IPO data from 2020-2024",
    "Gather statistics on global e-commerce market growth",
  ];

  // Mock data for each stage
  const parsedRequirements = {
    metrics: ["adoption rate", "market size", "growth rate"],
    sources: ["Government databases", "Research papers", "Industry reports"],
    timeframe: "2020-2024",
    format: "By Country / By Region",
  };

  const dataSourcesFound = [
    { name: "World Bank API", records: 195, status: "found" },
    { name: "UN Data Repository", records: 342, status: "found" },
    { name: "Public Research DB", records: 127, status: "found" },
    { name: "Government Statistics", records: 89, status: "found" },
    { name: "Industry Reports", records: 56, status: "processing" },
  ];

  const dataExtractionProgress = [
    { source: "World Bank API", rows: 195, status: "complete", purity: "99%" },
    {
      source: "UN Data Repository",
      rows: 342,
      status: "complete",
      purity: "97%",
    },
    {
      source: "Public Research DB",
      rows: 127,
      status: "complete",
      purity: "96%",
    },
    {
      source: "Government Statistics",
      rows: 89,
      status: "processing",
      purity: "-",
    },
  ];

  const analysisInsights = [
    { insight: "Identified 4 major data categories", type: "Structure" },
    {
      insight: "Detected anomalies in 12 records (flagged for review)",
      type: "Quality",
    },
    {
      insight: "Auto-grouped 753 records into 8 segments",
      type: "Organization",
    },
    {
      insight: "Calculated 24 derived metrics (growth %, CAGR, etc)",
      type: "Analysis",
    },
  ];

  const finalSpreadsheetStats = {
    totalRows: 789,
    totalColumns: 12,
    sources: 5,
    verified: "100%",
    formulas: 24,
  };

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

  const handleExtractData = () => {
    if (userQuery.trim()) {
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
                  Parsing your data request...
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-black transition-all duration-1000"
                  style={{ width: "15%" }}
                ></div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                Identified Data Requirements
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between rounded bg-gray-50 p-2">
                  <span className="text-xs text-gray-600">Metrics:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {parsedRequirements.metrics.join(", ")}
                  </span>
                </div>
                <div className="flex justify-between rounded bg-gray-50 p-2">
                  <span className="text-xs text-gray-600">Data Sources:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {parsedRequirements.sources.join(", ")}
                  </span>
                </div>
                <div className="flex justify-between rounded bg-gray-50 p-2">
                  <span className="text-xs text-gray-600">Time Period:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {parsedRequirements.timeframe}
                  </span>
                </div>
                <div className="flex justify-between rounded bg-gray-50 p-2">
                  <span className="text-xs text-gray-600">Grouping:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {parsedRequirements.format}
                  </span>
                </div>
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
                  Searching for data sources...
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-black transition-all duration-1000"
                  style={{ width: "35%" }}
                ></div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                Data Sources Discovered
              </h4>
              <div className="space-y-2">
                {dataSourcesFound.map((source, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded border border-gray-200 bg-gray-50 p-2"
                  >
                    <div className="flex items-center space-x-2">
                      {source.status === "found" ? (
                        <CheckCircle className="h-4 w-4 text-gray-900" />
                      ) : (
                        <Loader2 className="h-4 w-4 text-gray-900" />
                      )}
                      <span className="text-sm text-gray-900">
                        {source.name}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-gray-600">
                      {source.records} records
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-600">
                Total records available:{" "}
                <span className="font-semibold text-gray-900">
                  809 records from 5 sources
                </span>
              </p>
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
                  Extracting and cleaning data...
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-black transition-all duration-1000"
                  style={{ width: "60%" }}
                ></div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                Data Extraction Progress
              </h4>
              <div className="space-y-2">
                {dataExtractionProgress.map((item, i) => (
                  <div
                    key={i}
                    className="rounded border border-gray-200 bg-gray-50 p-3"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <span className="text-sm font-semibold text-gray-900">
                        {item.source}
                      </span>
                      <span className="rounded bg-black px-2 py-1 text-xs text-white">
                        {item.rows} rows
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>
                        {item.status === "complete"
                          ? "✓ Complete"
                          : "Processing..."}
                      </span>
                      <span>Data purity: {item.purity}</span>
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
                <Loader2 />
                <span className="text-sm font-semibold text-gray-900">
                  Analyzing and organizing data...
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-black transition-all duration-1000"
                  style={{ width: "80%" }}
                ></div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                Analysis & Structuring Insights
              </h4>
              <div className="space-y-2">
                {analysisInsights.map((item, i) => (
                  <div
                    key={i}
                    className="rounded border border-gray-200 bg-gray-50 p-2"
                  >
                    <div className="mb-1 flex items-start justify-between">
                      <span className="text-xs font-semibold text-gray-600 uppercase">
                        {item.type}
                      </span>
                      <CheckCircle className="h-4 w-4 text-gray-900" />
                    </div>
                    <p className="text-sm text-gray-900">{item.insight}</p>
                  </div>
                ))}
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
                  Spreadsheet generated successfully!
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-black"
                  style={{ width: "100%" }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-3">
              <div className="rounded border border-gray-200 bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {finalSpreadsheetStats.totalRows}
                </p>
                <p className="mt-1 text-xs text-gray-600">Total Rows</p>
              </div>
              <div className="rounded border border-gray-200 bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {finalSpreadsheetStats.totalColumns}
                </p>
                <p className="mt-1 text-xs text-gray-600">Columns</p>
              </div>
              <div className="rounded border border-gray-200 bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {finalSpreadsheetStats.sources}
                </p>
                <p className="mt-1 text-xs text-gray-600">Sources</p>
              </div>
              <div className="rounded border border-gray-200 bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {finalSpreadsheetStats.verified}
                </p>
                <p className="mt-1 text-xs text-gray-600">Verified</p>
              </div>
              <div className="rounded border border-gray-200 bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {finalSpreadsheetStats.formulas}
                </p>
                <p className="mt-1 text-xs text-gray-600">Formulas</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                Spreadsheet Preview
              </h4>
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-100">
                    <th className="border-r px-2 py-1 text-left font-semibold text-gray-900">
                      ID
                    </th>
                    <th className="border-r px-2 py-1 text-left font-semibold text-gray-900">
                      Country
                    </th>
                    <th className="border-r px-2 py-1 text-left font-semibold text-gray-900">
                      Year
                    </th>
                    <th className="border-r px-2 py-1 text-left font-semibold text-gray-900">
                      Metric
                    </th>
                    <th className="px-2 py-1 text-left font-semibold text-gray-900">
                      Source
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      id: 1,
                      country: "United States",
                      year: 2024,
                      metric: "45.2%",
                      source: "World Bank",
                    },
                    {
                      id: 2,
                      country: "China",
                      year: 2024,
                      metric: "38.7%",
                      source: "UN Data",
                    },
                    {
                      id: 3,
                      country: "Germany",
                      year: 2024,
                      metric: "62.1%",
                      source: "Public DB",
                    },
                    {
                      id: 4,
                      country: "India",
                      year: 2023,
                      metric: "28.4%",
                      source: "Gov Stats",
                    },
                    {
                      id: 5,
                      country: "Japan",
                      year: 2023,
                      metric: "55.9%",
                      source: "Industry",
                    },
                  ].map((row, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="border-r px-2 py-1 text-gray-700">
                        {row.id}
                      </td>
                      <td className="border-r px-2 py-1 text-gray-700">
                        {row.country}
                      </td>
                      <td className="border-r px-2 py-1 text-gray-700">
                        {row.year}
                      </td>
                      <td className="border-r px-2 py-1 font-semibold text-gray-900">
                        {row.metric}
                      </td>
                      <td className="px-2 py-1 text-gray-600">{row.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-center gap-3">
              <button className="flex items-center space-x-2 rounded-lg bg-black px-6 py-2 font-medium text-white transition-colors hover:bg-gray-800">
                <Download className="h-4 w-4" />
                <span>Download Spreadsheet</span>
              </button>
              <button className="rounded-lg border border-gray-300 bg-white px-6 py-2 font-medium text-gray-900 transition-colors hover:bg-gray-50">
                Extract More Data
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
          Open Data Analysis Agent
        </button>
      </div>
    );
  }

  return (
    <div className="h-80vw relative w-full" id="data-analysis">
      <div
        ref={windowRef}
        className="z-10 flex rounded-xl border border-gray-200 bg-white shadow-2xl"
        style={{
          width: "1000px",
          maxWidth: "calc(100vw - 40px)",
        }}
      >
        {/* Left sidebar */}
        <div className="w-80 rounded-xl border-r border-gray-200 bg-white">
          <div className="drag-handle rounded-xl border-b border-gray-200 bg-white px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                <div className="h-3 w-3 rounded-full bg-gray-400"></div>
              </div>
              <span className="text-sm font-semibold text-gray-700">
                Data Analysis Agent
              </span>
              <button className="no-drag text-sm text-gray-600 hover:text-gray-800">
                ?
              </button>
            </div>
          </div>

          <div className="h-[650px] space-y-3 overflow-y-auto rounded-xl p-4">
            <h3 className="mb-4 text-xs font-bold tracking-widest text-gray-500 uppercase">
              Extraction Pipeline
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

            {agentStage === 4 && (
              <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start space-x-3">
                  <Database className="mt-0.5 h-5 w-5 shrink-0 text-gray-900" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Spreadsheet Ready!
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      Ready to download and use
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

          <div className="flex-1 overflow-y-auto rounded-xl bg-white p-8">
            {renderStageContent()}
            {userQuery && (
              <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <p className="mb-2 text-xs font-semibold text-gray-600 uppercase">
                  Your Data Request
                </p>
                <p className="text-gray-900">{userQuery}</p>
              </div>
            )}
          </div>

          <div className="no-drag space-y-3 rounded-xl border-t border-gray-200 bg-white p-4">
            {userQuery && agentStage === 4 && (
              <div className="px-4 text-xs text-gray-600">
                Try another query to extract more data
              </div>
            )}
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Describe the data you need..."
                  className="focus:ring-opacity-20 flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm placeholder-gray-600 outline-none focus:border-black focus:ring-2 focus:ring-black"
                  onKeyPress={(e) => e.key === "Enter" && handleExtractData()}
                />
                <button
                  onClick={handleExtractData}
                  disabled={!userQuery.trim()}
                  className="rounded-lg bg-black px-6 py-2 font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Extract
                </button>
              </div>
              {userQuery === "" && (
                <div className="px-4 text-xs text-gray-600">
                  <p className="mb-2 font-semibold">Try these examples:</p>
                  <div className="flex flex-wrap gap-2">
                    {exampleQueries.map((query) => (
                      <button
                        key={query}
                        onClick={() => setUserQuery(query)}
                        className="rounded bg-gray-100 px-3 py-1 text-left text-xs text-gray-900 transition-colors hover:bg-gray-200"
                      >
                        {query}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* <div className="absolute top-1/2 left-12 max-w-sm -translate-y-1/2">
        <h1 className="mb-4 text-5xl font-bold text-gray-900">
          Data extraction made effortless
        </h1>
        <p className="mb-6 text-xl text-gray-600">
          Describe what you need. Our agent searches multiple sources, scrapes
          content, analyzes patterns, and delivers a professional spreadsheet
          automatically.
        </p>
        <button className="flex items-center space-x-2 text-lg font-semibold text-black transition-colors hover:text-gray-700">
          <span>Learn more</span>
          <span>→</span>
        </button>
      </div> */}
    </div>
  );
};

export default DataAnalysisAgent;
