export interface ParsedCommand {
  action: "research" | "create_presentation" | "verify" | "sources" | "outline" | "rewrite" | "image" | "unknown";
  topic: string;
  generateSlides: boolean;
  originalInput: string;
  confidence: number;
  metadata?: {
    slideNumber?: number;
    presentationType?: string;
  };
}

const PRESENTATION_TRIGGERS = [
  "create slides",
  "make slides",
  "build slides",
  "generate slides",
  "create presentation",
  "make presentation",
  "build presentation",
  "generate presentation",
  "create a deck",
  "make a deck",
  "build a deck",
  "pitch deck",
  "i need slides",
  "i need a presentation",
  "help me create slides",
  "help me make slides",
  "presentation about",
  "presentation on",
  "slides about",
  "slides on",
  "slide deck",
];

const RESEARCH_TRIGGERS = [
  "research",
  "find information",
  "look up",
  "investigate",
  "learn about",
  "tell me about",
  "what do you know about",
  "information on",
  "data on",
  "facts about",
];

const VERIFY_TRIGGERS = [
  "verify",
  "fact check",
  "fact-check",
  "is it true",
  "check if",
  "validate",
  "confirm",
];

const OUTLINE_TRIGGERS = [
  "outline",
  "structure",
  "organize",
  "plan",
  "framework",
];

const REWRITE_TRIGGERS = [
  "rewrite",
  "improve",
  "enhance",
  "rephrase",
  "reword",
  "make better",
];

const IMAGE_TRIGGERS = [
  "image",
  "picture",
  "photo",
  "graphic",
  "visual",
  "find images",
];

export function parseNaturalLanguage(input: string): ParsedCommand {
  const lowerInput = input.toLowerCase().trim();
  
  // Handle empty input
  if (!lowerInput) {
    return {
      action: "unknown",
      topic: "",
      generateSlides: false,
      originalInput: input,
      confidence: 0,
    };
  }

  // Check for slash commands first (exact matches)
  if (lowerInput.startsWith("/")) {
    return parseSlashCommand(input);
  }

  // Detect presentation creation (highest priority)
  for (const trigger of PRESENTATION_TRIGGERS) {
    if (lowerInput.includes(trigger)) {
      const topic = extractTopic(lowerInput, trigger);
      return {
        action: "create_presentation",
        topic,
        generateSlides: true,
        originalInput: input,
        confidence: 0.9,
      };
    }
  }

  // Detect research requests
  for (const trigger of RESEARCH_TRIGGERS) {
    if (lowerInput.includes(trigger)) {
      const topic = extractTopic(lowerInput, trigger);
      // Check if they also want slides
      const wantsSlides = PRESENTATION_TRIGGERS.some(t => lowerInput.includes(t));
      return {
        action: "research",
        topic,
        generateSlides: wantsSlides,
        originalInput: input,
        confidence: 0.85,
      };
    }
  }

  // Detect verification requests
  for (const trigger of VERIFY_TRIGGERS) {
    if (lowerInput.includes(trigger)) {
      const claim = extractTopic(lowerInput, trigger);
      return {
        action: "verify",
        topic: claim,
        generateSlides: false,
        originalInput: input,
        confidence: 0.9,
      };
    }
  }

  // Detect outline requests
  for (const trigger of OUTLINE_TRIGGERS) {
    if (lowerInput.includes(trigger)) {
      const topic = extractTopic(lowerInput, trigger);
      return {
        action: "outline",
        topic,
        generateSlides: false,
        originalInput: input,
        confidence: 0.8,
      };
    }
  }

  // Detect rewrite requests
  for (const trigger of REWRITE_TRIGGERS) {
    if (lowerInput.includes(trigger)) {
      const slideMatch = lowerInput.match(/slide\s+#?(\d+)/);
      const slideNumber = slideMatch ? parseInt(slideMatch[1]) : undefined;
      return {
        action: "rewrite",
        topic: extractTopic(lowerInput, trigger),
        generateSlides: false,
        originalInput: input,
        confidence: 0.85,
        metadata: { slideNumber },
      };
    }
  }

  // Detect image requests
  for (const trigger of IMAGE_TRIGGERS) {
    if (lowerInput.includes(trigger)) {
      return {
        action: "image",
        topic: extractTopic(lowerInput, trigger),
        generateSlides: false,
        originalInput: input,
        confidence: 0.8,
      };
    }
  }

  // Default: treat as general query, suggest research
  return {
    action: "unknown",
    topic: input.trim(),
    generateSlides: false,
    originalInput: input,
    confidence: 0.3,
  };
}

function parseSlashCommand(input: string): ParsedCommand {
  const trimmed = input.trim();
  
  // /research command
  const researchMatch = trimmed.match(/^\/research\s+(.+?)(?:\s+(--slides))?$/);
  if (researchMatch) {
    return {
      action: "research",
      topic: researchMatch[1].trim(),
      generateSlides: !!researchMatch[2],
      originalInput: input,
      confidence: 1.0,
    };
  }

  // /verify command
  const verifyMatch = trimmed.match(/^\/verify\s+(.+)$/);
  if (verifyMatch) {
    return {
      action: "verify",
      topic: verifyMatch[1].trim(),
      generateSlides: false,
      originalInput: input,
      confidence: 1.0,
    };
  }

  // /sources command
  if (trimmed === "/sources") {
    return {
      action: "sources",
      topic: "",
      generateSlides: false,
      originalInput: input,
      confidence: 1.0,
    };
  }

  // /outline command
  const outlineMatch = trimmed.match(/^\/outline\s*(.*)$/);
  if (outlineMatch) {
    return {
      action: "outline",
      topic: outlineMatch[1].trim(),
      generateSlides: false,
      originalInput: input,
      confidence: 1.0,
    };
  }

  // /rewrite command
  const rewriteMatch = trimmed.match(/^\/rewrite\s+#?(\d+)$/);
  if (rewriteMatch) {
    return {
      action: "rewrite",
      topic: "",
      generateSlides: false,
      originalInput: input,
      confidence: 1.0,
      metadata: { slideNumber: parseInt(rewriteMatch[1]) },
    };
  }

  // /image command
  const imageMatch = trimmed.match(/^\/image\s*(.*)$/);
  if (imageMatch) {
    return {
      action: "image",
      topic: imageMatch[1].trim(),
      generateSlides: false,
      originalInput: input,
      confidence: 1.0,
    };
  }

  // Unknown slash command
  return {
    action: "unknown",
    topic: trimmed.substring(1),
    generateSlides: false,
    originalInput: input,
    confidence: 0,
  };
}

function extractTopic(input: string, trigger: string): string {
  const lowerInput = input.toLowerCase();
  const triggerIndex = lowerInput.indexOf(trigger);
  
  if (triggerIndex === -1) {
    return input.trim();
  }

  // Get text after the trigger
  let afterTrigger = input.substring(triggerIndex + trigger.length).trim();
  
  // Remove common prepositions at the start
  afterTrigger = afterTrigger.replace(/^(about|on|for|regarding|concerning|of)\s+/i, "");
  
  // Remove filler phrases that might appear at the end
  afterTrigger = afterTrigger.replace(/\s+(and\s+)?(make|create|generate|build)\s+(slides?|presentation|deck).*$/i, "");
  afterTrigger = afterTrigger.replace(/\s+for\s+me\s*$/i, "");
  afterTrigger = afterTrigger.replace(/\s+please\s*$/i, "");
  
  // Remove trailing punctuation
  afterTrigger = afterTrigger.replace(/[?.!]+$/, "");
  
  // If nothing left, try to get text before the trigger
  if (!afterTrigger) {
    let beforeTrigger = input.substring(0, triggerIndex).trim();
    
    // Remove filler phrases from the beginning
    beforeTrigger = beforeTrigger.replace(/^(i\s+need|i\s+want|can\s+you|please|help\s+me)\s+/i, "");
    beforeTrigger = beforeTrigger.replace(/^(to\s+)?/i, "");
    
    return beforeTrigger || input.trim();
  }
  
  return afterTrigger.trim();
}

export function formatConfirmationMessage(parsed: ParsedCommand): string {
  const { action, topic, generateSlides, confidence } = parsed;
  
  if (confidence < 0.5) {
    return `I'm not sure what you want me to do. Try:\n• "create slides about [topic]"\n• "/research [topic] --slides"\n• "verify [claim]"`;
  }

  switch (action) {
    case "create_presentation":
      return `🎯 I'll create a presentation about "${topic}"\n\n🔬 Starting research and slide generation...`;
    
    case "research":
      if (generateSlides) {
        return `🎯 I'll research "${topic}" and create slides\n\n🔬 Starting deep research...`;
      }
      return `🔬 Starting research on "${topic}"\n\n⏳ This may take a moment...`;
    
    case "verify":
      return `✓ I'll verify: "${topic}"\n\n🔍 Checking sources...`;
    
    case "outline":
      return `📋 Creating outline for: "${topic}"`;
    
    case "rewrite":
      if (parsed.metadata?.slideNumber) {
        return `✏️ Improving slide #${parsed.metadata.slideNumber}...`;
      }
      return `✏️ I'll help rewrite that content`;
    
    case "image":
      return `🖼️ Searching for images${topic ? ` related to "${topic}"` : ""}...`;
    
    case "sources":
      return `📚 Showing all citations...`;
    
    default:
      return `I'm not sure what you want. Try describing what you need in plain English!`;
  }
}
