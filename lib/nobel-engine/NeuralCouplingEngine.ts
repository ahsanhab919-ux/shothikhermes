/**
 * NeuralCouplingEngine - Neurobiological Writing Analysis
 * Measures how well writing creates brain-to-brain connection
 */

export interface NeuralCouplingScore {
  overall: number;           // 0-100
  sensory: number;           // Visual cortex activation
  emotional: number;         // Amygdala activation
  cognitive: number;         // Prefrontal cortex activation
  personal: number;          // DMN (Default Mode Network) activation
  suggestions: CouplingSuggestion[];
}

export interface CouplingSuggestion {
  type: 'sensory' | 'emotional' | 'cognitive' | 'personal';
  message: string;
  example?: string;
  priority: 'high' | 'medium' | 'low';
}

export class NeuralCouplingEngine {
  /**
   * Analyze text for neural coupling potential
   */
  static analyze(text: string): NeuralCouplingScore {
    const scores = {
      sensory: this.calculateSensoryScore(text),
      emotional: this.calculateEmotionalScore(text),
      cognitive: this.calculateCognitiveScore(text),
      personal: this.calculatePersonalScore(text)
    };
    
    const overall = Math.round(
      (scores.sensory + scores.emotional + scores.cognitive + scores.personal) / 4
    );
    
    return {
      overall,
      ...scores,
      suggestions: this.generateSuggestions(scores, text)
    };
  }

  private static calculateSensoryScore(text: string): number {
    const sensoryWords = [
      'see', 'saw', 'look', 'watch', 'gaze', 'stare', 'glance',
      'hear', 'heard', 'listen', 'sound', 'noise', 'silence',
      'smell', 'scent', 'aroma', 'odor', 'fragrance',
      'taste', 'flavor', 'sweet', 'bitter', 'sour',
      'touch', 'feel', 'felt', 'texture', 'smooth', 'rough',
      'red', 'blue', 'green', 'bright', 'dark', 'color'
    ];
    
    const words = text.toLowerCase().split(/\s+/);
    const sensoryCount = words.filter(w => 
      sensoryWords.some(sw => w.includes(sw))
    ).length;
    
    // Score: 0-100 based on sensory density
    const density = (sensoryCount / words.length) * 100;
    return Math.min(100, Math.round(density * 5)); // Scale up
  }

  private static calculateEmotionalScore(text: string): number {
    const emotionalIndicators = [
      'feel', 'felt', 'feeling', 'emotion', 'heart',
      'fear', 'afraid', 'scared', 'terrified',
      'love', 'loved', 'adore', 'cherish',
      'anger', 'angry', 'furious', 'rage',
      'sad', 'sorrow', 'grief', 'melancholy',
      'joy', 'happy', 'elated', 'ecstatic',
      'worry', 'anxious', 'nervous', 'concern'
    ];
    
    const words = text.toLowerCase().split(/\s+/);
    const emotionalCount = words.filter(w =>
      emotionalIndicators.some(ei => w.includes(ei))
    ).length;
    
    const density = (emotionalCount / words.length) * 100;
    return Math.min(100, Math.round(density * 8));
  }

  private static calculateCognitiveScore(text: string): number {
    // Check for clear causality, logic, structure
    const causalWords = ['because', 'therefore', 'thus', 'since', 'as', 'so'];
    const structuralWords = ['first', 'then', 'next', 'finally', 'however', 'although'];
    
    const words = text.toLowerCase().split(/\s+/);
    const causalCount = words.filter(w => causalWords.includes(w)).length;
    const structuralCount = words.filter(w => structuralWords.includes(w)).length;
    
    // Good cognitive score needs both causality and structure
    const score = ((causalCount * 10) + (structuralCount * 5)) / words.length * 100;
    return Math.min(100, Math.round(score));
  }

  private static calculatePersonalScore(text: string): number {
    // Personal pronouns and internal experience
    const personalIndicators = [
      'i ', 'me ', 'my ', 'mine', 'myself',
      'we ', 'us ', 'our ', 'ours',
      'thought', 'think', 'thinking', 'wonder',
      'realize', 'knew', 'understand', 'believe',
      'remember', 'recall', 'memory',
      'dream', 'hope', 'wish', 'want', 'need'
    ];
    
    const words = text.toLowerCase().split(/\s+/);
    const personalCount = words.filter(w =>
      personalIndicators.some(pi => w.includes(pi))
    ).length;
    
    const density = (personalCount / words.length) * 100;
    return Math.min(100, Math.round(density * 6));
  }

  private static generateSuggestions(
    scores: { sensory: number; emotional: number; cognitive: number; personal: number },
    text: string
  ): CouplingSuggestion[] {
    const suggestions: CouplingSuggestion[] = [];
    
    if (scores.sensory < 60) {
      suggestions.push({
        type: 'sensory',
        message: 'Add sensory details to help readers visualize the scene',
        example: 'Instead of "The room was dark," try "Shadows swallowed the corners of the room."',
        priority: scores.sensory < 40 ? 'high' : 'medium'
      });
    }
    
    if (scores.emotional < 60) {
      suggestions.push({
        type: 'emotional',
        message: 'Include emotional language to help readers feel with the character',
        example: 'Show how the character feels: "Her heart hammered against her ribs."',
        priority: scores.emotional < 40 ? 'high' : 'medium'
      });
    }
    
    if (scores.cognitive < 60) {
      suggestions.push({
        type: 'cognitive',
        message: 'Strengthen cause-and-effect relationships for clarity',
        example: 'Use words like "because," "therefore," or "as a result" to show logic.',
        priority: 'low'
      });
    }
    
    if (scores.personal < 60) {
      suggestions.push({
        type: 'personal',
        message: 'Add internal thoughts or reflections to increase personal relevance',
        example: 'What is the character thinking? "She wondered if she had made a mistake."',
        priority: scores.personal < 40 ? 'high' : 'medium'
      });
    }
    
    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  /**
   * Quick check for real-time feedback
   */
  static quickCheck(text: string): { score: number; status: 'good' | 'fair' | 'needs_work' } {
    const analysis = this.analyze(text);
    
    let status: 'good' | 'fair' | 'needs_work' = 'needs_work';
    if (analysis.overall >= 75) status = 'good';
    else if (analysis.overall >= 50) status = 'fair';
    
    return { score: analysis.overall, status };
  }
}

export const neuralCouplingEngine = new NeuralCouplingEngine();
