"use client";
import {
  BookOpen,
  Check,
  CheckCircle,
  Cpu,
  FileText,
  Globe,
  Loader2,
  RefreshCw,
  Settings,
  Shield,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

// Tool data
const tools = [
  {
    id: "paraphrasing",
    name: "Paraphrasing Engine",
    icon: RefreshCw,
    description: "AI Agent-Driven Rewriting",
    color: "blue",
  },
  {
    id: "grammar",
    name: "Grammar & Style",
    icon: Check,
    description: "Smart Corrections",
    color: "green",
  },
  {
    id: "humanize",
    name: "Humanized GPT",
    icon: Cpu,
    description: "AI Detection Bypass",
    color: "purple",
  },
  {
    id: "translation",
    name: "Translation",
    icon: Globe,
    description: "180+ Languages",
    color: "orange",
  },
  {
    id: "summarizer",
    name: "Smart Summarizer",
    icon: BookOpen,
    description: "AI-Powered Summaries",
    color: "pink",
  },
];

// Sample data for demonstrations
const sampleTexts = {
  paraphrasing:
    "The rapid advancement of artificial intelligence has transformed how we approach content creation, enabling more efficient and sophisticated writing processes.",
  grammar:
    "Their going to the store to buy some grocerys, but they forgot there wallet at home.",
  humanize:
    "This comprehensive analysis examines the multifaceted implications of artificial intelligence integration within contemporary organizational paradigms.",
  translation:
    "Hello, how are you today? I hope you're having a wonderful day.",
  summarizer:
    "In recent years, the development of renewable energy technologies has accelerated significantly. Solar panels have become more efficient and affordable, with costs dropping by over 70% in the past decade. Wind energy capacity has tripled globally, and battery storage technology has improved to the point where renewable sources can provide consistent power. These advances, combined with government incentives and growing environmental awareness, have led to widespread adoption in both residential and commercial sectors.",
};

const WritingToolsShowcase = () => {
  const [activeTool, setActiveTool] = useState("paraphrasing");
  const [showModal, setShowModal] = useState(true);
  const [isProcessing, setIsProcessing] = useState(true);
  const [processingStage, setProcessingStage] = useState(0);
  const [userInput, setUserInput] = useState(sampleTexts.paraphrasing);
  const [output, setOutput] = useState("");
  const [selectedTone, setSelectedTone] = useState("professional");
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [viewMode, setViewMode] = useState("split");
  const [showSettings, setShowSettings] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [plagiarismScore, setPlagiarismScore] = useState(100);
  const [grammarIssues, setGrammarIssues] = useState([]);
  const [humanizationPasses, setHumanizationPasses] = useState(1);

  const tones = [
    "Professional",
    "Casual",
    "Academic",
    "Creative",
    "Friendly",
    "Confident",
  ];
  const languages = [
    "English",
    "Spanish",
    "French",
    "German",
    "Chinese",
    "Japanese",
    "Arabic",
    "Hindi",
    "Bengali",
    "Portuguese",
    "Russian",
    "Italian",
    "Korean",
  ];
  const viewModes = ["Compact", "Split", "Wide"];

  // Processing stages for different tools
  const getProcessingStages = (toolId) => {
    switch (toolId) {
      case "paraphrasing":
        return [
          { name: "Analyzing Intent", desc: "Detecting tone and domain" },
          { name: "Agent Selection", desc: "Choosing AI agents for this task" },
          { name: "Smart Rewriting", desc: "Preserving technical terms" },
          { name: "Plagiarism Check", desc: "Ensuring originality" },
          { name: "Final Polish", desc: "Applying selected tone" },
        ];
      case "grammar":
        return [
          { name: "Grammar Analysis", desc: "Checking rules and patterns" },
          { name: "Style Review", desc: "Evaluating flow and clarity" },
          { name: "Context Check", desc: "Verifying meaning preservation" },
          { name: "Final Corrections", desc: "Applying improvements" },
        ];
      case "humanize":
        return [
          {
            name: "Pass 1: Basic Humanization",
            desc: "Natural language patterns",
          },
          {
            name: "Pass 2: Advanced Variation",
            desc: "Diverse sentence structures",
          },
          { name: "Pass 3: Final Polish", desc: "Perfecting human-like flow" },
          { name: "Detection Test", desc: "Verifying AI bypass" },
        ];
      case "translation":
        return [
          { name: "Language Analysis", desc: "Understanding source context" },
          {
            name: "Tone Preservation",
            desc: "Maintaining voice in translation",
          },
          { name: "Translation", desc: "Converting to target language" },
          { name: "Quality Check", desc: "Ensuring accuracy and flow" },
        ];
      case "summarizer":
        return [
          { name: "Content Analysis", desc: "Identifying key themes" },
          {
            name: "Key Point Extraction",
            desc: "Finding important information",
          },
          { name: "Summary Generation", desc: "Creating concise output" },
          { name: "Quality Review", desc: "Ensuring comprehensive coverage" },
        ];
      default:
        return [];
    }
  };

  const stages = getProcessingStages(activeTool);
  const PHASE_DELAY_MS = 6000;

  // Auto-cycle through tools
  useEffect(() => {
    if (!showModal) return;
    const toolIds = [
      "paraphrasing",
      "grammar",
      "humanize",
      "translation",
      "summarizer",
    ];
    const currentIndex = toolIds.indexOf(activeTool);
    const nextIndex = (currentIndex + 1) % toolIds.length;

    const toolTimer = setTimeout(() => {
      const nextTool = toolIds[nextIndex];
      setActiveTool(nextTool);
      setUserInput(sampleTexts[nextTool]);
      setOutput("");
      setProcessingStage(0);
    }, PHASE_DELAY_MS * stages.length);

    return () => clearTimeout(toolTimer);
  }, [activeTool, showModal, stages.length]);

  // Infinite simulation effect
  useEffect(() => {
    if (!showModal) return;
    if (!isProcessing) return;
    if (processingStage >= 0) {
      generateOutput();
    }
    const timer = setTimeout(() => {
      setProcessingStage((prev) => (prev + 1) % stages.length);
    }, PHASE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [processingStage, isProcessing, showModal, stages.length]);

  // Simulate processing
  const startProcessing = () => {
    if (!userInput.trim()) return;

    setIsProcessing(true);
    setProcessingStage(0);
  };

  const generateOutput = () => {
    switch (activeTool) {
      case "paraphrasing":
        setOutput(
          `In today's rapidly evolving technological landscape, artificial intelligence has fundamentally revolutionized our approach to content generation, fostering more streamlined and sophisticated methodologies for writing processes. The integration of AI-powered tools has enabled creators to produce higher quality content with remarkable efficiency, transforming traditional workflows into dynamic, automated systems that adapt to individual writing styles and preferences.`,
        );
        setPlagiarismScore(98);
        break;
      case "grammar":
        setOutput(
          "They're going to the store to buy some groceries, but they forgot their wallet at home.",
        );
        setGrammarIssues([
          {
            type: "Spelling",
            original: "Their",
            correction: "They're",
            explanation: "Use 'they're' for 'they are'",
          },
          {
            type: "Spelling",
            original: "grocerys",
            correction: "groceries",
            explanation: "Correct spelling",
          },
          {
            type: "Grammar",
            original: "there wallet",
            correction: "their wallet",
            explanation: "Use 'their' for possession",
          },
        ]);
        break;
      case "humanize":
        setOutput(
          `You know, when you really think about how AI has changed things for writers, it's pretty amazing. We can now create content so much more easily and effectively. These smart tools help us write better stuff faster, and they actually learn how we like to write. It's like having a personal assistant that knows exactly what you want to say.`,
        );
        break;
      case "translation":
        setOutput(
          "Bonjour, comment allez-vous aujourd'hui ? J'espère que vous passez une journée merveilleuse.",
        );
        break;
      case "summarizer":
        setOutput(
          `Renewable energy technologies have advanced dramatically in recent years. Solar costs have dropped 70% in a decade, wind capacity has tripled globally, and improved battery storage enables consistent power. Government incentives and environmental awareness have driven widespread adoption across residential and commercial sectors.`,
        );
        break;
    }
  };

  const handleFileUpload = (file) => {
    setUploadedFiles((prev) => [...prev, file]);
  };

  const renderToolContent = () => {
    switch (activeTool) {
      case "paraphrasing":
        return (
          <div className="space-y-4">
            {/* Domain Templates */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                Domain Templates
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  "Academic",
                  "Business",
                  "Legal",
                  "Creative",
                  "Medical",
                  "Technical",
                ].map((domain) => (
                  <button
                    key={domain}
                    className="rounded border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:border-blue-500 hover:bg-blue-50"
                  >
                    {domain}
                  </button>
                ))}
              </div>
            </div>

            {/* View Modes */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                UI Customizations
              </h4>
              <div className="flex gap-2">
                {viewModes.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode.toLowerCase())}
                    className={`px-3 py-2 text-xs font-medium transition-colors ${
                      viewMode === mode.toLowerCase()
                        ? "bg-black text-white"
                        : "border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {mode} View
                  </button>
                ))}
              </div>
            </div>

            {/* Plagiarism Checker */}
            {plagiarismScore < 100 && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-semibold text-green-700">
                      Plagiarism Check Passed
                    </span>
                  </div>
                  <span className="text-lg font-bold text-green-700">
                    {plagiarismScore}% Original
                  </span>
                </div>
              </div>
            )}

            {/* Language Support */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                Language Support
              </h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-gray-600" />
                  <span className="text-sm text-gray-600">
                    180+ Languages Available
                  </span>
                </div>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="rounded border border-gray-300 px-3 py-1 text-sm"
                >
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case "grammar":
        return (
          <div className="space-y-4">
            {grammarIssues.length > 0 && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm">
                <h4 className="mb-3 text-sm font-semibold text-green-700">
                  Grammar Issues Found
                </h4>
                <div className="space-y-2">
                  {grammarIssues.map((issue, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-2 rounded bg-white p-2"
                    >
                      <CheckCircle className="mt-0.5 h-4 w-4 text-green-500" />
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-900">
                          {issue.type}
                        </div>
                        <div className="text-xs text-gray-600">
                          "{issue.original}" → "{issue.correction}"
                        </div>
                        <div className="text-xs text-gray-500">
                          {issue.explanation}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                Readability Score
              </h4>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: "85%" }}
                    ></div>
                  </div>
                </div>
                <span className="text-lg font-bold text-green-600">85/100</span>
              </div>
              <p className="mt-2 text-xs text-gray-600">
                Excellent readability - Clear and concise
              </p>
            </div>
          </div>
        );

      case "humanize":
        return (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                Humanization Passes
              </h4>
              <div className="space-y-2">
                {[1, 2, 3].map((pass) => (
                  <div key={pass} className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="passes"
                      checked={humanizationPasses === pass}
                      onChange={() => setHumanizationPasses(pass)}
                      className="h-4 w-4"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        Pass {pass}
                      </div>
                      <div className="text-xs text-gray-600">
                        {pass === 1 && "Basic natural language patterns"}
                        {pass === 2 && "Advanced sentence variation"}
                        {pass === 3 && "Maximum humanization"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">
                    AI Detection Bypass
                  </span>
                </div>
                <span className="text-lg font-bold text-green-700">
                  Undetectable
                </span>
              </div>
              <div className="mt-2 space-y-1 text-xs text-green-600">
                <div>✓ GPTZero: Safe</div>
                <div>✓ Turnitin: Safe</div>
                <div>✓ Originality.ai: Safe</div>
              </div>
            </div>
          </div>
        );

      case "translation":
        return (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                Translation Settings
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    From
                  </label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  >
                    {languages.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    To
                  </label>
                  <select className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
                    <option>French</option>
                    <option>Spanish</option>
                    <option>German</option>
                    <option>Chinese</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                Tone Preservation
              </h4>
              <div className="flex gap-2">
                {["Formal", "Casual", "Professional"].map((tone) => (
                  <button
                    key={tone}
                    className="rounded border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:border-orange-500 hover:bg-orange-50"
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case "summarizer":
        return (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                Summary Mode
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Executive Summary",
                  "TL;DR",
                  "Bullet Points",
                  "Key Quotes",
                ].map((mode) => (
                  <button
                    key={mode}
                    className="rounded border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:border-pink-500 hover:bg-pink-50"
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                Output Length
              </h4>
              <div className="flex gap-2">
                {["Short", "Medium", "Detailed"].map((length) => (
                  <button
                    key={length}
                    className="rounded border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:border-pink-500 hover:bg-pink-50"
                  >
                    {length}
                  </button>
                ))}
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
      <div
        className="flex h-screen items-center justify-center bg-white"
        id="writing"
      >
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-black px-6 py-3 text-white shadow-lg transition-all hover:bg-gray-800"
        >
          Open Writing Tools Showcase
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-auto w-full">
      <div
        className="flex rounded-xl border border-gray-200 bg-white shadow-2xl"
        style={{ width: "1000px", maxWidth: "calc(100vw - 40px)" }}
      >
        {/* Left sidebar - Tool selection */}
        <div className="w-64 rounded-xl border-r border-gray-200 bg-gray-50">
          <div className="rounded-xl border-b border-gray-200 bg-white px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                <div className="h-3 w-3 rounded-full bg-gray-400"></div>
              </div>
              <span className="text-sm font-semibold text-gray-700">
                Writing Tools
              </span>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-gray-600 hover:text-gray-800"
              >
                <Settings />
              </button>
            </div>
          </div>

          <div className="p-4">
            <h3 className="mb-4 text-xs font-bold tracking-widest text-gray-500 uppercase">
              Tools
            </h3>
            <div className="space-y-2">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => {
                    setActiveTool(tool.id);
                    setUserInput(sampleTexts[tool.id]);
                    setOutput("");
                  }}
                  className={`w-full rounded-lg p-3 text-left transition-colors ${
                    activeTool === tool.id
                      ? "border border-gray-200 bg-white ring-2 ring-black"
                      : "border border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {<tool.icon className="h-6 w-6 text-gray-700" />}
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">
                        {tool.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {tool.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* File Upload Area */}
            <div className="mt-6">
              <h4 className="mb-3 text-xs font-bold tracking-widest text-gray-500 uppercase">
                Multi-File Upload
              </h4>
              <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-4 text-center">
                <FileText className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-xs text-gray-600">
                  Drop files here or click to browse
                </p>
                <p className="text-xs text-gray-500">
                  PDF, DOCX, TXT supported
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    files.forEach(handleFileUpload);
                  }}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="mt-2 inline-block cursor-pointer rounded bg-blue-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-600"
                >
                  Browse Files
                </label>
              </div>
              {uploadedFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded bg-gray-100 p-2"
                    >
                      <span className="text-xs text-gray-700">{file.name}</span>
                      <button
                        onClick={() =>
                          setUploadedFiles((prev) =>
                            prev.filter((_, i) => i !== index),
                          )
                        }
                      >
                        <X />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex flex-1 flex-col rounded-xl">
          <div className="flex items-center justify-between rounded-xl border-b border-gray-200 bg-white px-6 py-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {tools.find((t) => t.id === activeTool)?.name}
              </h2>
              <p className="text-xs text-gray-600">
                AI-powered writing assistance
              </p>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto rounded-xl bg-white p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Input Area */}
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Input Text
                  </label>
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Enter your text here..."
                    className="h-48 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-black focus:ring-2 focus:ring-black"
                  />
                </div>

                {/* Tone Selection */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Tone & Style
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tones.map((tone) => (
                      <button
                        key={tone}
                        onClick={() => setSelectedTone(tone.toLowerCase())}
                        className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                          selectedTone === tone.toLowerCase()
                            ? "bg-black text-white"
                            : "border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={startProcessing}
                  disabled={isProcessing || !userInput.trim()}
                  className="w-full rounded-lg bg-black py-3 font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>
                        {stages[processingStage]?.name || "Processing..."}
                      </span>
                    </span>
                  ) : (
                    "Process Text"
                  )}
                </button>

                {/* Processing Stages */}
                {isProcessing && (
                  <div className="space-y-2">
                    {stages.map((stage, index) => (
                      <div
                        key={index}
                        className={`rounded-lg border p-3 transition-colors ${
                          index <= processingStage
                            ? "border-gray-200 bg-white"
                            : "border-gray-200 bg-gray-50 opacity-60"
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          {index < processingStage ? (
                            <CheckCircle className="h-4 w-4 shrink-0 text-black" />
                          ) : index === processingStage ? (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border border-gray-300"></div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {stage.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              {stage.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Output Area */}
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Output
                  </label>
                  <textarea
                    value={output}
                    readOnly
                    placeholder="Processed text will appear here..."
                    className="h-48 w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-sm"
                  />
                </div>

                {/* Tool-specific Features */}
                {renderToolContent()}

                {/* Action Buttons */}
                {output && (
                  <div className="flex gap-2">
                    <button className="flex-1 rounded-lg border border-gray-300 bg-white py-2 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-50">
                      Copy Output
                    </button>
                    <button className="flex-1 rounded-lg border border-gray-300 bg-white py-2 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-50">
                      Download
                    </button>
                    <button className="flex-1 rounded-lg bg-black py-2 text-[12px] font-medium text-white transition-colors hover:bg-gray-800">
                      Re-inject to Input
                    </button>
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

export default WritingToolsShowcase;