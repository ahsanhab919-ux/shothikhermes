// File: src/utils/presentationDataParser.js
import { enrichLogEntry } from "@/utils/presentation/messageTypeClassifier.js";
/**
 * Presentation Data Parser
 *
 * This module handles parsing and formatting of socket events for presentation generation.
 * It processes various agent outputs and structures them for Redux storage.
 *
 * @module presentationDataParser
 */

/**
 * Generate a unique ID for log entries
 * @param {string} author - The author of the event
 * @param {string} timestamp - The timestamp of the event
 * @returns {string} Unique identifier
 */
const generateLogId = (author, timestamp) => {
  return `${author}_${timestamp}_${Date.now()}`;
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
  if (!match) return null;
  const parsed = parseInt(match[1], 10);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return parsed + 1;
};

const stripJsonCodeFences = (value) => {
  if (typeof value !== "string") {
    return value;
  }
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
    console.warn("[Parser] Failed to parse JSON payload:", error.message);
    return null;
  }
};

/**
 * Parse "connected" event
 * @param {Object} payload - Connected event payload
 * @returns {Object} Parsed session data
 */
export const parseConnectedEvent = (payload) => {

  return {
    sessionId: payload.session_id || null,
    pId: payload.p_id || null,
    userId: payload.user_id || null,
    workerId: payload.worker_id || null,
    timestamp: payload.timestamp || new Date().toISOString(),
  };
};

/**
 * Parse user message (author: "user")
 * @param {Object} message - Agent output message
 * @returns {Object} Formatted log entry
 */
export const parseUserMessage = (message) => {

  // Preserve user_message field for matching with optimistic logs
  const userMessageText = message.user_message || message.content || "";

  const logEntry = {
    id: generateLogId("user", message.timestamp),
    author: "user",
    user_message: userMessageText, // Preserve for matching
    content: userMessageText, // For UI display
    text: userMessageText, // Alternative field for UI
    timestamp: message.timestamp || new Date().toISOString(),
    phase: "planning",
    // Preserve file_urls if present (array of {name, url} objects or string URLs)
    file_urls: Array.isArray(message.file_urls)
      ? message.file_urls
      : message.file_urls
        ? [message.file_urls]
        : null,
  };

  // Enrich with messageType to have sync with real time logs and history logs
  return enrichLogEntry(logEntry);
};

/**
 * Parse presentation spec extractor agent output
 * @param {Object} message - Agent output message
 * @returns {Object} Contains both log entry and extracted metadata
 */
export const parsePresentationSpecExtractor = (message) => {

  const logEntry = {
    id: generateLogId("presentation_spec_extractor_agent", message.timestamp),
    author: "presentation_spec_extractor_agent",
    colorTheme: message.color_theme || null,
    tags: Array.isArray(message.content_focus) ? message.content_focus : [],
    timestamp: message.timestamp || new Date().toISOString(),
    phase: "planning",
  };

  const enrichedLogEntry = enrichLogEntry(logEntry);

  // Extracted metadata for separate Redux fields
  const metadata = {
    totalSlides: message.slide_count || 0,
    title: message.topic || "Generating...",
  };

  // Return structure matches history parser for consistency
  return { logEntry: enrichedLogEntry, metadata };
};

/**
 * Parse keyword research agent output
 * @param {Object} message - Agent output message
 * @returns {Object} Formatted log entry
 */
export const parseKeywordResearchAgent = (message) => {

  const logEntry = {
    id: generateLogId("KeywordResearchAgent", message.timestamp),
    author: "KeywordResearchAgent",
    keywords: Array.isArray(message.keywords) ? message.keywords : [],
    timestamp: message.timestamp || new Date().toISOString(),
    phase: "research",
  };

  return enrichLogEntry(logEntry);
};

export const parseMultiSlideModificationOrchestrator = (message) => {
  const parsedPayload =
    safeParseJson(message.tool_response?.result) ||
    safeParseJson(message.html_content) ||
    safeParseJson(message.text);

  const modifications = parsedPayload?.modifications;

  let summaryText = message.text;

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

  const logEntry = {
    id: generateLogId(
      "multi_slide_modification_orchestrator",
      message.timestamp,
    ),
    author: "multi_slide_modification_orchestrator",
    timestamp: message.timestamp || new Date().toISOString(),
    phase: "generation",
    text: summaryText || "Slide modification orchestrator update",
    data: {
      modifications: modifications || null,
      toolEvent: message.tool_event,
      toolName: message.tool_name,
    },
  };

  return enrichLogEntry(logEntry);
};

export const parseSingleSlideModifier = (message) => {

  const logEntry = {
    id: generateLogId("single_slide_modifier", message.timestamp),
    author: "single_slide_modifier",
    timestamp: message.timestamp || new Date().toISOString(),
    phase: "generation",
    text: message.text || message.content || "Slide modifier update",
    data: {
      agentName: message.agent_name,
      eventId: message.event_id,
    },
  };

  return enrichLogEntry(logEntry);
};

/**
 * Parse browser worker output
 * This handles incremental updates to browser worker logs
 *
 * @param {Object} message - Agent output message
 * @param {Array} existingLogs - Current logs array from Redux
 * @returns {Object} Contains updated/new log entry and update type
 */
export const parseBrowserWorker = (message, existingLogs = []) => {

  const workerNumber = extractBrowserWorkerNumber(message.author);
  const workerAuthor = `browser_worker_${workerNumber}`;

  // Find existing log for this worker
  const existingLogIndex = existingLogs.findIndex(
    (log) => log.author === workerAuthor,
  );

  // Check if this message contains a summary (final message for this worker)
  const hasSummary = !!message.summary;

  if (existingLogIndex !== -1) {
    // Update existing log
    const existingLog = existingLogs[existingLogIndex];

    const updatedLog = {
      ...existingLog,
      links: [...(existingLog.links || [])],
      summary: hasSummary ? message.summary : existingLog.summary,
      lastUpdated: message.timestamp || new Date().toISOString(),
    };

    // Add new link if domain and url are present
    if (message.domain && message.url) {
      updatedLog.links.push({
        domain: message.domain,
        url: message.url,
        timestamp: message.timestamp || new Date().toISOString(),
      });
    }

    return {
      type: "browser_worker",
      updateType: "update",
      logIndex: existingLogIndex,
      logEntry: enrichLogEntry(updatedLog),
      isComplete: hasSummary,
    };
  } else {
    // Create new log entry
    const newLog = {
      id: generateLogId(workerAuthor, message.timestamp),
      author: workerAuthor,
      workerNumber,
      links: [],
      summary: null,
      timestamp: message.timestamp || new Date().toISOString(),
      lastUpdated: message.timestamp || new Date().toISOString(),
      phase: "research",
    };

    // Add initial link if present
    if (message.domain && message.url) {
      newLog.links.push({
        domain: message.domain,
        url: message.url,
        timestamp: message.timestamp || new Date().toISOString(),
      });
    }

    // Add summary if present (in case first message has summary)
    if (hasSummary) {
      newLog.summary = message.summary;
    }

    return {
      type: "browser_worker",
      updateType: "create",
      logEntry: enrichLogEntry(newLog),
      isComplete: hasSummary,
    };
  }
};

/**
 * Parse lightweight planning agent output
 * @param {Object} message - Agent output message
 * @returns {Object} Formatted log entry
 */
export const parseLightweightPlanningAgent = (message) => {

  const logEntry = {
    id: generateLogId("lightweight_planning_agent", message.timestamp),
    author: "lightweight_planning_agent",
    data: { ...message }, // Store all data
    timestamp: message.timestamp || new Date().toISOString(),
    phase: "planning",
  };

  return enrichLogEntry(logEntry);
};

/**
 * Parse lightweight slide generation output
 * @param {Object} message - Agent output message
 * @returns {Object} Formatted log entry
 */
export const parseLightweightSlideGeneration = (message) => {

  const logEntry = {
    id: generateLogId("LightweightSlideGeneration", message.timestamp),
    author: "LightweightSlideGeneration",
    text: message.text || "",
    data: { ...message },
    timestamp: message.timestamp || new Date().toISOString(),
    phase: "generation",
  };

  return enrichLogEntry(logEntry);
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
 * Parse tool call agent output (Real-Time Socket Format)
 * Handles agents performing specific tool operations from socket events
 *
 * Real-time format:
 * - type: "tool_call"
 * - agent_name: "topic_checker_agent"
 * - text: "checking topic"
 *
 * @param {Object} message - Tool call message from socket
 * @returns {Object} Formatted log entry
 */
export const parseToolCall = (message) => {

  // Normalize agent_name to author for consistency
  const agentName = message.agent_name || message.author || "unknown_agent";
  // Real-time uses 'text' field
  const toolCallText = message.text || message.content || "";

  const logEntry = {
    id: generateLogId(agentName, message.timestamp),
    author: agentName, // Normalize agent_name to author
    text: toolCallText,
    content: toolCallText, // For UI compatibility
    timestamp: message.timestamp || new Date().toISOString(),
    phase: "planning", // Tool calls typically happen in planning phase
    // Preserve original fields for reference
    event_id: message.event_id,
    worker_id: message.worker_id,
  };

  return enrichLogEntry(logEntry);
};

/**
 * Parse slide insertion orchestrator output
 * Handles both streaming (text field) and normalizes for display
 * Detects and preserves markdown formatting
 * @param {Object} message - Agent output message
 * @returns {Object} Formatted log entry
 */
export const parseSlideInsertionOrchestrator = (message) => {

  // From streaming: text field contains the message
  // Normalize to text/content for consistent display
  const textContent = message.text || message.content || "";

  // Check if content contains markdown
  const hasMarkdown = containsMarkdown(textContent);

  const logEntry = {
    id: generateLogId("slide_insertion_orchestrator", message.timestamp),
    author: "slide_insertion_orchestrator",
    text: textContent,
    content: textContent, // Also set content for UI compatibility
    hasMarkdown, // Flag to indicate markdown content
    data: { ...message },
    timestamp: message.timestamp || new Date().toISOString(),
    phase: "generation",
  };

  return enrichLogEntry(logEntry);
};

/**
 * Parse slide orchestration agent output
 * Handles both streaming (text field) and normalizes for display
 * Detects and preserves markdown formatting
 * @param {Object} message - Agent output message
 * @returns {Object} Formatted log entry
 */
export const parseSlideOrchestrationAgent = (message) => {

  // From streaming: text field contains the message
  // Normalize to text/content for consistent display
  const textContent = message.text || message.content || "";

  // Check if content contains markdown
  const hasMarkdown = containsMarkdown(textContent);

  const logEntry = {
    id: generateLogId("slide_orchestration_agent", message.timestamp),
    author: "slide_orchestration_agent",
    text: textContent,
    content: textContent, // Also set content for UI compatibility
    hasMarkdown, // Flag to indicate markdown content
    data: { ...message },
    timestamp: message.timestamp || new Date().toISOString(),
    phase: "generation",
  };

  return enrichLogEntry(logEntry);
};

/**
 * Normalize tool_response message to match expected format
 * Handles parsing of tool_response.result JSON and extracting slide_index
 *
 * @param {Object} message - Raw tool_response message
 * @returns {Object} Normalized message
 */
const normalizeToolResponseMessage = (message) => {
  // Extract slide number from slide_index (preferred) or author pattern
  const slideNumber =
    message.slide_index !== undefined
      ? message.slide_index + 1
      : (extractSlideGeneratorNumber(message.author) ?? 0);

  // Construct author with number suffix for consistency
  const normalizedAuthor = `enhanced_slide_generator_${slideNumber}`;

  // Parse tool_response.result if it exists
  let thinking = null;
  let htmlContent = null;

  if (message.tool_response?.result) {
    try {
      const parsedResult = JSON.parse(message.tool_response.result);
      thinking =
        parsedResult.thinking ||
        parsedResult.thought ||
        message.thinking ||
        null;
      htmlContent =
        parsedResult.generated_html ||
        parsedResult.html_content ||
        parsedResult.htmlContent ||
        message.html_content ||
        null;
    } catch (e) {
      console.warn("[Parser] Failed to parse tool_response.result:", e.message);
      // Fallback to top-level fields
      thinking = message.thinking || null;
      htmlContent = message.html_content || null;
    }
  } else {
    // Use top-level fields directly
    thinking = message.thinking || null;
    htmlContent = message.html_content || null;
  }

  return {
    ...message,
    author: normalizedAuthor,
    thinking,
    html_content: htmlContent,
    // Preserve original slide_index for reference
    slide_index: slideNumber,
  };
};

/**
 * Parse enhanced slide generator output
 * This handles grouping of thinking and html_content by slide number
 * Now supports slide_index and detects insertions for reordering
 *
 * @param {Object} message - Agent output message
 * @param {Array} existingSlides - Current slides array from Redux
 * @returns {Object} Contains updated/new slide entry and update type
 */
export const parseEnhancedSlideGenerator = (message, existingSlides = []) => {

  // Try slide_index first, then extract from author
  const slideNumber =
    message.slide_index !== undefined
      ? message.slide_index + 1
      : (extractSlideGeneratorNumber(message.author) ?? null);

  if (slideNumber === null) {
    console.error("[Parser] Cannot determine slide number");
    return null;
  }

  const slideAuthor = `enhanced_slide_generator_${slideNumber}`;

  // Find existing slide for this number
  const existingSlideIndex = existingSlides.findIndex(
    (slide) => slide.slideNumber === slideNumber,
  );

  // Determine what data this message contains
  const hasThinking = !!message.thinking;
  const hasHtmlContent = !!message.html_content;

  // Check if this is an insertion (new slide at existing position)
  // Insertion occurs when:
  // 1. A slide already exists at this slideNumber
  // 2. The new message has complete data (thinking + html_content)
  // 3. The existing slide is also complete (both complete = insertion, not update)
  // This handles follow-up queries that add new slides at specific positions
  const existingSlide =
    existingSlideIndex !== -1 ? existingSlides[existingSlideIndex] : null;
  const isInsertion =
    existingSlideIndex !== -1 &&
    hasThinking &&
    hasHtmlContent &&
    existingSlide?.isComplete;

  if (existingSlideIndex !== -1 && !isInsertion) {
    // Update existing slide (normal update)
    const existingSlide = existingSlides[existingSlideIndex];

    const updatedSlide = {
      ...existingSlide,
      thinking: hasThinking ? message.thinking : existingSlide.thinking,
      htmlContent: hasHtmlContent
        ? message.html_content
        : existingSlide.htmlContent,
      lastUpdated: message.timestamp || new Date().toISOString(),
      isComplete:
        (hasThinking || existingSlide.thinking) &&
        (hasHtmlContent || existingSlide.htmlContent),
    };

    return {
      type: "slide",
      updateType: "update",
      slideIndex: existingSlideIndex,
      slideEntry: updatedSlide,
    };
  } else if (isInsertion) {
    // Insertion detected - new slide at existing position
    const newSlide = {
      id: generateLogId(slideAuthor, message.timestamp),
      slideNumber,
      author: slideAuthor,
      thinking: hasThinking ? message.thinking : null,
      htmlContent: hasHtmlContent ? message.html_content : null,
      timestamp: message.timestamp || new Date().toISOString(),
      lastUpdated: message.timestamp || new Date().toISOString(),
      isComplete: hasThinking && hasHtmlContent,
    };

    return {
      type: "slide",
      updateType: "insert",
      insertIndex: slideNumber,
      slideEntry: newSlide,
    };
  } else {
    // Create new slide entry (no conflict)
    const newSlide = {
      id: generateLogId(slideAuthor, message.timestamp),
      slideNumber,
      author: slideAuthor,
      thinking: hasThinking ? message.thinking : null,
      htmlContent: hasHtmlContent ? message.html_content : null,
      timestamp: message.timestamp || new Date().toISOString(),
      lastUpdated: message.timestamp || new Date().toISOString(),
      isComplete: hasThinking && hasHtmlContent,
    };

    return {
      type: "slide",
      updateType: "create",
      slideEntry: newSlide,
    };
  }
};

const parseSlideUpdateEvent = (message, existingSlides = []) => {
  const slideNumber =
    message.slide_number ??
    (message.slide_index !== undefined ? message.slide_index + 1 : null);

  if (slideNumber === null) {
    console.warn("[Parser] slide update missing slide number", message);
    return null;
  }

  const normalizedMessage = {
    ...message,
    author: `enhanced_slide_generator_${slideNumber}`,
    slide_index: slideNumber - 1,
  };

  if (message.html_content || message.htmlContent) {
    normalizedMessage.html_content =
      message.html_content || message.htmlContent;
  }

  if (message.thinking || message.thought) {
    normalizedMessage.thinking = message.thinking || message.thought;
  }

  const parsed = parseEnhancedSlideGenerator(normalizedMessage, existingSlides);

  return parsed;
};

/**
 * Main parser function that routes messages to appropriate handlers
 *
 * @param {Object} message - Raw agent output message
 * @param {Object} currentState - Current Redux state for context
 * @returns {Object} Parsed data with update instructions
 */
export const parseAgentOutput = (message, currentState = {}) => {
  if (
    message.type === "slide_html_update" ||
    message.type === "slide_thinking_update" ||
    message.type === "slide_update"
  ) {
    const parsedUpdate = parseSlideUpdateEvent(
      message,
      currentState.slides || [],
    );
    if (parsedUpdate) {
      return { type: "slide", ...parsedUpdate };
    }
  }

  // Check for tool_call type FIRST (before author-based routing)
  if (message.type === "tool_call") {
    return {
      type: "log",
      data: parseToolCall(message),
    };
  }

  // Check for tool_response type (enhanced slide generator)
  if (
    message.type === "tool_response" &&
    message.author === "enhanced_slide_generator"
  ) {
    // Normalize message format before passing to parser
    const normalizedMessage = normalizeToolResponseMessage(message);
    const parsed = parseEnhancedSlideGenerator(
      normalizedMessage,
      currentState.slides || [],
    );
    if (parsed) {
      return { type: "slide", ...parsed };
    }
    // If parsing fails, fall through to default handling
  }

  const { author } = message;

  if (author === "enhanced_slide_generator") {
    const parsedUpdate = parseSlideUpdateEvent(
      message,
      currentState.slides || [],
    );
    if (parsedUpdate) {
      return { type: "slide", ...parsedUpdate };
    }
  }

  // Route to appropriate parser based on author
  if (author === "user") {
    return {
      type: "log",
      data: parseUserMessage(message),
    };
  }

  if (author === "presentation_spec_extractor_agent") {
    const parsed = parsePresentationSpecExtractor(message);
    return {
      type: "log_with_metadata",
      data: parsed.logEntry,
      metadata: parsed.metadata,
    };
  }

  if (author === "KeywordResearchAgent") {
    return {
      type: "log",
      data: parseKeywordResearchAgent(message),
    };
  }

  if (author === "multi_slide_modification_orchestrator") {
    return {
      type: "log",
      data: parseMultiSlideModificationOrchestrator(message),
    };
  }

  if (author === "single_slide_modifier") {
    return {
      type: "log",
      data: parseSingleSlideModifier(message),
    };
  }

  if (author?.startsWith("browser_worker_")) {
    const parsed = parseBrowserWorker(message, currentState.logs || []);
    return {
      type: "browser_worker",
      ...parsed,
    };
  }

  if (author === "lightweight_planning_agent") {
    return {
      type: "log",
      data: parseLightweightPlanningAgent(message),
    };
  }

  if (author === "LightweightSlideGeneration") {
    return {
      type: "log",
      data: parseLightweightSlideGeneration(message),
    };
  }

  if (author === "slide_insertion_orchestrator") {
    return {
      type: "log",
      data: parseSlideInsertionOrchestrator(message),
    };
  }

  if (author === "slide_orchestration_agent") {
    return {
      type: "log",
      data: parseSlideOrchestrationAgent(message),
    };
  }

  if (author?.startsWith("enhanced_slide_generator_")) {
    const parsed = parseEnhancedSlideGenerator(
      message,
      currentState.slides || [],
    );
    return {
      type: "slide",
      ...parsed,
    };
  }

  // Unknown author - store as generic log
  console.warn("[Parser] Unknown author type:", author);
  return {
    type: "log",
    data: {
      id: generateLogId(author || "unknown", message.timestamp),
      author: author || "unknown",
      data: { ...message },
      timestamp: message.timestamp || new Date().toISOString(),
      phase: "unknown",
    },
  };
};

/**
 * Parse terminal/completion event
 * @param {Object} message - Terminal event message
 * @returns {Object} Status update
 */
export const parseTerminalEvent = (message) => {

  return {
    status: message.status || "completed",
    event: message.event,
    timestamp: message.timestamp || new Date().toISOString(),
  };
};

/**
 * Check if a log entry already exists (for deduplication)
 * @param {Object} newLog - New log entry to check
 * @param {Array} existingLogs - Existing logs array
 * @returns {boolean} True if log already exists
 */
const isLogDuplicate = (newLog, existingLogs) => {
  // Check by ID first (most reliable)
  if (newLog.id && existingLogs.some((log) => log.id === newLog.id)) {
    return true;
  }

  // For browser workers and slides, check by author + timestamp
  if (newLog.author && newLog.timestamp) {
    return existingLogs.some(
      (log) =>
        log.author === newLog.author && log.timestamp === newLog.timestamp,
    );
  }

  return false;
};

/**
 * Check if a slide entry already exists (for deduplication).
 * @param {Object} newSlide - New slide entry to check
 * @param {Array} existingSlides - Existing slides array
 * @returns {boolean} True if slide already exists
 */
const isSlideDuplicate = (newSlide, existingSlides) => {
  // Check by ID first
  if (newSlide.id && existingSlides.some((slide) => slide.id === newSlide.id)) {
    return true;
  }

  // Check by slide number
  return existingSlides.some(
    (slide) => slide.slideNumber === newSlide.slideNumber,
  );
};

// Export these for use in Redux
export { isLogDuplicate, isSlideDuplicate };
