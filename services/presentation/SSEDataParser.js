/**
 * SSEDataParser - Transforms raw SSE events into UI-friendly format
 *
 * Usage:
 * ```javascript
 * import SSEDataParser from './SSEDataParser';
 *
 * const parser = new SSEDataParser();
 * const result = parser.parseEvent(rawEventData);
 *
 * if (result) {
 *   if (result.type === 'log') {
 *     // Add to logs array
 *   } else if (result.type === 'slide') {
 *     // Add to slides array
 *   }
 * }
 * ```
 */

/**
 * SSEDataParser - Transforms raw SSE events into UI-friendly format
 *
 * Responsibilities:
 * 1. Parse and format event data according to agent type
 * 2. Group related events (keywords + search results)
 * 3. Maintain order and consistency
 * 4. Handle late-arriving data gracefully
 */
export default class SSEDataParser {
  constructor() {
    // Temporary storage for incomplete data
    this.pendingKeywordSearches = new Map(); // keyword -> {keyword, links: [], summary: null}
    this.pendingSlides = new Map(); // slideNumber -> {thinking: null, html_content: null}
    this.processedEventIds = new Set(); // Prevent duplicate processing
  }

  /**
   * Main parsing method - routes events to appropriate handlers
   */
  parseEvent(data) {
    // Prevent duplicate processing
    if (data.id && this.processedEventIds.has(data.id)) {
      return null;
    }

    if (data.id) {
      this.processedEventIds.add(data.id);
    }

    const author = data.author || data.agent_name;
    const timestamp = data.at || data.timestamp || new Date().toISOString();

    // Route to appropriate parser based on author/agent
    if (author === "vibe_estimator_agent") {
      return this.parseVibeEstimator(data, timestamp);
    }

    if (author === "KeywordResearchAgent") {
      return this.parseKeywordResearch(data, timestamp);
    }

    if (author && author.startsWith("browser_worker_")) {
      return this.parseBrowserWorker(data, timestamp);
    }

    if (author === "lightweight_planning_agent") {
      return this.parseLightweightPlanning(data, timestamp);
    }

    if (author === "LightweightSlideGeneration") {
      return this.parseLightweightSlideGeneration(data, timestamp);
    }

    if (author && author.startsWith("enhanced_slide_generator_")) {
      return this.parseSlideGenerator(data, timestamp);
    }

    // Default log entry for unrecognized events
    return this.parseGenericLog(data, timestamp);
  }

  /**
   * Parse vibe estimator to extract title and slide count
   */
  parseVibeEstimator(data, timestamp) {
    try {
      const text = data.text || data.parsed_output || "";


      // Remove markdown code blocks
      const cleanText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");

      const parsed = JSON.parse(cleanText);

      return {
        type: "log",
        log: {
          id: data._id || `vibe_${timestamp}`,
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
        },
        metadata: {
          title: parsed.topic,
          totalSlides: parsed.slide_count,
        },
      };
    } catch (error) {
      console.error("Error parsing vibe_estimator_agent:", error);
      return this.parseGenericLog(data, timestamp);
    }
  }

  /**
   * Parse keyword research - initiate pending searches
   */
  parseKeywordResearch(data, timestamp) {
    try {
      const text = data.text || data.parsed_output || "";
      const cleanText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      const parsed = JSON.parse(cleanText);

      const keywords = parsed.keywords || [];

      // Initialize pending searches for each keyword
      keywords.forEach((keyword, index) => {
        this.pendingKeywordSearches.set(index, {
          keyword,
          links: [],
          summary: null,
          timestamp,
        });
      });

      return {
        type: "log",
        log: {
          id: data._id || `keyword_${timestamp}`,
          timestamp,
          agent: "KeywordResearchAgent",
          phase: "research",
          title: "Keyword Research Initiated",
          content: {
            keywords,
            totalKeywords: keywords.length,
          },
          display: "list",
        },
      };
    } catch (error) {
      console.error("Error parsing KeywordResearchAgent:", error);
      return this.parseGenericLog(data, timestamp);
    }
  }

  /**
   * Parse browser worker - collect URLs and summaries
   */
  parseBrowserWorker(data, timestamp) {
    try {
      // Extract worker index from author name (e.g., browser_worker_0 -> 0)
      const workerMatch = data.author.match(/browser_worker_(\d+)/);
      if (!workerMatch) {
        return null;
      }

      const workerIndex = parseInt(workerMatch[1], 10);
      const pending = this.pendingKeywordSearches.get(workerIndex);

      if (!pending) {
        console.warn(`No pending keyword search for worker ${workerIndex}`);
        return null;
      }

      // If this event has a URL, it's a search result link
      if (data.url) {
        pending.links.push({
          url: data.url,
          domain: data.domain,
          timestamp,
        });
        return null; // Don't emit yet, wait for summary
      }

      // If this event has a summary, the search is complete
      if (data.summary) {
        pending.summary = data.summary;

        // Emit the complete grouped search result
        const result = {
          type: "log",
          log: {
            id: data._id || `search_${workerIndex}_${timestamp}`,
            timestamp: pending.timestamp,
            agent: `browser_worker_${workerIndex}`,
            phase: "research",
            title: `Research: ${pending.keyword}`,
            content: {
              keyword: pending.keyword,
              links: pending.links,
              summary: pending.summary,
              totalSources: pending.links.length,
            },
            display: "research",
          },
        };

        // Clean up
        this.pendingKeywordSearches.delete(workerIndex);

        return result;
      }

      return null;
    } catch (error) {
      console.error("Error parsing browser_worker:", error);
      return null;
    }
  }

  /**
   * Parse lightweight planning agent
   */
  parseLightweightPlanning(data, timestamp) {
    try {
      const text = data.text || data.parsed_output || "";
      const cleanText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      const parsed = JSON.parse(cleanText);

      return {
        type: "log",
        log: {
          id: data._id || `planning_${timestamp}`,
          timestamp,
          agent: "lightweight_planning_agent",
          phase: "planning",
          title: "Presentation Structure",
          content: {
            metadata: parsed.presentation_metadata,
            theme: parsed.global_theme,
            slides: parsed.slide_outline.map((slide) => ({
              number: slide.slide_number,
              title: slide.slide_title,
              purpose: slide.slide_purpose,
              type: slide.suggested_type,
            })),
            totalSlides: parsed.slide_outline.length,
          },
          display: "planning",
        },
      };
    } catch (error) {
      console.error("Error parsing lightweight_planning_agent:", error);
      return this.parseGenericLog(data, timestamp);
    }
  }

  /**
   * Parse lightweight slide generation logs
   */
  parseLightweightSlideGeneration(data, timestamp) {
    const text = data.text || "";

    return {
      type: "log",
      log: {
        id: data._id || `slide_gen_${timestamp}`,
        timestamp,
        agent: "LightweightSlideGeneration",
        phase: "generation",
        title: "Slide Generation Progress",
        content: {
          message: text,
          isProgress:
            text.includes("✅") || text.includes("📦") || text.includes("🎨"),
        },
        display: "progress",
      },
    };
  }

  /**
   * Parse enhanced slide generator - group thinking + html_content
   */
  parseSlideGenerator(data, timestamp) {
    try {
      // Extract slide number from author (e.g., enhanced_slide_generator_1 -> 1)
      const generatorMatch = data.author.match(
        /enhanced_slide_generator_(\d+)/,
      );
      if (!generatorMatch) {
        return null;
      }

      const slideNumber = parseInt(generatorMatch[1], 10);

      // Get or create pending slide
      if (!this.pendingSlides.has(slideNumber)) {
        this.pendingSlides.set(slideNumber, {
          slideNumber,
          thinking: null,
          html_content: null,
          timestamp,
        });
      }

      const pendingSlide = this.pendingSlides.get(slideNumber);

      // Update with new data
      if (data.thinking) {
        pendingSlide.thinking = data.thinking;
      }

      if (data.html_content) {
        pendingSlide.html_content = data.html_content;
      }

      // If we have both thinking and html_content, emit the complete slide
      if (pendingSlide.thinking && pendingSlide.html_content) {
        const result = {
          type: "slide",
          slide: {
            slideNumber,
            thinking: pendingSlide.thinking,
            html_content: pendingSlide.html_content,
            timestamp: pendingSlide.timestamp,
          },
        };

        // Clean up
        this.pendingSlides.delete(slideNumber);

        return result;
      }

      // Not complete yet, don't emit
      return null;
    } catch (error) {
      console.error("Error parsing enhanced_slide_generator:", error);
      return null;
    }
  }

  /**
   * Parse generic/unknown log entries
   */
  parseGenericLog(data, timestamp) {
    return {
      type: "log",
      log: {
        id: data._id || `generic_${timestamp}`,
        timestamp,
        agent: data.author || data.agent_name || "unknown",
        phase: "unknown",
        title: data.author || "System Message",
        content: {
          message:
            data.text || data.message || data.parsed_output || "No content",
          raw: data,
        },
        display: "text",
      },
    };
  }

  /**
   * Flush any pending data (useful on disconnect/completion)
   */
  flushPending() {
    const results = [];

    // Flush incomplete keyword searches
    this.pendingKeywordSearches.forEach((pending, index) => {
      results.push({
        type: "log",
        log: {
          id: `flush_search_${index}`,
          timestamp: pending.timestamp,
          agent: `browser_worker_${index}`,
          phase: "research",
          title: `Research: ${pending.keyword} (incomplete)`,
          content: {
            keyword: pending.keyword,
            links: pending.links,
            summary: pending.summary || "Summary not yet available",
            totalSources: pending.links.length,
            incomplete: true,
          },
          display: "research",
        },
      });
    });

    // Flush incomplete slides
    this.pendingSlides.forEach((pending, slideNumber) => {
      results.push({
        type: "slide",
        slide: {
          slideNumber,
          thinking: pending.thinking || "Thinking process not captured",
          html_content:
            pending.html_content ||
            "<div>Slide content not yet available</div>",
          timestamp: pending.timestamp,
          incomplete: true,
        },
      });
    });

    // Clear all pending data
    this.pendingKeywordSearches.clear();
    this.pendingSlides.clear();

    return results;
  }

  /**
   * Reset parser state (useful when starting new presentation)
   */
  reset() {
    this.pendingKeywordSearches.clear();
    this.pendingSlides.clear();
    this.processedEventIds.clear();
  }
}
