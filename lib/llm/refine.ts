import { completeForTool, type ToolName } from './gateway';
import { logger } from '@/lib/logger';

export interface RefineOptions {
  original: string;
  draft: string;
  taskDescription: string;
  tool: ToolName;
  temperature?: number;
}

export async function refineOutput(options: RefineOptions): Promise<string> {
  const { original, draft, taskDescription, tool, temperature = 0.3 } = options;

  if (original.length < 100) {
    return draft;
  }

  const prompt = `You performed the following editing task on the original text:
"${taskDescription}"

Original text:
"""
${original}
"""

Your draft output:
"""
${draft}
"""

Review your draft against these criteria:
1. Does it fulfill the task correctly? (tone, style, and strength match what was requested)
2. Are all proper nouns, names, numbers, dates, technical terms, citation markers ([1], [2], (Smith, 2023), et al., ibid.), and LaTeX/math expressions ($...$, \(...\)) preserved exactly from the original?
3. Does the output sound natural and not robotic or formulaic?
4. Is the writing genuinely better than the original in the requested way?

If the draft fully passes all criteria, return it unchanged.
If there are specific issues, return an improved version that fixes only those issues.

Return only the final text — no labels, no explanation, no preamble.`;

  try {
    const result = await completeForTool(tool, {
      prompt,
      temperature,
      maxTokens: Math.max(600, Math.ceil(draft.length * 1.3)),
    });
    return result.text.trim();
  } catch (err) {
    logger.warn('[refine] Refinement pass failed, returning original draft', {
      tool,
      error: err instanceof Error ? err.message : String(err),
    });
    return draft;
  }
}
