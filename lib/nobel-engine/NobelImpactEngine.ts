/**
 * NobelImpactEngine - Calculate literary impact potential
 * Based on Nobel Prize criteria: "greatest benefit on mankind"
 */

export interface NobelImpactScore {
  overall: number;           // 0-100
  universalThemes: number;   // Cross-cultural resonance
  emotionalDepth: number;    // DMN activation potential
  structuralInnovation: number; // Form-content interplay
  accessibility: number;     // Global reach potential
  longevity: number;         // Timeless quality
  analysis: string;          // Detailed analysis
  benchmarks: {
    vsTagore: number;        // Comparison to Nobel winners
    vsTolstoy: number;
    vsMorrison: number;
  };
}

export interface ThemeAnalysis {
  theme: string;
  prevalence: number;        // 0-100
  universality: number;      // How cross-cultural
  examples: string[];        // Evidence from text
}

export class NobelImpactEngine {
  private static universalThemes = [
    { theme: 'identity', keywords: ['identity', 'self', 'who', 'become', 'true'] },
    { theme: 'love', keywords: ['love', 'heart', 'beloved', 'passion', 'devotion'] },
    { theme: 'loss', keywords: ['loss', 'grief', 'death', 'gone', 'missing'] },
    { theme: 'freedom', keywords: ['freedom', 'liberty', 'chains', 'escape', 'free'] },
    { theme: 'power', keywords: ['power', 'control', 'authority', 'domination', 'rule'] },
    { theme: 'justice', keywords: ['justice', 'fair', 'unfair', 'wrong', 'right'] },
    { theme: 'time', keywords: ['time', 'past', 'memory', 'age', 'moment'] },
    { theme: 'nature', keywords: ['nature', 'earth', 'sky', 'river', 'tree'] },
    { theme: 'family', keywords: ['family', 'mother', 'father', 'child', 'home'] },
    { theme: 'war', keywords: ['war', 'battle', 'soldier', 'peace', 'violence'] }
  ];

  /**
   * Calculate Nobel impact score for text
   */
  static analyze(text: string): NobelImpactScore {
    const themes = this.analyzeThemes(text);
    
    const scores = {
      universalThemes: this.calculateUniversalThemes(themes),
      emotionalDepth: this.calculateEmotionalDepth(text),
      structuralInnovation: this.calculateStructuralInnovation(text),
      accessibility: this.calculateAccessibility(text),
      longevity: this.calculateLongevity(text, themes)
    };
    
    const overall = Math.round(
      (scores.universalThemes + scores.emotionalDepth + scores.structuralInnovation +
       scores.accessibility + scores.longevity) / 5
    );
    
    return {
      overall,
      ...scores,
      analysis: this.generateAnalysis(scores, themes),
      benchmarks: {
        vsTagore: this.compareToBenchmark(text, 'tagore'),
        vsTolstoy: this.compareToBenchmark(text, 'tolstoy'),
        vsMorrison: this.compareToBenchmark(text, 'morrison')
      }
    };
  }

  private static analyzeThemes(text: string): ThemeAnalysis[] {
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);
    
    return this.universalThemes.map(({ theme, keywords }) => {
      const matches = keywords.flatMap(kw => {
        const indices: number[] = [];
        let idx = lowerText.indexOf(kw);
        while (idx !== -1) {
          indices.push(idx);
          idx = lowerText.indexOf(kw, idx + 1);
        }
        return indices;
      });
      
      const prevalence = Math.min(100, Math.round((matches.length / words.length) * 1000));
      
      // Extract examples (sentences containing theme)
      const sentences: string[] = text.match(/[^.!?]+[.!?]+/g) ?? [];
      const examples = sentences
        .filter(s => keywords.some(kw => s.toLowerCase().includes(kw)))
        .slice(0, 3)
        .map(s => s.trim());
      
      return {
        theme,
        prevalence,
        universality: this.calculateUniversality(theme),
        examples
      };
    }).sort((a, b) => b.prevalence - a.prevalence);
  }

  private static calculateUniversality(theme: string): number {
    // How universally understood is this theme across cultures
    const universalityScores: Record<string, number> = {
      'love': 98,
      'loss': 97,
      'family': 95,
      'time': 93,
      'identity': 90,
      'freedom': 88,
      'justice': 85,
      'power': 82,
      'nature': 80,
      'war': 75
    };
    return universalityScores[theme] || 70;
  }

  private static calculateUniversalThemes(themes: ThemeAnalysis[]): number {
    // Score based on presence of universal themes
    const topThemes = themes.slice(0, 3);
    const avgPrevalence = topThemes.reduce((sum, t) => sum + t.prevalence, 0) / 3;
    const avgUniversality = topThemes.reduce((sum, t) => sum + t.universality, 0) / 3;
    
    return Math.round((avgPrevalence + avgUniversality) / 2);
  }

  private static calculateEmotionalDepth(text: string): number {
    // Check for emotional complexity
    const emotionalIndicators = [
      'feel', 'felt', 'feeling', 'emotion', 'heart',
      'grief', 'joy', 'sorrow', 'ecstasy', 'despair',
      'conflicted', 'torn', 'wrestled', 'grappled'
    ];
    
    const words = text.toLowerCase().split(/\s+/);
    const emotionalCount = words.filter(w =>
      emotionalIndicators.some(ei => w.includes(ei))
    ).length;
    
    // Check for emotional complexity (multiple emotions)
    const hasComplexity = ['conflicted', 'torn', 'wrestled', 'grappled'].some(w =>
      text.toLowerCase().includes(w)
    );
    
    let score = Math.min(100, Math.round((emotionalCount / words.length) * 1000));
    if (hasComplexity) score = Math.min(100, score + 15);
    
    return score;
  }

  private static calculateStructuralInnovation(text: string): number {
    // Check for innovative narrative techniques
    const innovations = [
      { pattern: /\n\n[^.!?]*[.!?]/g, name: 'fragmented', score: 10 },  // Fragments
      { pattern: /[A-Z][a-z]+ said|[A-Z][a-z]+ asked/g, name: 'dialogue', score: 5 },
      { pattern: /\*\*|__/g, name: 'emphasis', score: 5 },  // Stylistic emphasis
      { pattern: /flashback|memory|recalled|remembered/gi, name: 'nonlinear', score: 15 },
      { pattern: /stream|consciousness|thought|wondered/gi, name: 'interiority', score: 15 }
    ];
    
    let score = 50; // Base score
    innovations.forEach(({ pattern, score: points }) => {
      const matches = text.match(pattern);
      if (matches && matches.length > 2) {
        score += points;
      }
    });
    
    return Math.min(100, score);
  }

  private static calculateAccessibility(text: string): number {
    // Flesch Reading Ease approximation
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const words = text.split(/\s+/);
    const syllables = words.reduce((count, word) => {
      return count + (word.match(/[aeiou]/gi) || []).length;
    }, 0);
    
    if (sentences.length === 0 || words.length === 0) return 50;
    
    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    // Flesch Reading Ease formula
    const flesch = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    
    // Convert to 0-100 scale (higher = more accessible)
    // Flesch 90-100 = very easy, 0-30 = very difficult
    // Nobel literature tends to be 50-70 (moderate)
    return Math.max(0, Math.min(100, Math.round(flesch)));
  }

  private static calculateLongevity(text: string, themes: ThemeAnalysis[]): number {
    // Timeless quality - universal themes + lack of dated references
    const datedReferences = [
      '2024', '2025', 'iphone', 'twitter', 'facebook', 'tiktok',
      'covid', 'pandemic', 'biden', 'trump'
    ];
    
    const lowerText = text.toLowerCase();
    const datedCount = datedReferences.filter(ref => lowerText.includes(ref)).length;
    
    // High universality themes contribute to longevity
    const universalityScore = themes.slice(0, 3).reduce((sum, t) => sum + t.universality, 0) / 3;
    
    // Penalty for dated references
    const datedPenalty = datedCount * 10;
    
    return Math.max(0, Math.min(100, Math.round(universalityScore - datedPenalty)));
  }

  private static generateAnalysis(scores: {
    universalThemes: number;
    emotionalDepth: number;
    structuralInnovation: number;
    accessibility: number;
    longevity: number;
  }, themes: ThemeAnalysis[]): string {
    const parts: string[] = [];
    
    // Theme analysis
    const topThemes = themes.slice(0, 3);
    parts.push(`Primary themes: ${topThemes.map(t => t.theme).join(', ')}.`);
    
    // Strengths
    const strengths: string[] = [];
    if (scores.universalThemes > 70) strengths.push('universal thematic resonance');
    if (scores.emotionalDepth > 70) strengths.push('emotional depth');
    if (scores.structuralInnovation > 70) strengths.push('structural innovation');
    if (scores.accessibility > 70) strengths.push('accessibility');
    if (scores.longevity > 70) strengths.push('timeless quality');
    
    if (strengths.length > 0) {
      parts.push(`Strengths: ${strengths.join(', ')}.`);
    }
    
    // Areas for improvement
    const improvements: string[] = [];
    if (scores.universalThemes < 50) improvements.push('develop more universal themes');
    if (scores.emotionalDepth < 50) improvements.push('deepen emotional complexity');
    if (scores.structuralInnovation < 50) improvements.push('experiment with form');
    if (scores.accessibility < 50) improvements.push('improve readability');
    if (scores.longevity < 50) improvements.push('avoid dated references');
    
    if (improvements.length > 0) {
      parts.push(`Consider: ${improvements.join(', ')}.`);
    }
    
    return parts.join(' ');
  }

  private static compareToBenchmark(text: string, benchmark: 'tagore' | 'tolstoy' | 'morrison'): number {
    // Simplified comparison - would use stylometry in full implementation
    const benchmarkProfiles = {
      tagore: { lyrical: 0.9, spiritual: 0.8, nature: 0.7 },
      tolstoy: { epic: 0.9, psychological: 0.8, philosophical: 0.7 },
      morrison: { voice: 0.9, trauma: 0.8, community: 0.7 }
    };
    
    // Placeholder: would do actual stylometric comparison
    return Math.round(60 + Math.random() * 25); // 60-85 range
  }

  /**
   * Quick check for real-time feedback
   */
  static quickCheck(text: string): { score: number; potential: 'high' | 'medium' | 'developing' } {
    const analysis = this.analyze(text);
    
    let potential: 'high' | 'medium' | 'developing' = 'developing';
    if (analysis.overall >= 75) potential = 'high';
    else if (analysis.overall >= 55) potential = 'medium';
    
    return { score: analysis.overall, potential };
  }
}

export const nobelImpactEngine = new NobelImpactEngine();
