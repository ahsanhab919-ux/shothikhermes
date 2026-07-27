/**
 * EnneagramEngine - Character Psychology System
 * Deep character development using Enneagram + Tritype + Instincts
 */

export type EnneagramType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type Instinct = 'self-preservation' | 'social' | 'sexual';
export type Center = 'gut' | 'heart' | 'head';

export interface EnneagramProfile {
  type: EnneagramType;
  wing?: EnneagramType;
  tritype: {
    gut: Extract<EnneagramType, 8 | 9 | 1>;
    heart: Extract<EnneagramType, 2 | 3 | 4>;
    head: Extract<EnneagramType, 5 | 6 | 7>;
  };
  instinct: Instinct;
  core: {
    fear: string;
    desire: string;
    lie: string;
    truth: string;
  };
  growth: {
    stress: EnneagramType;    // Disintegration
    security: EnneagramType;  // Integration
  };
}

export interface CharacterDNA {
  id: string;
  name: string;
  enneagram: EnneagramProfile;
  arc: {
    starting: string;      // Initial archetype/state
    current: string;       // Current state
    target: string;        // Target transformation
    progress: number;      // 0-100
  };
}

export class EnneagramEngine {
  private static typeData: Record<EnneagramType, {
    name: string;
    center: Center;
    coreFear: string;
    coreDesire: string;
    coreLie: string;
    thematicTruth: string;
    stress: EnneagramType;
    security: EnneagramType;
  }> = {
    1: {
      name: 'The Reformer',
      center: 'gut',
      coreFear: 'Being corrupt, defective, or imperfect',
      coreDesire: 'To be good, virtuous, and right',
      coreLie: 'I must be perfect to be worthy',
      thematicTruth: 'I am worthy as I am, flaws and all',
      stress: 4,
      security: 7
    },
    2: {
      name: 'The Helper',
      center: 'heart',
      coreFear: 'Being unwanted, unloved, or worthless',
      coreDesire: 'To be loved and needed',
      coreLie: 'I must help others to be loved',
      thematicTruth: 'I am loved for who I am, not what I do',
      stress: 8,
      security: 4
    },
    3: {
      name: 'The Achiever',
      center: 'heart',
      coreFear: 'Being worthless, a failure, or unsuccessful',
      coreDesire: 'To be valuable, admired, and successful',
      coreLie: 'I am only as good as my last achievement',
      thematicTruth: 'I have inherent worth beyond achievement',
      stress: 9,
      security: 6
    },
    4: {
      name: 'The Individualist',
      center: 'heart',
      coreFear: 'Having no identity or personal significance',
      coreDesire: 'To find themselves and their significance',
      coreLie: 'I am fundamentally different and alone',
      thematicTruth: 'I am connected and whole as I am',
      stress: 2,
      security: 1
    },
    5: {
      name: 'The Investigator',
      center: 'head',
      coreFear: 'Being incompetent, incapable, or overwhelmed',
      coreDesire: 'To be capable and competent',
      coreLie: 'I need knowledge to be safe',
      thematicTruth: 'I have enough within me already',
      stress: 7,
      security: 8
    },
    6: {
      name: 'The Loyalist',
      center: 'head',
      coreFear: 'Being without support or guidance',
      coreDesire: 'To have security and support',
      coreLie: 'I cannot trust myself',
      thematicTruth: 'I am my own best authority',
      stress: 3,
      security: 9
    },
    7: {
      name: 'The Enthusiast',
      center: 'head',
      coreFear: 'Being deprived, trapped in pain, or limited',
      coreDesire: 'To be satisfied and content',
      coreLie: 'I must stay busy to be happy',
      thematicTruth: 'I can be present with all of life',
      stress: 1,
      security: 5
    },
    8: {
      name: 'The Challenger',
      center: 'gut',
      coreFear: 'Being controlled, harmed, or violated',
      coreDesire: 'To protect themselves and be in control',
      coreLie: 'I must be strong to survive',
      thematicTruth: 'I can be vulnerable and still be powerful',
      stress: 5,
      security: 2
    },
    9: {
      name: 'The Peacemaker',
      center: 'gut',
      coreFear: 'Being separated, in conflict, or abandoned',
      coreDesire: 'To have inner stability and peace',
      coreLie: 'My needs don\'t matter',
      thematicTruth: 'My presence matters deeply',
      stress: 6,
      security: 3
    }
  };

  static getTypeData(type: EnneagramType) {
    return this.typeData[type];
  }

  static createProfile(
    type: EnneagramType,
    tritype: { gut: 8 | 9 | 1; heart: 2 | 3 | 4; head: 5 | 6 | 7 },
    instinct: Instinct
  ): EnneagramProfile {
    const data = this.typeData[type];
    
    return {
      type,
      tritype,
      instinct,
      core: {
        fear: data.coreFear,
        desire: data.coreDesire,
        lie: data.coreLie,
        truth: data.thematicTruth
      },
      growth: {
        stress: data.stress,
        security: data.security
      }
    };
  }

  static generateCharacterDNA(
    name: string,
    type: EnneagramType,
    options: {
      tritype?: { gut: 8 | 9 | 1; heart: 2 | 3 | 4; head: 5 | 6 | 7 };
      instinct?: Instinct;
      arcStarting?: string;
      arcTarget?: string;
    } = {}
  ): CharacterDNA {
    const defaultTritype = { gut: 9 as const, heart: 3 as const, head: 6 as const };
    const tritype = options.tritype || defaultTritype;
    const instinct = options.instinct || 'self-preservation';
    
    const profile = this.createProfile(type, tritype, instinct);
    
    return {
      id: `char_${Date.now()}`,
      name,
      enneagram: profile,
      arc: {
        starting: options.arcStarting || this.typeData[type].name,
        current: this.typeData[type].name,
        target: options.arcTarget || `Integrated ${this.typeData[type].name}`,
        progress: 0
      }
    };
  }

  static getInstinctDescription(type: EnneagramType, instinct: Instinct): string {
    const descriptions: Record<Instinct, Record<EnneagramType, string>> = {
      'self-preservation': {
        1: 'Focuses on perfecting their environment and health',
        2: 'Nurtures others through practical care and resources',
        3: 'Achieves through financial security and stability',
        4: 'Creates a unique, aesthetically pleasing sanctuary',
        5: 'Hoards knowledge and resources for safety',
        6: 'Seeks security through alliances and preparation',
        7: 'Plans exciting experiences and avoids limitation',
        8: 'Controls their territory and resources fiercely',
        9: 'Maintains physical comfort and avoids disturbance'
      },
      'social': {
        1: 'Reforms systems and fights for social justice',
        2: 'Nurtures groups and creates communities',
        3: 'Achieves through status and recognition',
        4: 'Expresses uniqueness through social roles',
        5: 'Shares expertise and establishes authority',
        6: 'Finds safety in groups and shared beliefs',
        7: 'Brings excitement and fun to social circles',
        8: 'Leads groups and protects the vulnerable',
        9: 'Mediates conflicts and maintains group harmony'
      },
      'sexual': {
        1: 'Perfects intimate relationships and intense connections',
        2: 'Seduces through attention and emotional intensity',
        3: 'Attracts through charisma and personal magnetism',
        4: 'Seeks deep, passionate, transformative relationships',
        5: 'Shares inner world with chosen intimate few',
        6: 'Seeks security through intense loyalty and commitment',
        7: 'Chases intense experiences and new attractions',
        8: 'Pursues conquest and intense encounters',
        9: 'Merges with others and loses self in relationships'
      }
    };
    
    return descriptions[instinct][type];
  }

  static calculateArcProgress(
    character: CharacterDNA,
    currentBehavior: string
  ): number {
    // Analyze current behavior against target arc
    // Return 0-100 progress
    // This would use NLP in full implementation
    
    // Simplified: check if behavior shows growth
    const growthIndicators = [
      character.enneagram.core.truth.toLowerCase(),
      'realized', 'understood', 'accepted', 'embraced'
    ];
    
    const hasGrowth = growthIndicators.some(indicator =>
      currentBehavior.toLowerCase().includes(indicator)
    );
    
    return hasGrowth ? Math.min(100, character.arc.progress + 10) : character.arc.progress;
  }

  static generateDialoguePrompt(character: CharacterDNA): string {
    const { enneagram } = character;
    const typeData = this.typeData[enneagram.type];
    
    return `Character: ${character.name}
Enneagram Type ${enneagram.type}: ${typeData.name}
Core Fear: ${enneagram.core.fear}
Core Desire: ${enneagram.core.desire}
Instinct: ${enneagram.instinct}
Current Arc: ${character.arc.current} → ${character.arc.target}

When ${character.name} speaks or acts:
- They are driven by: ${enneagram.core.desire}
- They fear: ${enneagram.core.fear}
- They believe: ${enneagram.core.lie}
- They need to learn: ${enneagram.core.truth}

Dialogue style: ${this.getInstinctDescription(enneagram.type, enneagram.instinct)}`;
  }
}

export const enneagramEngine = new EnneagramEngine();
