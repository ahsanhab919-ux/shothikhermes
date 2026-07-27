/**
 * Presentation History Parser
 *
 * This module handles parsing of historical presentation data from the /logs API endpoint.
 * It transforms the raw history response into the same structured format used by the
 * real-time socket event parser, ensuring consistency across the Redux store.
 *
 * The parser processes:
 * - User messages and agent outputs
 * - Browser worker research data
 * - Slide generation data with thinking and HTML content
 * - Presentation metadata and status
 *
 * @module presentationHistoryParser
 */

import { enrichLogEntry } from "./messageTypeClassifier.js";

/**
 * Generate a unique ID for log entries from history
 * Uses the same format as real-time logs for consistency
 *
 * @param {string} author - The author of the event
 * @param {string} timestamp - The timestamp of the event
 * @returns {string} Unique identifier
 */
const generateHistoryLogId = (author, timestamp) => {
  return `${author}_${timestamp}_history`;
};

/**
 * Extract browser worker number from author string
 * @param {string} author - Author string like "browser_worker_6"
 * @returns {number|null} Worker number or null if not found
 */
const extractBrowserWorkerNumber = (author) => {
  const match = author?.match(/browser_worker_(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

/**
 * Extract slide generator number from author string
 * @param {string} author - Author string like "enhanced_slide_generator_4"
 * @returns {number|null} Slide number or null if not found
 */
const extractSlideGeneratorNumber = (author) => {
  const match = author?.match(/enhanced_slide_generator_(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

const stripJsonCodeFences = (value) => {
  if (typeof value !== "string") return value;
  return value
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim();
};

const safeParseJson = (value) => {
  if (!value) return null;
  const target = typeof value === "string" ? stripJsonCodeFences(value) : value;
  if (typeof target !== "string") {
    return target;
  }
  try {
    return JSON.parse(target);
  } catch (error) {
    console.warn(
      "[HistoryParser] Failed to parse JSON payload:",
      error.message,
    );
    return null;
  }
};

/**
 * Parse a single log entry from history
 * Routes to appropriate parser based on author type
 *
 * @param {Object} logEntry - Raw log entry from history API
 * @param {Array} existingLogs - Previously processed logs (for browser workers)
 * @returns {Object|null} Formatted log entry or null if invalid
 */
const parseHistoryLogEntry = (logEntry, existingLogs = []) => {
  if (!logEntry || !logEntry.author) {
    console.warn("[HistoryParser] Invalid log entry:", logEntry);
    return null;
  }

  const { author, timestamp } = logEntry;

  try {
    // Route to appropriate parser based on author
    switch (author) {
      case "user":
        return parseHistoryUserMessage(logEntry);

      case "presentation_spec_extractor_agent":
        return parseHistoryPresentationSpecExtractor(logEntry);

      case "KeywordResearchAgent":
        return parseHistoryKeywordResearchAgent(logEntry);

      case "lightweight_planning_agent":
        return parseHistoryLightweightPlanningAgent(logEntry);

      case "LightweightSlideGeneration":
        return parseHistoryLightweightSlideGeneration(logEntry);

      case "multi_slide_modification_orchestrator":
        return parseHistoryMultiSlideModification(logEntry);

      case "single_slide_modifier":
        return parseHistorySingleSlideModifier(logEntry);

      case "slide_insertion_orchestrator":
        return parseHistorySlideInsertionOrchestrator(logEntry);

      case "slide_orchestration_agent":
        return parseHistorySlideOrchestrationAgent(logEntry);

      default:
        // Check if it's a browser worker
        if (author?.startsWith("browser_worker_")) {
          return parseHistoryBrowserWorker(logEntry, existingLogs);
        }

        // Check if it's a slide generator
        if (author?.startsWith("enhanced_slide_generator_")) {
          // Slide generators are handled separately, not as logs
          return null;
        }

        // Check for tool call agents (ends with _agent and not already handled)
        // Tool calls have parsed_output as a string, not JSON
        if (author?.endsWith("_agent")) {
          // Verify it's a tool call by checking parsed_output format
          // Early return, single trim for optimization
          const parsedOutput = logEntry.parsed_output;
          if (typeof parsedOutput === "string") {
            const trimmed = parsedOutput.trim();
            const isToolCall =
              trimmed.length > 0 && trimmed[0] !== "{" && trimmed[0] !== "[";

            if (isToolCall) {
              return parseHistoryToolCall(logEntry);
            }
          }
        }

        // Unknown author - create generic log
        console.warn("[HistoryParser] Unknown author type:", author);
        return {
          id: generateHistoryLogId(author, timestamp),
          author: author || "unknown",
          data: { ...logEntry },
          timestamp: timestamp || new Date().toISOString(),
          phase: "unknown",
        };
    }
  } catch (error) {
    console.error("[HistoryParser] Error parsing log entry:", error, logEntry);
    return null;
  }
};

/**
 * Parse tool call from history
 * History tool calls have parsed_output as a string (not JSON)
 *
 * @param {Object} logEntry - History log entry
 * @returns {Object} Formatted log entry
 */
const parseHistoryToolCall = (logEntry) => {
  const { author, timestamp, parsed_output } = logEntry;

  // parsed_output is a string for tool calls (e.g., "checking topic")
  const toolCallText =
    typeof parsed_output === "string"
      ? parsed_output
      : parsed_output?.text || parsed_output?.content || "";

  const log = {
    id: generateHistoryLogId(author, timestamp),
    author: author || "unknown_agent",
    text: toolCallText,
    content: toolCallText, // For UI compatibility
    timestamp: timestamp || new Date().toISOString(),
    phase: "planning",
  };

  return enrichLogEntry(log);
};

/**
 * Parse user message from history
 * @param {Object} logEntry - History log entry
 * @returns {Object} Formatted log entry
 */
const parseHistoryUserMessage = (logEntry) => {

  const log = {
    id: generateHistoryLogId("user", logEntry.timestamp),
    author: "user",
    content: logEntry.user_message || logEntry.content || "",
    timestamp: logEntry.timestamp || new Date().toISOString(),
    phase: "planning",
    // Preserve file_urls if present (array of {name, url} objects)
    file_urls: Array.isArray(logEntry.file_urls) ? logEntry.file_urls : null,
  };

  return enrichLogEntry(log);
};

/**
 * Parse presentation spec extractor from history
 * @param {Object} logEntry - History log entry
 * @returns {Object} Object containing log entry and metadata
 */
const parseHistoryPresentationSpecExtractor = (logEntry) => {

  let parsedOutput = {};

  // Parse the JSON string in parsed_output
  if (logEntry.parsed_output) {
    try {
      parsedOutput = JSON.parse(logEntry.parsed_output);
    } catch (error) {
      console.error(
        "[HistoryParser] Error parsing presentation spec output:",
        error,
      );
    }
  }

  const formattedLog = {
    id: generateHistoryLogId(
      "presentation_spec_extractor_agent",
      logEntry.timestamp,
    ),
    author: "presentation_spec_extractor_agent",
    colorTheme: parsedOutput.color_theme || null,
    tags: Array.isArray(parsedOutput.content_focus)
      ? parsedOutput.content_focus
      : [],
    timestamp: logEntry.timestamp || new Date().toISOString(),
    phase: "planning",
  };

  const enrichedFormattedLog = enrichLogEntry(formattedLog);

  // Extract metadata
  const metadata = {
    totalSlides: parsedOutput.slide_count || 0,
    title: parsedOutput.topic || "Generating...",
  };

  return { logEntry: enrichedFormattedLog, metadata };
};

/**
 * Parse keyword research agent from history
 * @param {Object} logEntry - History log entry
 * @returns {Object} Formatted log entry
 */
const parseHistoryKeywordResearchAgent = (logEntry) => {

  let keywords = [];

  // Parse the JSON string in parsed_output
  if (logEntry.parsed_output) {
    try {
      const parsedOutput = JSON.parse(logEntry.parsed_output);
      keywords = Array.isArray(parsedOutput.keywords)
        ? parsedOutput.keywords
        : [];
    } catch (error) {
      console.error("[HistoryParser] Error parsing keywords:", error);
    }
  }

  const log = {
    id: generateHistoryLogId("KeywordResearchAgent", logEntry.timestamp),
    author: "KeywordResearchAgent",
    keywords,
    timestamp: logEntry.timestamp || new Date().toISOString(),
    phase: "research",
  };

  return enrichLogEntry(log);
};

/**
 * Parse browser worker from history
 * Aggregates multiple messages from the same worker
 *
 * @param {Object} logEntry - History log entry
 * @param {Array} existingLogs - Previously processed browser worker logs
 * @returns {Object} Formatted browser worker log entry
 */
const parseHistoryBrowserWorker = (logEntry, existingLogs = []) => {

  const workerNumber = extractBrowserWorkerNumber(logEntry.author);
  const workerAuthor = `browser_worker_${workerNumber}`;

  // Find existing log for this worker
  const existingLog = existingLogs.find((log) => log.author === workerAuthor);

  let parsedOutput = {};

  // Parse the JSON string in parsed_output
  if (logEntry.parsed_output) {
    try {
      parsedOutput = JSON.parse(logEntry.parsed_output);
    } catch (error) {
      console.error(
        "[HistoryParser] Error parsing browser worker output:",
        error,
      );
    }
  }

  // Check if this entry has a summary (final message)
  const hasSummary = !!parsedOutput.summary;

  if (existingLog) {
    // Update existing log
    const updatedLog = {
      ...existingLog,
      links: [...(existingLog.links || [])],
      summary: hasSummary ? parsedOutput.summary : existingLog.summary,
      lastUpdated: logEntry.timestamp || new Date().toISOString(),
    };

    // Add new link if present
    if (parsedOutput.domain && parsedOutput.url) {
      updatedLog.links.push({
        domain: parsedOutput.domain,
        url: parsedOutput.url,
        timestamp: logEntry.timestamp || new Date().toISOString(),
      });
    }

    return enrichLogEntry(updatedLog);
  } else {
    // Create new log entry
    const newLog = {
      id: generateHistoryLogId(workerAuthor, logEntry.timestamp),
      author: workerAuthor,
      workerNumber,
      links: [],
      summary: hasSummary ? parsedOutput.summary : null,
      timestamp: logEntry.timestamp || new Date().toISOString(),
      lastUpdated: logEntry.timestamp || new Date().toISOString(),
      phase: "research",
    };

    // Add initial link if present
    if (parsedOutput.domain && parsedOutput.url) {
      newLog.links.push({
        domain: parsedOutput.domain,
        url: parsedOutput.url,
        timestamp: logEntry.timestamp || new Date().toISOString(),
      });
    }

    return enrichLogEntry(newLog);
  }
};

/**
 * Parse lightweight planning agent from history
 * @param {Object} logEntry - History log entry
 * @returns {Object} Formatted log entry
 */
const parseHistoryLightweightPlanningAgent = (logEntry) => {

  let parsedOutput = {};

  // Parse the JSON string in parsed_output
  if (logEntry.parsed_output) {
    try {
      parsedOutput = JSON.parse(logEntry.parsed_output);
    } catch (error) {
      console.error(
        "[HistoryParser] Error parsing planning agent output:",
        error,
      );
    }
  }

  const log = {
    id: generateHistoryLogId("lightweight_planning_agent", logEntry.timestamp),
    author: "lightweight_planning_agent",
    data: parsedOutput,
    timestamp: logEntry.timestamp || new Date().toISOString(),
    phase: "planning",
  };

  return enrichLogEntry(log);
};

/**
 * Parse lightweight slide generation from history
 * @param {Object} logEntry - History log entry
 * @returns {Object} Formatted log entry
 */
const parseHistoryLightweightSlideGeneration = (logEntry) => {

  const log = {
    id: generateHistoryLogId("LightweightSlideGeneration", logEntry.timestamp),
    author: "LightweightSlideGeneration",
    text: logEntry.parsed_output || "",
    data: { parsed_output: logEntry.parsed_output },
    timestamp: logEntry.timestamp || new Date().toISOString(),
    phase: "generation",
  };

  return enrichLogEntry(log);
};

const parseHistoryMultiSlideModification = (logEntry) => {

  const parsedPayload = safeParseJson(logEntry.parsed_output);
  const modifications = parsedPayload?.modifications;

  let summaryText = parsedPayload?.summary || logEntry.parsed_output;

  if (
    !summaryText &&
    Array.isArray(modifications) &&
    modifications.length > 0
  ) {
    const items = modifications
      .map((mod) => {
        const slideNumber =
          mod.slide_number ??
          mod.slideNumber ??
          (mod.slide_index !== undefined ? mod.slide_index + 1 : null) ??
          "?";
        const type =
          mod.modification_type ||
          mod.type ||
          mod.instruction ||
          "modification";
        return `Slide ${slideNumber}: ${type}`;
      })
      .join("; ");
    summaryText = `Modification request parsed – ${items}`;
  }

  const log = {
    id: generateHistoryLogId(
      "multi_slide_modification_orchestrator",
      logEntry.timestamp,
    ),
    author: "multi_slide_modification_orchestrator",
    timestamp: logEntry.timestamp || new Date().toISOString(),
    phase: "generation",
    text: summaryText || "Slide modification orchestrator update",
    data: {
      modifications: modifications || null,
    },
  };

  return enrichLogEntry(log);
};

const parseHistorySingleSlideModifier = (logEntry) => {

  const text =
    logEntry.parsed_output ||
    logEntry.text ||
    (typeof logEntry.content === "string" ? logEntry.content : null) ||
    "Slide modifier update";

  const log = {
    id: generateHistoryLogId("single_slide_modifier", logEntry.timestamp),
    author: "single_slide_modifier",
    timestamp: logEntry.timestamp || new Date().toISOString(),
    phase: "generation",
    text,
    data: {
      eventId: logEntry.event_id,
    },
  };

  return enrichLogEntry(log);
};

/**
 * Check if text contains markdown syntax
 * @param {string} text - Text to check
 * @returns {boolean} True if text appears to contain markdown
 */
const containsMarkdown = (text) => {
  if (!text || typeof text !== "string") return false;

  // Common markdown patterns
  const markdownPatterns = [
    /^#{1,6}\s/m, // Headers
    /\*\*.*?\*\*/, // Bold
    /\*.*?\*/, // Italic
    /`.*?`/, // Inline code
    /```[\s\S]*?```/, // Code blocks
    /^\s*[-*+]\s/m, // Unordered lists
    /^\s*\d+\.\s/m, // Ordered lists
    /\[.*?\]\(.*?\)/, // Links
    /^>\s/m, // Blockquotes
    /\|.*\|/, // Tables
  ];

  return markdownPatterns.some((pattern) => pattern.test(text));
};

/**
 * Parse slide insertion orchestrator from history
 * Handles parsed_output field from history and normalizes to text/content
 * Detects and preserves markdown formatting
 * @param {Object} logEntry - History log entry
 * @returns {Object} Formatted log entry
 */
const parseHistorySlideInsertionOrchestrator = (logEntry) => {

  // From history: parsed_output contains the message (can be string or object)
  // Normalize to text/content for consistent display
  let textContent = "";

  if (logEntry.parsed_output) {
    // If parsed_output is a string, use it directly
    if (typeof logEntry.parsed_output === "string") {
      textContent = logEntry.parsed_output;
    } else if (typeof logEntry.parsed_output === "object") {
      // If it's an object, try to extract text or stringify
      textContent =
        logEntry.parsed_output.text ||
        logEntry.parsed_output.message ||
        JSON.stringify(logEntry.parsed_output);
    }
  }

  // Check if content contains markdown
  const hasMarkdown = containsMarkdown(textContent);

  const log = {
    id: generateHistoryLogId(
      "slide_insertion_orchestrator",
      logEntry.timestamp,
    ),
    author: "slide_insertion_orchestrator",
    text: textContent,
    content: textContent, // Also set content for UI compatibility
    hasMarkdown, // Flag to indicate markdown content
    data: { parsed_output: logEntry.parsed_output },
    timestamp: logEntry.timestamp || new Date().toISOString(),
    phase: "generation",
  };

  return enrichLogEntry(log);
};

/**
 * Parse slide orchestration agent from history
 * Handles parsed_output field from history and normalizes to text/content
 * Detects and preserves markdown formatting
 * @param {Object} logEntry - History log entry
 * @returns {Object} Formatted log entry
 */
const parseHistorySlideOrchestrationAgent = (logEntry) => {

  // From history: parsed_output contains the message (can be string or object)
  // Normalize to text/content for consistent display
  let textContent = "";

  if (logEntry.parsed_output) {
    // If parsed_output is a string, use it directly
    if (typeof logEntry.parsed_output === "string") {
      textContent = logEntry.parsed_output;
    } else if (typeof logEntry.parsed_output === "object") {
      // If it's an object, try to extract text or stringify
      textContent =
        logEntry.parsed_output.text ||
        logEntry.parsed_output.message ||
        JSON.stringify(logEntry.parsed_output);
    }
  }

  // Check if content contains markdown
  const hasMarkdown = containsMarkdown(textContent);

  const log = {
    id: generateHistoryLogId("slide_orchestration_agent", logEntry.timestamp),
    author: "slide_orchestration_agent",
    text: textContent,
    content: textContent, // Also set content for UI compatibility
    hasMarkdown, // Flag to indicate markdown content
    data: { parsed_output: logEntry.parsed_output },
    timestamp: logEntry.timestamp || new Date().toISOString(),
    phase: "generation",
  };

  return enrichLogEntry(log);
};

/**
 * Parse slide data from history
 * Extracts slide information from the slides array in the response
 *
 * @param {Array} slidesArray - Array of slide objects from history
 * @returns {Array} Array of formatted slide entries
 */
const parseHistorySlides = (slidesArray = []) => {

  if (!Array.isArray(slidesArray) || slidesArray.length === 0) {
    return [];
  }

  return slidesArray
    .map((slide) => {
      const slideNumber = slide.slide_number;
      const slideAuthor = `enhanced_slide_generator_${slideNumber}`;

      return {
        id: generateHistoryLogId(slideAuthor, slide.timestamp),
        slideNumber,
        author: slideAuthor,
        thinking: slide.thinking || null,
        htmlContent: slide.html_content || null,
        timestamp: slide.timestamp || new Date().toISOString(),
        lastUpdated: slide.timestamp || new Date().toISOString(),
        isComplete: !!(slide.thinking && slide.html_content),
      };
    })
    .sort((a, b) => a.slideNumber - b.slideNumber);
};

/**
 * Main parser function for history data
 * Processes the entire /logs API response and structures it for Redux
 *
 * @param {Object} historyResponse - Raw response from /logs API
 * @returns {Object} Structured presentation state ready for Redux
 */
export const parseHistoryData = (historyResponse) => {

  if (!historyResponse) {
    console.error("[HistoryParser] No history response provided");
    return null;
  }

  try {
    const { logs, slides, status } = historyResponse;

    // Parse logs with aggregation for browser workers
    const parsedLogs = [];
    let extractedMetadata = null;

    if (Array.isArray(logs)) {

      logs.forEach((logEntry) => {
        const parsed = parseHistoryLogEntry(logEntry, parsedLogs);

        if (parsed) {
          // Check if this is presentation spec extractor (has metadata)
          if (logEntry.author === "presentation_spec_extractor_agent") {
            extractedMetadata = parsed.metadata;
            parsedLogs.push(parsed.logEntry);
          }
          // Check if it's a browser worker (needs special handling)
          else if (logEntry.author?.startsWith("browser_worker_")) {
            // Find and update existing or add new
            const existingIndex = parsedLogs.findIndex(
              (log) => log.author === parsed.author,
            );

            if (existingIndex !== -1) {
              parsedLogs[existingIndex] = parsed;
            } else {
              parsedLogs.push(parsed);
            }
          }
          // Regular log entry
          else {
            parsedLogs.push(parsed);
          }
        }
      });
    }

    // Parse slides
    const parsedSlides = parseHistorySlides(slides);

    // Construct the final state object
    const parsedState = {
      logs: parsedLogs,
      slides: parsedSlides,
      status: status === "completed" ? "completed" : "idle",
      presentationStatus: status || null,
      _replaceArrays: true, // Flag to indicate this is history data (should replace existing)
    };

    // Add metadata if extracted
    if (extractedMetadata) {
      parsedState.title = extractedMetadata.title;
      parsedState.totalSlides = extractedMetadata.totalSlides;
    }

    return parsedState;
  } catch (error) {
    console.error("[HistoryParser] Error parsing history data:", error);
    return null;
  }
};

/**
 * Utility function to validate parsed history data
 * @param {Object} parsedData - Parsed history data
 * @returns {boolean} True if data is valid
 */
export const validateHistoryData = (parsedData) => {
  if (!parsedData) {
    return false;
  }

  const hasValidLogs = Array.isArray(parsedData.logs);
  const hasValidSlides = Array.isArray(parsedData.slides);
  const hasValidStatus = typeof parsedData.status === "string";

  return hasValidLogs && hasValidSlides && hasValidStatus;
};

/**
 * Extract presentation summary from history data
 * @param {Object} historyResponse - Raw history response
 * @returns {Object} Summary information
 */
export const extractPresentationSummary = (historyResponse) => {
  if (!historyResponse) {
    return null;
  }

  const { logs, slides, status } = historyResponse;

  // Find presentation spec extractor for metadata
  const specExtractor = logs?.find(
    (log) => log.author === "presentation_spec_extractor_agent",
  );

  let title = "Presentation";
  let totalSlides = 0;

  if (specExtractor?.parsed_output) {
    try {
      const parsed = JSON.parse(specExtractor.parsed_output);
      title = parsed.topic || title;
      totalSlides = parsed.slide_count || 0;
    } catch (error) {
      console.error("[HistoryParser] Error extracting summary:", error);
    }
  }

  return {
    title,
    totalSlides,
    actualSlides: slides?.length || 0,
    status: status || "unknown",
    hasLogs: logs?.length > 0,
    hasSlides: slides?.length > 0,
  };
};
