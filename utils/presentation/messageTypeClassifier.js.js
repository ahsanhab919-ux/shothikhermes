/**
 * Message type constants - Single source of truth
 */
export const MESSAGE_TYPES = {
  USER: "user",
  SPEC_EXTRACTOR: "spec_extractor",
  KEYWORD_RESEARCH: "keyword_research",
  BROWSER_WORKER: "browser_worker",
  PLANNING: "planning",
  SLIDE_GENERATION: "slide_generation",
  SLIDE_INSERTION_ORCHESTRATOR: "slide_insertion_orchestrator",
  SLIDE_ORCHESTRATION_AGENT: "slide_orchestration_agent",
  TOOL_CALL: "tool_call", // NEW
  UNKNOWN: "unknown",
};

/**
 * Map of known tool call agents to their display names
 */
const TOOL_CALL_AGENT_NAMES = {
  topic_checker_agent: "Topic Checker",
  query_enhancer_agent: "Query Enhancer",
  // Add more as they appear
};

/**
 * Memoization cache for display names
 */
const displayNameCache = new Map();

/**
 * Get display name for tool call agent
 * Uses memoization for performance
 *
 * @param {string} agentName - Agent name (e.g., "topic_checker_agent")
 * @returns {string} Formatted display name (e.g., "Topic Checker")
 */
export function getToolCallAgentDisplayName(agentName) {
  if (!agentName) return "Tool";

  // Check cache first
  if (displayNameCache.has(agentName)) {
    return displayNameCache.get(agentName);
  }

  // Compute display name
  const displayName =
    TOOL_CALL_AGENT_NAMES[agentName] ||
    agentName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) ||
    "Tool";

  // Cache the result
  displayNameCache.set(agentName, displayName);
  return displayName;
}

/**
 * Clear the display name cache (useful for testing or memory management)
 */
export function clearDisplayNameCache() {
  displayNameCache.clear();
}

/**
 * Classify message type based on author
 * Used by BOTH real-time and history parsers
 */
export function classifyMessageType(author) {
  if (!author) return MESSAGE_TYPES.UNKNOWN;

  // Check known agent types first
  if (author === "user") return MESSAGE_TYPES.USER;
  if (author === "presentation_spec_extractor_agent")
    return MESSAGE_TYPES.SPEC_EXTRACTOR;
  if (author === "KeywordResearchAgent") return MESSAGE_TYPES.KEYWORD_RESEARCH;
  if (author.startsWith("browser_worker_")) return MESSAGE_TYPES.BROWSER_WORKER;
  if (author === "lightweight_planning_agent") return MESSAGE_TYPES.PLANNING;
  if (author === "LightweightSlideGeneration")
    return MESSAGE_TYPES.SLIDE_GENERATION;
  if (author === "enhanced_slide_generator")
    return MESSAGE_TYPES.SLIDE_GENERATION;
  if (author === "multi_slide_modification_orchestrator")
    return MESSAGE_TYPES.SLIDE_GENERATION;
  if (author === "single_slide_modifier") return MESSAGE_TYPES.SLIDE_GENERATION;
  if (author === "slide_insertion_orchestrator")
    return MESSAGE_TYPES.SLIDE_INSERTION_ORCHESTRATOR;
  if (author === "slide_orchestration_agent")
    return MESSAGE_TYPES.SLIDE_ORCHESTRATION_AGENT;

  // Check if it's a tool call agent (ends with _agent and not matched above)
  // Tool call agents are identified by ending with _agent
  if (author.endsWith("_agent")) {
    // Check if it's a known tool call agent or unknown agent ending with _agent
    if (TOOL_CALL_AGENT_NAMES[author] || author.endsWith("_agent")) {
      return MESSAGE_TYPES.TOOL_CALL;
    }
  }

  return MESSAGE_TYPES.UNKNOWN;
}

/**
 * Enrich log entry with messageType and computed flags
 * Used by BOTH parsers to ensure consistency
 */
export function enrichLogEntry(logEntry) {
  const messageType = classifyMessageType(logEntry.author);

  return {
    ...logEntry,
    messageType,
    // Pre-calculate common flags
    hasLinks: Array.isArray(logEntry.links) && logEntry.links.length > 0,
    hasSummary: !!logEntry.summary,
    hasKeywords:
      Array.isArray(logEntry.keywords) && logEntry.keywords.length > 0,
    hasData: !!logEntry.data,
    // Extract worker number for browser workers
    workerNumber:
      messageType === MESSAGE_TYPES.BROWSER_WORKER
        ? logEntry.workerNumber || parseInt(logEntry.author.split("_")[2])
        : null,
  };
}
