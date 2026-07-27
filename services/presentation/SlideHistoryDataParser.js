/**
 * HistoryDataParser - Transforms history API response into UI-friendly format
 *
 * The history API returns data in a different format than SSE events.
 * This parser transforms it to match the expected Redux state structure.
 */
export default class HistoryDataParser {
  constructor() {
    this.sseParser = null; // Will be injected if needed
    this._currentRawLogs = null;
  }

  /**
   * Parse complete history response
   */
  parseHistory(historyData) {
    if (!historyData) {
      return { logs: [], slides: [] };
    }

    const logs = this.parseLogs(historyData.logs || []);
    const slides = this.parseSlides(historyData.slides || []);

    return { logs, slides };
  }

  /**
   * Parse logs from history API
   * Logs in history have a different structure than SSE events
   */
  parseLogs(rawLogs) {
    const parsedLogs = [];

    // NEW: Store raw logs for link extraction
    this._currentRawLogs = rawLogs;

    rawLogs.forEach((log, index) => {
      // Skip user messages (we don't need to display these as separate logs)
      if (log.role === "user") {
        return;
      }

      // Handle agent logs
      if (log.role === "agent") {
        const parsed = this.parseAgentLog(log, index);
        if (parsed) {
          parsedLogs.push(parsed);
        }
      }
    });

    // NEW: Clear stored raw logs after parsing
    this._currentRawLogs = null;

    return parsedLogs;
  }

  /**
   * Parse individual agent log entry
   */
  parseAgentLog(log, index) {
    const agentName = log.agent_name;
    const timestamp = log.timestamp;
    const parsedOutput = log.parsed_output;

    // Route to appropriate parser based on agent name
    if (agentName === "vibe_estimator_agent") {
      return this.parseVibeEstimatorLog(parsedOutput, timestamp, index);
    }

    if (agentName === "KeywordResearchAgent") {
      return this.parseKeywordResearchLog(parsedOutput, timestamp, index);
    }

    if (agentName && agentName.startsWith("browser_worker_")) {
      return this.parseBrowserWorkerLog(log, timestamp, index);
    }

    if (agentName === "lightweight_planning_agent") {
      return this.parsePlanningLog(parsedOutput, timestamp, index);
    }

    if (agentName === "LightweightSlideGeneration") {
      return this.parseSlideGenerationLog(parsedOutput, timestamp, index);
    }

    // Generic log for unrecognized agents
    return this.parseGenericLog(log, timestamp, index);
  }

  /**
   * Parse vibe estimator log
   */
  parseVibeEstimatorLog(parsedOutput, timestamp, index) {
    try {
      const cleanText = this.cleanJsonString(parsedOutput);
      const parsed = JSON.parse(cleanText);

      return {
        id: `vibe_${timestamp}_${index}`,
        timestamp,
        agent: "vibe_estimator_agent",
        phase: "planning",
        title: "Presentation Configuration",
        content: {
          topic: parsed.topic,
          slideCount: parsed.slide_count,
          tone: parsed.tone,
          audience: parsed.audience_type,
          complexity: parsed.complexity_level,
          visualStyle: parsed.visual_style,
          keyMessage: parsed.key_message,
        },
        display: "structured",
      };
    } catch (error) {
      console.error("Error parsing vibe estimator log:", error);
      return null;
    }
  }

  /**
   * Parse keyword research log
   */
  parseKeywordResearchLog(parsedOutput, timestamp, index) {
    try {
      const cleanText = this.cleanJsonString(parsedOutput);
      const parsed = JSON.parse(cleanText);

      return {
        id: `keyword_${timestamp}_${index}`,
        timestamp,
        agent: "KeywordResearchAgent",
        phase: "research",
        title: "Keyword Research Initiated",
        content: {
          keywords: parsed.keywords || [],
          totalKeywords: (parsed.keywords || []).length,
        },
        display: "list",
      };
    } catch (error) {
      console.error("Error parsing keyword research log:", error);
      return null;
    }
  }

  /**
   * Parse browser worker log
   * In history, browser workers appear as separate log entries
   */
  parseBrowserWorkerLog(log, timestamp, index) {
    const agentName = log.agent_name;
    const parsedOutput = log.parsed_output;

    try {
      // Check if this is a URL entry or summary entry
      if (typeof parsedOutput === "string") {
        const parsed = JSON.parse(parsedOutput);

        // If it has a summary, it's a complete research entry
        if (parsed.summary) {
          const workerMatch = agentName.match(/browser_worker_(\d+)/);
          const workerIndex = workerMatch ? workerMatch[1] : index;

          // NEW: Reconstruct links array from history
          // The history API should include all related logs for this worker
          // We need to look back through rawLogs to find URL entries for this worker
          const links = this.extractLinksForWorker(workerIndex);

          return {
            id: `research_${workerIndex}_${timestamp}`,
            timestamp,
            agent: agentName,
            phase: "research",
            title: `Research Results`,
            content: {
              summary: parsed.summary,
              keyword: `Research ${parseInt(workerIndex) + 1}`,
              links: links, // Now populated with actual links
              totalSources: links.length,
            },
            display: "research",
          };
        }
      }

      // Skip URL-only entries as they'll be part of the summary
      return null;
    } catch (error) {
      console.error("Error parsing browser worker log:", error);
      return null;
    }
  }

  /**
   * NEW METHOD: Extract links for a specific browser worker
   * This needs access to all raw logs to find URL entries
   */
  extractLinksForWorker(workerIndex) {
    const links = [];
    const targetAgent = `browser_worker_${workerIndex}`;

    // Look through stored raw logs for this worker's URL entries
    if (this._currentRawLogs) {
      this._currentRawLogs.forEach((log) => {
        if (log.agent_name === targetAgent && log.role === "agent") {
          try {
            const parsedOutput = JSON.parse(log.parsed_output);

            // Check if this entry has URL and domain (URL entry, not summary)
            if (
              parsedOutput.url &&
              parsedOutput.domain &&
              !parsedOutput.summary
            ) {
              links.push({
                url: parsedOutput.url,
                domain: parsedOutput.domain,
                timestamp: log.timestamp,
              });
            }
          } catch (e) {
            // Skip invalid entries
          }
        }
      });
    }

    return links;
  }

  /**
   * Parse planning log
   */
  parsePlanningLog(parsedOutput, timestamp, index) {
    try {
      const cleanText = this.cleanJsonString(parsedOutput);
      const parsed = JSON.parse(cleanText);

      return {
        id: `planning_${timestamp}_${index}`,
        timestamp,
        agent: "lightweight_planning_agent",
        phase: "planning",
        title: "Presentation Structure",
        content: {
          metadata: parsed.presentation_metadata,
          theme: parsed.global_theme,
          slides: (parsed.slide_outline || []).map((slide) => ({
            number: slide.slide_number,
            title: slide.slide_title,
            purpose: slide.slide_purpose,
            type: slide.suggested_type,
          })),
          totalSlides: (parsed.slide_outline || []).length,
        },
        display: "planning",
      };
    } catch (error) {
      console.error("Error parsing planning log:", error);
      return null;
    }
  }

  /**
   * Parse slide generation progress log
   */
  parseSlideGenerationLog(parsedOutput, timestamp, index) {
    return {
      id: `slide_gen_${timestamp}_${index}`,
      timestamp,
      agent: "LightweightSlideGeneration",
      phase: "generation",
      title: "Slide Generation Progress",
      content: {
        message: parsedOutput,
        isProgress:
          parsedOutput.includes("✅") ||
          parsedOutput.includes("📦") ||
          parsedOutput.includes("🎨"),
      },
      display: "progress",
    };
  }

  /**
   * Parse generic log
   */
  parseGenericLog(log, timestamp, index) {
    return {
      id: `log_${timestamp}_${index}`,
      timestamp,
      agent: log.agent_name || "unknown",
      phase: "unknown",
      title: log.agent_name || "System Message",
      content: {
        message: log.parsed_output || log.message || "No content",
        raw: log,
      },
      display: "text",
    };
  }

  /**
   * Parse slides from history API
   */
  parseSlides(rawSlides) {
    if (!Array.isArray(rawSlides)) {
      return [];
    }

    return rawSlides
      .map((slide) => this.parseSlide(slide))
      .filter((slide) => slide !== null)
      .sort((a, b) => a.slideNumber - b.slideNumber);
  }

  /**
   * Parse individual slide
   */
  parseSlide(slide) {
    try {
      return {
        slideNumber: slide.slide_number,
        thinking: slide.thinking || "Thinking process not captured",
        html_content:
          slide.html_content || "<div>Slide content not available</div>",
        timestamp: slide.timestamp,
        agentName: slide.agent_name,
      };
    } catch (error) {
      console.error("Error parsing slide:", error);
      return null;
    }
  }

  /**
   * Clean JSON string by removing markdown code blocks
   */
  cleanJsonString(str) {
    if (typeof str !== "string") {
      return str;
    }

    return str
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
  }

  /**
   * Extract metadata from logs (title, totalSlides)
   */
  extractMetadata(logs) {
    const metadata = {
      title: "Generating...",
      totalSlides: 0,
    };

    // Find vibe estimator log for metadata
    const vibeLog = logs.find((log) => log.agent === "vibe_estimator_agent");
    if (vibeLog && vibeLog.content) {
      metadata.title = vibeLog.content.topic || metadata.title;
      metadata.totalSlides = vibeLog.content.slideCount || metadata.totalSlides;
    }

    return metadata;
  }
}
