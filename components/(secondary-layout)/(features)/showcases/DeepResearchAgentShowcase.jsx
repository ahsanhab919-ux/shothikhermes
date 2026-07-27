"use client";
import {
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  Image as ImageIcon,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  researchPhases,
  sampleQueries,
  sampleSources,
  sampleImages,
} from "./deepResearchData";

const DeepResearchAgentShowcase = () => {
  const [showModal, setShowModal] = useState(true);
  const [isResearching, setIsResearching] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [query, setQuery] = useState("");
  const [sources, setSources] = useState([]);
  const [images, setImages] = useState([]);
  const [finalResult, setFinalResult] = useState("");
  const [researchMemory, setResearchMemory] = useState([]);
  const [loopCount, setLoopCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [maxLoops, setMaxLoops] = useState(3);
  const [citationAccuracy, setCitationAccuracy] = useState(0);
  const [researchDepth, setResearchDepth] = useState(0);
  const [processingStage, setProcessingStage] = useState(0);
  const [autoMode, setAutoMode] = useState(true);

  // Start research process
  const startResearch = () => {
    if (!query.trim()) return;

    setIsResearching(true);
    setCurrentPhase(0);
    setSources([]);
    setImages([]);
    setFinalResult("");
    setLoopCount(0);
    setCitationAccuracy(0);
    setResearchDepth(0);
  };

  const executePhase = (phaseIndex) => {
    const phase = researchPhases[phaseIndex];

    switch (phase.id) {
      case "query":
        setResearchMemory((prev) => [
          ...prev,
          `Generated queries for: "${query}"`,
        ]);
        setResearchDepth(1);
        break;

      case "web":
        const shuffled = [...sampleSources].sort(() => Math.random() - 0.5);
        setSources(shuffled.slice(0, 3 + Math.floor(Math.random() * 3)));
        setCitationAccuracy(95 + Math.floor(Math.random() * 5));
        setResearchDepth((prev) => prev + 2);
        break;

      case "image":
        const shuffledImages = [...sampleImages].sort(
          () => Math.random() - 0.5,
        );
        setImages(shuffledImages.slice(0, 2 + Math.floor(Math.random() * 3)));
        setResearchDepth((prev) => prev + 1);
        break;

      case "reflect":
        const sufficiency = Math.random();
        if (sufficiency > 0.4) {
          setResearchMemory((prev) => [
            ...prev,
            `Research sufficient (${Math.round(sufficiency * 100)}%)`,
          ]);
        } else {
          setResearchMemory((prev) => [
            ...prev,
            `Insufficient data, initiating loop ${loopCount + 1}`,
          ]);
        }
        break;

      case "finalize":
        setResearchDepth((prev) => prev + 1);
        break;
    }
  };

  const generateFinalResult = () => {
    const result = `Based on comprehensive research across ${sources.length} verified sources and ${images.length} relevant images, here are the key findings:

## Executive Summary

The research on "${query}" reveals critical insights that transform our understanding. Through multi-step analysis and verification, we've identified key patterns and emerging trends.

## Key Findings

1. **Primary Insight**: Analysis of ${sources.length} sources indicates significant developments.
2. **Market Impact**: Data suggests a 120x improvement in research efficiency.
3. **Future Outlook**: Based on current trends and expert analysis, continued growth expected.

## Evidence & Sources

${sources
  .slice(0, 3)
  .map(
    (source, index) =>
      `${index + 1}. **${source.title}** (${source.type}, ${source.credibility}% credibility): ${source.excerpt}`,
  )
  .join("\n")}

## Research Statistics

- **Processing Time**: ${20 + loopCount * 10} seconds
- **Sources Analyzed**: ${sources.length}
- **Images Found**: ${images.length}
- **Citation Accuracy**: ${citationAccuracy}%
- **Research Loops**: ${loopCount}
- **Data Depth**: ${researchDepth}x deeper than single query

This demonstrates the power of AI-driven multi-step investigation.`;

    setFinalResult(result);
  };

  // Render different content for each phase
  const renderPhaseContent = () => {
    const phase = researchPhases[currentPhase];

    switch (phase.id) {
      case "query":
        return (
          <div className="space-y-6">
            <div className="py-8 text-center">
              <Search className="mx-auto mb-4 h-16 w-16 text-blue-500" />
              <h3 className="mb-2 text-xl font-bold text-gray-900">
                Query Analysis & Generation
              </h3>
              <p className="mb-6 text-gray-600">
                AI is performing comprehensive query analysis and optimization
              </p>
            </div>

            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Semantic Analysis
                  </h4>
                  <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Intent Detection:</span>
                    <span className="font-medium text-green-600">Complete</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Entity Extraction:</span>
                    <span className="font-medium text-green-600">
                      12 entities
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Context Score:</span>
                    <span className="font-medium text-green-600">94%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Topic Modeling:</span>
                    <span className="font-medium text-green-600">8 topics</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-blue-50 p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Query Expansion
                  </h4>
                  <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Synonyms Found:</span>
                    <span className="font-medium text-blue-600">24 terms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Related Concepts:</span>
                    <span className="font-medium text-blue-600">
                      15 concepts
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Variations Generated:</span>
                    <span className="font-medium text-blue-600">
                      48 variants
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Language Coverage:</span>
                    <span className="font-medium text-blue-600">
                      6 languages
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-purple-50 p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Optimization
                  </h4>
                  <div className="h-2 w-2 animate-pulse rounded-full bg-purple-500"></div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Precision Tuning:</span>
                    <span className="font-medium text-purple-600">
                      Optimized
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Recall Balance:</span>
                    <span className="font-medium text-purple-600">78%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Domain Filters:</span>
                    <span className="font-medium text-purple-600">
                      12 domains
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time Constraints:</span>
                    <span className="font-medium text-purple-600">
                      2020-2025
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-auto max-w-4xl">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
                <h4 className="mb-4 text-sm font-semibold text-gray-900">
                  Generated Query Portfolio
                </h4>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="rounded border border-green-200 bg-white p-3">
                      <div className="mb-1 flex items-center space-x-2">
                        <span className="text-xs font-medium text-green-700">
                          Primary Query
                        </span>
                        <span className="text-xs text-gray-500">
                          Exact match
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">"{query}"</p>
                    </div>

                    <div className="rounded border border-blue-200 bg-white p-3">
                      <div className="mb-1 flex items-center space-x-2">
                        <span className="text-xs font-medium text-blue-700">
                          Broad Query
                        </span>
                        <span className="text-xs text-gray-500">Expanded</span>
                      </div>
                      <p className="text-sm text-gray-800">
                        "
                        {query.replace(/\b\w+\b/g, (word) =>
                          word.length > 3 ? word + "*" : word,
                        )}
                        "
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="rounded border border-purple-200 bg-white p-3">
                      <div className="mb-1 flex items-center space-x-2">
                        <span className="text-xs font-medium text-purple-700">
                          Contextual Query
                        </span>
                        <span className="text-xs text-gray-500">
                          Time-aware
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">
                        "{query} 2024 2025 trends developments"
                      </p>
                    </div>

                    <div className="rounded border border-orange-200 bg-white p-3">
                      <div className="mb-1 flex items-center space-x-2">
                        <span className="text-xs font-medium text-orange-700">
                          Multilingual Query
                        </span>
                        <span className="text-xs text-gray-500">
                          Global scope
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">
                        "{query} trends analysis global insights"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Ready to search across{" "}
                <span className="font-bold text-gray-900">10,000+</span>{" "}
                verified sources in{" "}
                <span className="font-bold text-gray-900">12</span> domains
              </p>
            </div>
          </div>
        );

      case "web":
        return (
          <div className="space-y-6">
            <div className="py-6 text-center">
              <Globe className="mx-auto mb-4 h-16 w-16 text-green-500" />
              <h3 className="mb-2 text-xl font-bold text-gray-900">
                Comprehensive Web Research
              </h3>
              <p className="mb-6 text-gray-600">
                AI is performing multi-layered source discovery and validation
              </p>
            </div>

            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 lg:grid-cols-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Source Discovery
                  </h4>
                  <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Academic DB:</span>
                    <span className="font-medium text-green-600">Scanned</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">News Archives:</span>
                    <span className="font-medium text-green-600">Complete</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Government:</span>
                    <span className="font-medium text-green-600">Indexed</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Industry Reports:</span>
                    <span className="font-medium text-green-600">
                      Processed
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-blue-50 p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Content Validation
                  </h4>
                  <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fact Checking:</span>
                    <span className="font-medium text-blue-600">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Source Verification:</span>
                    <span className="font-medium text-blue-600">87%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cross-Reference:</span>
                    <span className="font-medium text-blue-600">
                      23 sources
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Authority Score:</span>
                    <span className="font-medium text-blue-600">92/100</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-purple-50 p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Citation Extraction
                  </h4>
                  <div className="h-2 w-2 animate-pulse rounded-full bg-purple-500"></div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">References Found:</span>
                    <span className="font-medium text-purple-600">156</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Authors Cited:</span>
                    <span className="font-medium text-purple-600">48</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Publications:</span>
                    <span className="font-medium text-purple-600">
                      12 journals
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Legal Citations:</span>
                    <span className="font-medium text-purple-600">8 cases</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-orange-50 p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Quality Assessment
                  </h4>
                  <div className="h-2 w-2 animate-pulse rounded-full bg-orange-500"></div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Recency Score:</span>
                    <span className="font-medium text-orange-600">94%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Relevance:</span>
                    <span className="font-medium text-orange-600">89%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Accuracy Rating:</span>
                    <span className="font-medium text-orange-600">96%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bias Detection:</span>
                    <span className="font-medium text-orange-600">Low</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">
                    <Search className="mr-2 inline h-4 w-4" />
                    Verified Sources ({sources.length})
                  </h3>
                  <div className="max-h-96 space-y-3 overflow-y-auto">
                    {sources.map((source, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-gray-900">
                              {source.title}
                            </h4>
                            <div className="mt-1 flex items-center space-x-2">
                              <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                                {source.type}
                              </span>
                              <span className="text-xs text-gray-500">
                                <Globe className="mr-1 inline h-3 w-3" />
                                {new URL(source.url).hostname}
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-gray-600">
                              {source.excerpt}
                            </p>
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex items-center space-x-1">
                                <span className="text-xs text-gray-500">
                                  Credibility:
                                </span>
                                <div className="flex items-center space-x-1">
                                  <div className="h-1.5 w-16 rounded-full bg-gray-200">
                                    <div
                                      className="h-1.5 rounded-full bg-black"
                                      style={{
                                        width: `${source.credibility}%`,
                                      }}
                                    ></div>
                                  </div>
                                  <span className="text-xs font-medium text-gray-900">
                                    {source.credibility}%
                                  </span>
                                </div>
                              </div>
                              <a
                                href={source.url}
                                className="flex items-center gap-1 text-xs text-gray-900 hover:text-black"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Visit Source
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">
                    <Brain className="mr-2 inline h-4 w-4" />
                    Research Analytics Dashboard
                  </h3>
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Sources Scanned
                          </span>
                          <span className="text-lg font-bold text-gray-900">
                            {Math.floor(Math.random() * 5000 + 1000)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Relevant Results
                          </span>
                          <span className="text-lg font-bold text-gray-900">
                            {sources.length}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Citations Extracted
                          </span>
                          <span className="text-lg font-bold text-gray-900">
                            {Math.floor(Math.random() * 50 + 20)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Cross-References
                          </span>
                          <span className="text-lg font-bold text-gray-900">
                            {Math.floor(Math.random() * 30 + 10)}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Domain Coverage
                            </span>
                            <span className="text-lg font-bold text-gray-900">
                              12/15
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Language Scope
                            </span>
                            <span className="text-lg font-bold text-gray-900">
                              8 langs
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Time Range
                            </span>
                            <span className="text-lg font-bold text-gray-900">
                              2020-2025
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Quality Score
                            </span>
                            <span className="text-lg font-bold text-gray-900">
                              92%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "image":
        return (
          <div className="space-y-6">
            <div className="py-6 text-center">
              <ImageIcon className="mx-auto mb-4 h-16 w-16 text-purple-500" />
              <h3 className="mb-2 text-xl font-bold text-gray-900">
                Advanced Image Discovery
              </h3>
              <p className="mb-6 text-gray-600">
                AI is performing multi-modal visual analysis and licensing
                verification
              </p>
            </div>

            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 lg:grid-cols-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Visual Search
                  </h4>
                  <div className="h-2 w-2 animate-pulse rounded-full bg-purple-500"></div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Image Databases:</span>
                    <span className="font-medium text-purple-600">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reverse Search:</span>
                    <span className="font-medium text-purple-600">
                      Complete
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Similarity Match:</span>
                    <span className="font-medium text-purple-600">87%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Visual Context:</span>
                    <span className="font-medium text-purple-600">
                      Analyzed
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-blue-50 p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">
                    License Verification
                  </h4>
                  <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">CC License Check:</span>
                    <span className="font-medium text-blue-600">Verified</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Commercial Use:</span>
                    <span className="font-medium text-blue-600">Allowed</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Attribution:</span>
                    <span className="font-medium text-blue-600">Required</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">License Score:</span>
                    <span className="font-medium text-blue-600">95/100</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-green-50 p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Content Analysis
                  </h4>
                  <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Object Detection:</span>
                    <span className="font-medium text-green-600">
                      24 objects
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Scene Analysis:</span>
                    <span className="font-medium text-green-600">Complete</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Color Analysis:</span>
                    <span className="font-medium text-green-600">
                      16 colors
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Text Detection:</span>
                    <span className="font-medium text-green-600">OCR done</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-orange-50 p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">
                    Quality Assessment
                  </h4>
                  <div className="h-2 w-2 animate-pulse rounded-full bg-orange-500"></div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Resolution Check:</span>
                    <span className="font-medium text-orange-600">HD+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quality Score:</span>
                    <span className="font-medium text-orange-600">92%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Originality:</span>
                    <span className="font-medium text-orange-600">High</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Relevance:</span>
                    <span className="font-medium text-orange-600">
                      {images.length > 0 ? images[0].relevance : 88}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-auto max-w-6xl">
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  <ImageIcon className="mr-2 inline h-4 w-4" />
                  Verified Creative Commons Images ({images.length})
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
                    >
                      <div className="relative">
                        <img
                          src={image.url}
                          alt={image.title}
                          className="mb-2 h-32 w-full rounded object-cover"
                        />
                        <div className="bg-opacity-70 absolute top-2 right-2 rounded bg-black px-2 py-1 text-xs text-white">
                          CC {image.license.split(" ")[1]}
                        </div>
                      </div>
                      <h4 className="mb-2 text-xs font-semibold text-gray-900">
                        {image.title}
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            License:
                          </span>
                          <span className="text-xs font-medium text-purple-600">
                            {image.license}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Visual Relevance:
                          </span>
                          <div className="flex items-center space-x-1">
                            <div className="h-1.5 w-12 rounded-full bg-gray-200">
                              <div
                                className="h-1.5 rounded-full bg-purple-500"
                                style={{ width: `${image.relevance}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium text-gray-900">
                              {image.relevance}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Quality Score:
                          </span>
                          <span className="text-xs font-medium text-green-600">
                            {85 + Math.floor(Math.random() * 15)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">
                    <Eye className="mr-2 inline h-4 w-4" />
                    Visual Intelligence Dashboard
                  </h3>
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Images Scanned
                          </span>
                          <span className="text-lg font-bold text-gray-900">
                            {Math.floor(Math.random() * 10000 + 5000)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            CC Licensed
                          </span>
                          <span className="text-lg font-bold text-gray-900">
                            {images.length}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Visual Relevance
                          </span>
                          <span className="text-lg font-bold text-gray-900">
                            {Math.floor(Math.random() * 30 + 70)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Objects Detected
                          </span>
                          <span className="text-lg font-bold text-gray-900">
                            {Math.floor(Math.random() * 100 + 50)}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Source Types
                            </span>
                            <span className="text-lg font-bold text-gray-900">
                              8 platforms
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Style Analysis
                            </span>
                            <span className="text-lg font-bold text-gray-900">
                              12 styles
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Color Palettes
                            </span>
                            <span className="text-lg font-bold text-gray-900">
                              64 palettes
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Context Score
                            </span>
                            <span className="text-lg font-bold text-gray-900">
                              91%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">
                    <Database className="mr-2 inline h-4 w-4" />
                    Processing Pipeline
                  </h3>
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <div className="flex-1">
                          <div className="text-xs font-medium text-gray-900">
                            Image Acquisition
                          </div>
                          <div className="text-xs text-gray-600">
                            Multiple sources scanned
                          </div>
                        </div>
                        <span className="text-xs font-medium text-green-600">
                          Complete
                        </span>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
                        <div className="flex-1">
                          <div className="text-xs font-medium text-gray-900">
                            License Verification
                          </div>
                          <div className="text-xs text-gray-600">
                            CC compliance checked
                          </div>
                        </div>
                        <span className="text-xs font-medium text-blue-600">
                          Processing
                        </span>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                        <div className="flex-1">
                          <div className="text-xs font-medium text-gray-900">
                            Content Analysis
                          </div>
                          <div className="text-xs text-gray-600">
                            AI visual recognition
                          </div>
                        </div>
                        <span className="text-xs font-medium text-gray-500">
                          Queued
                        </span>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                        <div className="flex-1">
                          <div className="text-xs font-medium text-gray-900">
                            Relevance Scoring
                          </div>
                          <div className="text-xs text-gray-600">
                            Contextual matching
                          </div>
                        </div>
                        <span className="text-xs font-medium text-gray-500">
                          Pending
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "reflect":
        return (
          <div className="space-y-6">
            <div className="py-12 text-center">
              <Brain className="mx-auto mb-4 h-16 w-16 text-orange-500" />
              <h3 className="mb-2 text-xl font-bold text-gray-900">
                Reflection & Analysis
              </h3>
              <p className="mb-6 text-gray-600">
                AI is analyzing research sufficiency and identifying knowledge
                gaps
              </p>

              <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 m-cols-2"></div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-6">
                  <div className="mb-4 flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-900">
                      Adequate Coverage
                    </h4>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>✓ Multiple credible sources found</li>
                    <li>✓ Recent data available</li>
                    <li>✓ Expert opinions included</li>
                    <li>✓ Statistical data present</li>
                  </ul>
                </div>

                <div className="rounded-lg border border-orange-200 bg-orange-50 p-6">
                  <div className="mb-4 flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500">
                      <Search className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-900">
                      Potential Gaps
                    </h4>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>⚠ Limited regional data</li>
                    <li>⚠ Few counter-arguments</li>
                    <li>⚠ Historical context needed</li>
                    <li>⚠ Future projections missing</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8">
                <div className="inline-flex items-center space-x-2 rounded-full bg-blue-100 px-4 py-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium text-blue-900">
                    Decision:{" "}
                    {Math.random() > 0.4
                      ? "Continue Research"
                      : "Finalize Results"}
                  </span>
                </div>
              </div>
            </div>
        );

      case "decision":
        return (
          <div className="space-y-6">
            <div className="py-12 text-center">
              <BarChart3 className="mx-auto mb-4 h-16 w-16 text-pink-500" />
              <h3 className="mb-2 text-xl font-bold text-gray-900">
                Decision Point
              </h3>
              <p className="mb-6 text-gray-600">
                Evaluating research completeness and determining next steps
              </p>

              <div className="mx-auto max-w-2xl">
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                      <span className="text-sm font-medium text-gray-900">
                        Research Completeness
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {Math.floor(Math.random() * 30 + 70)}%
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Sources Quality
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-24 rounded-full bg-gray-200">
                            <div className="h-2 w-16 rounded-full bg-green-500"></div>
                          </div>
                          <span className="text-sm font-medium">Good</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Data Depth
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-24 rounded-full bg-gray-200">
                            <div className="h-2 w-20 rounded-full bg-blue-500"></div>
                          </div>
                          <span className="text-sm font-medium">Excellent</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Citation Coverage
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-24 rounded-full bg-gray-200">
                            <div className="h-2 w-14 rounded-full bg-yellow-500"></div>
                          </div>
                          <span className="text-sm font-medium">Moderate</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <button className="rounded-lg border border-gray-300 bg-white p-4 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Continue Research
                    <ArrowRight className="ml-2 inline h-4 w-4" />
                  </button>
                  <button className="rounded-lg bg-black p-4 text-sm font-medium text-white hover:bg-gray-800">
                    Finalize Results
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case "finalize":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-900">
                <Brain className="mr-2 inline h-4 w-4" />
                Research Results
              </h3>
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                {/* Executive Summary Card */}
                <div className="mb-6 rounded-lg border border-gray-200 bg-blue-50 p-4">
                  <div className="mb-3 flex items-center">
                    <Brain className="mr-2 h-5 w-5 text-blue-600" />
                    <h4 className="text-sm font-semibold text-gray-900">
                      Executive Summary
                    </h4>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-700">
                    The research on{" "}
                    <span className="font-semibold">"{query}"</span> reveals
                    critical insights that transform our understanding. Through
                    multi-step analysis and verification, we've identified key
                    patterns and emerging trends.
                  </p>
                </div>

                {/* Key Findings Grid */}
                <div className="mb-6">
                  <h4 className="mb-3 text-sm font-semibold text-gray-900">
                    Key Findings
                  </h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                      <div className="mb-2 flex items-center">
                        <div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
                        <span className="text-xs font-medium text-green-700">
                          Primary Insight
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">
                        Analysis indicates significant developments in field
                      </p>
                    </div>
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                      <div className="mb-2 flex items-center">
                        <div className="mr-2 h-2 w-2 rounded-full bg-blue-500"></div>
                        <span className="text-xs font-medium text-blue-700">
                          Market Impact
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">
                        Data suggests substantial growth and transformation
                      </p>
                    </div>
                    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                      <div className="mb-2 flex items-center">
                        <div className="mr-2 h-2 w-2 rounded-full bg-purple-500"></div>
                        <span className="text-xs font-medium text-purple-700">
                          Future Outlook
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">
                        Based on current trends, continued advancement expected
                      </p>
                    </div>
                  </div>
                </div>

                {/* Evidence & Sources */}
                <div className="mb-6">
                  <h4 className="mb-3 text-sm font-semibold text-gray-900">
                    Evidence & Sources
                  </h4>
                  <div className="space-y-3">
                    {sources.slice(0, 3).map((source, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="mb-1 text-sm font-semibold text-gray-900">
                              {index + 1}. {source.title}
                            </h5>
                            <div className="mb-2 flex items-center space-x-2">
                              <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                                {source.type}
                              </span>
                              <span className="text-xs text-gray-500">
                                <Globe className="mr-1 inline h-3 w-3" />
                                {new URL(source.url).hostname}
                              </span>
                              <div className="flex items-center space-x-1">
                                <span className="text-xs text-gray-500">
                                  Credibility:
                                </span>
                                <div className="flex items-center space-x-1">
                                  <div className="h-1.5 w-16 rounded-full bg-gray-200">
                                    <div
                                      className="h-1.5 rounded-full bg-black"
                                      style={{
                                        width: `${source.credibility}%`,
                                      }}
                                    ></div>
                                  </div>
                                  <span className="text-xs font-medium text-gray-900">
                                    {source.credibility}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600">
                              {source.excerpt}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Research Statistics */}
                <div className="mb-6">
                  <h4 className="mb-3 text-sm font-semibold text-gray-900">
                    Research Statistics
                  </h4>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {sources.length}
                      </div>
                      <div className="text-xs text-gray-600">
                        Sources Analyzed
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {images.length}
                      </div>
                      <div className="text-xs text-gray-600">Images Found</div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {citationAccuracy}%
                      </div>
                      <div className="text-xs text-gray-600">
                        Citation Accuracy
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {loopCount}
                      </div>
                      <div className="text-xs text-gray-600">
                        Research Loops
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button className="flex-1 rounded-lg border border-gray-300 bg-white py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                    <Download className="mr-2 inline h-4 w-4" />
                    Download Report
                  </button>
                  <button className="flex-1 rounded-lg border border-gray-300 bg-white py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                    Copy Results
                  </button>
                  <button className="flex-1 rounded-lg bg-black py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800">
                    Share Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="py-12 text-center">
            <FileText className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-xl font-bold text-gray-900">
              Select a Phase
            </h3>
            <p className="text-gray-600">
              Choose a research phase to view detailed information
            </p>
          </div>
        );
    }
  };

  // Auto/Manual mode control
  useEffect(() => {
    if (!showModal) return;
    if (!isResearching) return;
    if (!autoMode) return; // Only auto-progress in auto mode

    const timer = setTimeout(() => {
      const nextStage = (currentPhase + 1) % researchPhases.length;
      setCurrentPhase(nextStage);
      executePhase(nextStage);
    }, 2000); // 2 second intervals for showcase effect

    return () => clearTimeout(timer);
  }, [currentPhase, isResearching, showModal, autoMode]);

  // Execute phase when changed
  useEffect(() => {
    if (!showModal) return;
    if (!isResearching) return;

    executePhase(currentPhase);
  }, [currentPhase, isResearching, showModal]);

  if (!showModal) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-black px-6 py-3 text-white shadow-lg transition-all hover:bg-gray-800"
        >
          Open Deep Research Agent
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full" id="deep-research">
      <div
        className="flex origin-top scale-90 rounded-xl border border-gray-200 bg-white shadow-2xl"
        style={{
          width: "1200px",
          maxWidth: "calc(100vw - 40px)",
          transform: "scale(0.9)",
          transformOrigin: "top left",
        }}
      >
        {/* Left sidebar - Process overview */}
        <div className="w-80 rounded-xl border-r border-gray-200 bg-white">
          <div className="rounded-xl border-b border-gray-200 bg-white px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                <div className="h-3 w-3 rounded-full bg-gray-400"></div>
              </div>
              <span className="text-sm text-gray-600">Deep Research Agent</span>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="no-drag text-sm text-gray-600 hover:text-gray-800"
              >
                Get started
              </button>
            </div>
          </div>

          <div className="h-[600px] overflow-y-auto p-4">
            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Research Pipeline
                </h3>
              </div>

              {/* Query Input */}
              <div className="mb-4">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What do you want to research?"
                  className="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-600 outline-none focus:border-black focus:ring-2 focus:ring-black"
                  disabled={isResearching}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {sampleQueries.slice(0, 3).map((sample, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(sample)}
                      className="rounded bg-gray-100 px-3 py-1 text-sm text-gray-900 hover:bg-gray-200"
                      disabled={isResearching}
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto/Manual Mode Toggle */}
              <div className="mb-4 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                <span className="text-sm font-medium text-gray-700">
                  Research Mode
                </span>
                <button
                  onClick={() => setAutoMode(!autoMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoMode ? "bg-black" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoMode ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <span
                  className={`text-sm font-medium ${
                    autoMode ? "text-black" : "text-gray-500"
                  }`}
                >
                  {autoMode ? "Auto" : "Manual"}
                </span>
              </div>

              {/* Start/Stop Research Button */}
              <button
                onClick={
                  isResearching ? () => setIsResearching(false) : startResearch
                }
                disabled={!query.trim() && !isResearching}
                className="w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isResearching ? (
                  <span className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-4 w-4" />
                    <span>Stop Research</span>
                  </span>
                ) : (
                  "Start Research"
                )}
              </button>
            </div>

            <div className="space-y-2">
              {researchPhases.map((phase, index) => {
                const PhaseIcon = phase.icon;
                return (
                  <div
                    key={phase.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => !isResearching && setCurrentPhase(index)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setCurrentPhase(index);
                      }
                    }}
                    className={`group cursor-pointer rounded-lg p-3 shadow-sm transition-all ${
                      index <= currentPhase
                        ? "border border-gray-200 bg-white hover:border-gray-300"
                        : "border border-gray-200 bg-gray-50 opacity-60"
                    } ${index === currentPhase ? "ring-2 ring-black" : ""}`}
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex items-start space-x-2">
                        {index < currentPhase ? (
                          <CheckCircle2 />
                        ) : index === currentPhase && isResearching ? (
                          <Loader2 />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-gray-300"></div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {phase.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {phase.description}
                          </p>
                        </div>
                      </div>
                    </div>
                    {index <= currentPhase && (
                      <div>
                        <div className="h-1.5 w-full rounded-full bg-gray-200">
                          <div
                            className="h-1.5 rounded-full bg-black transition-all duration-500"
                            style={{
                              width: `${index < currentPhase ? 100 : index === 0 ? 15 : index === 1 ? 30 : index === 2 ? 50 : index === 3 ? 70 : index === 4 ? 90 : 100}%`,
                            }}
                          ></div>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {Math.round(
                            index < currentPhase
                              ? 100
                              : index === 0
                                ? 15
                                : index === 1
                                  ? 30
                                  : index === 2
                                    ? 50
                                    : index === 3
                                      ? 70
                                      : index === 4
                                        ? 90
                                        : 100,
                          )}
                          % complete
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Research Stats */}
            {(isResearching || finalResult) && (
              <div className="mt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Citation Accuracy</span>
                    <span className="font-medium text-gray-900">
                      {citationAccuracy}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Research Loops</span>
                    <span className="font-medium text-gray-900">
                      {loopCount}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sources Found</span>
                    <span className="font-medium text-gray-900">
                      {sources.length}
                    </span>
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
            <h2 className="text-lg font-semibold text-gray-900">
              {researchPhases[currentPhase].name}
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
            {renderPhaseContent()}
          </div>

          {/* Footer input area */}
          <div className="no-drag rounded-xl border-t border-gray-200 bg-white p-4">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your research query..."
                className="focus:ring-opacity-20 flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-600 outline-none focus:border-black focus:ring-2 focus:ring-black"
                onKeyPress={(e) => e.key === "Enter" && startResearch()}
              />
              <button
                onClick={startResearch}
                disabled={!query.trim() || isResearching}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Start Research
              </button>
            </div>
            {query === "" && (
              <div className="mt-3 text-xs text-gray-600">
                <p className="mb-2 font-semibold">Examples:</p>
                <div className="flex flex-wrap gap-2">
                  {sampleQueries.map((link) => (
                    <button
                      key={link}
                      onClick={() => setQuery(link)}
                      className="rounded bg-gray-100 px-3 py-1 text-sm text-gray-900 hover:bg-gray-200"
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
    </div>
  );
};

export default DeepResearchAgentShowcase;
