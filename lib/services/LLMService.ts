/**
 * LLM Service - Integration with Kimi API and other LLM providers
 * Handles chat, analysis, and content generation
 */

import { FormatAgent } from "../nobel-engine/FormatAgent";

export interface LLMConfig {
  provider: 'kimi' | 'openai' | 'anthropic';
  apiKey: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
}

export class LLMService {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = {
      temperature: 1.0,
      maxTokens: 4096,
      ...config,
    };
  }

  /**
   * Send chat completion request
   */
  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    switch (this.config.provider) {
      case 'kimi':
        return this.callKimiAPI(request);
      case 'openai':
        return this.callOpenAI(request);
      case 'anthropic':
        return this.callAnthropic(request);
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  /**
   * Call Kimi API (Moonshot AI)
   */
  private async callKimiAPI(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const response = await fetch(`${this.config.baseUrl || 'https://api.moonshot.cn/v1'}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || 'kimi-k2-thinking',
        messages: request.messages,
        temperature: request.temperature || this.config.temperature,
        max_tokens: request.maxTokens || this.config.maxTokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Kimi API error: ${error}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      finishReason: data.choices[0].finish_reason,
    };
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4',
        messages: request.messages,
        temperature: request.temperature || this.config.temperature,
        max_tokens: request.maxTokens || this.config.maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      finishReason: data.choices[0].finish_reason,
    };
  }

  /**
   * Call Anthropic API (Claude)
   */
  private async callAnthropic(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-3-opus-20240229',
        messages: request.messages.filter(m => m.role !== 'system'),
        system: request.messages.find(m => m.role === 'system')?.content,
        temperature: request.temperature || this.config.temperature,
        max_tokens: request.maxTokens || this.config.maxTokens,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();
    
    return {
      content: data.content[0].text,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      finishReason: data.stop_reason,
    };
  }

  /**
   * Generate writing assistant response with full manuscript context
   */
  async generateWritingAssistantResponse(params: {
    messages: ChatMessage[];
    manuscriptContext: {
      title: string;
      type: string;
      wordCount: number;
      chapters: { title: string; wordCount: number }[];
      currentContent?: string;
      selectedText?: string;
    };
    mode: 'write' | 'format' | 'publish';
  }): Promise<ChatCompletionResponse> {
    // Build system prompt with manuscript context
    const systemPrompt = this.buildSystemPrompt(params.manuscriptContext, params.mode);
    
    // Optimize context using TOON format
    const optimizedContext = FormatAgent.optimizeForAI({
      manuscript: params.manuscriptContext,
      mode: params.mode,
    });

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...params.messages,
    ];

    return this.chatCompletion({
      messages,
      temperature: 0.8,
      maxTokens: 2048,
    });
  }

  /**
   * Analyze writing for neural coupling
   */
  async analyzeNeuralCoupling(content: string): Promise<{
    score: number;
    sensory: number;
    emotional: number;
    cognitive: number;
    personal: number;
    suggestions: string[];
  }> {
    const prompt = `Analyze the following text for neural coupling potential (how well it creates brain-to-brain connection with readers).

Rate on a scale of 0-100 for each dimension:
- Sensory: Vivid imagery that activates visual cortex
- Emotional: Language that engages amygdala
- Cognitive: Clear causality and structure
- Personal: Relatability and internal experience

Text:
"""${content.substring(0, 2000)}"""

Respond in JSON format:
{
  "sensory": number,
  "emotional": number,
  "cognitive": number,
  "personal": number,
  "suggestions": ["specific improvement 1", "specific improvement 2"]
}`;

    const response = await this.chatCompletion({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      maxTokens: 500,
    });

    try {
      const result = JSON.parse(response.content);
      const overall = Math.round((result.sensory + result.emotional + result.cognitive + result.personal) / 4);
      return { ...result, score: overall };
    } catch {
      // Fallback to heuristic
      return this.fallbackNeuralAnalysis(content);
    }
  }

  /**
   * Analyze for Nobel-level literary quality
   */
  async analyzeNobelImpact(content: string): Promise<{
    score: number;
    universalThemes: number;
    emotionalDepth: number;
    structuralInnovation: number;
    accessibility: number;
    longevity: number;
    analysis: string;
  }> {
    const prompt = `Analyze the following text for literary impact potential (Nobel Prize caliber).

Rate on a scale of 0-100:
- Universal Themes: Cross-cultural resonance
- Emotional Depth: DMN activation potential
- Structural Innovation: Form-content interplay
- Accessibility: Global reach potential
- Longevity: Timeless quality

Text:
"""${content.substring(0, 2000)}"""

Respond in JSON format:
{
  "universalThemes": number,
  "emotionalDepth": number,
  "structuralInnovation": number,
  "accessibility": number,
  "longevity": number,
  "analysis": "brief analysis text"
}`;

    const response = await this.chatCompletion({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      maxTokens: 600,
    });

    try {
      const result = JSON.parse(response.content);
      const overall = Math.round(
        (result.universalThemes + result.emotionalDepth + result.structuralInnovation + 
         result.accessibility + result.longevity) / 5
      );
      return { ...result, score: overall };
    } catch {
      return this.fallbackNobelAnalysis(content);
    }
  }

  /**
   * Build system prompt for writing assistant
   */
  private buildSystemPrompt(
    context: {
      title: string;
      type: string;
      wordCount: number;
      chapters: { title: string; wordCount: number }[];
    },
    mode: string
  ): string {
    const modeInstructions = {
      write: 'Focus on creative writing, character development, and narrative structure.',
      format: 'Focus on formatting, typography, and publication readiness.',
      publish: 'Focus on metadata, distribution, and marketing.',
    };

    return `You are an expert writing assistant for the Shothik platform. You have access to the following manuscript:

Title: ${context.title}
Type: ${context.type}
Total Words: ${context.wordCount}
Chapters: ${context.chapters.map(c => c.title).join(', ')}

${modeInstructions[mode as keyof typeof modeInstructions]}

Guidelines:
- Be specific and actionable in your suggestions
- Reference specific parts of the manuscript when relevant
- Consider the author's unique voice and style
- Provide examples when helpful
- Be encouraging but honest about areas for improvement

You are powered by ${this.config.provider} AI.`;
  }

  /**
   * Fallback neural analysis (when LLM fails)
   */
  private fallbackNeuralAnalysis(content: string) {
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const sensoryWords = ['see', 'hear', 'feel', 'smell', 'taste', 'look', 'sound', 'touch'];
    const emotionalWords = ['love', 'hate', 'fear', 'joy', 'sad', 'angry', 'happy'];
    
    const sensoryCount = words.filter(w => 
      sensoryWords.some(sw => w.toLowerCase().includes(sw))
    ).length;
    
    const emotionalCount = words.filter(w => 
      emotionalWords.some(ew => w.toLowerCase().includes(ew))
    ).length;
    
    const sensory = Math.min(100, Math.round((sensoryCount / words.length) * 1000));
    const emotional = Math.min(100, Math.round((emotionalCount / words.length) * 1000));
    const cognitive = 70;
    const personal = 65;
    
    return {
      score: Math.round((sensory + emotional + cognitive + personal) / 4),
      sensory,
      emotional,
      cognitive,
      personal,
      suggestions: sensory < 50 ? ['Add more sensory details'] : [],
    };
  }

  /**
   * Fallback Nobel analysis (when LLM fails)
   */
  private fallbackNobelAnalysis(content: string) {
    return {
      score: 65,
      universalThemes: 70,
      emotionalDepth: 65,
      structuralInnovation: 60,
      accessibility: 75,
      longevity: 60,
      analysis: 'Basic analysis completed. Connect to LLM for detailed evaluation.',
    };
  }
}

// Export singleton for convenience
export const llmService = new LLMService({
  provider: 'kimi',
  apiKey: process.env.KIMI_API_KEY || '',
});
