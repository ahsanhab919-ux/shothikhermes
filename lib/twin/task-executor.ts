import { completeForTool } from '@/lib/llm/gateway';
import { buildPersonaPrompt } from './persona-prompt-builder';
import type { StyleProfile } from './style-extractor';

export interface TwinProfile {
  name: string;
  persona?: string;
  expertiseAreas?: string[];
  communicationStyle?: 'formal' | 'casual' | 'academic' | 'creative';
  goals?: string[];
  languages?: string[];
}

export interface TaskInput {
  title: string;
  description?: string;
  taskType: 'research' | 'writing' | 'analysis' | 'summary';
}

const TASK_PROMPTS: Record<string, (task: TaskInput) => string> = {
  research: (task) =>
    `Conduct thorough research on the following topic and provide a comprehensive report with key findings, relevant data points, and actionable insights.

Topic: ${task.title}
${task.description ? `Additional context: ${task.description}` : ''}

Structure your report with:
1. Executive Summary
2. Key Findings (with specific details)
3. Analysis and Implications
4. Recommendations
5. Conclusion`,

  writing: (task) =>
    `Write the following piece of content in your master's voice and style. Produce polished, publication-ready content.

Title/Topic: ${task.title}
${task.description ? `Instructions: ${task.description}` : ''}`,

  analysis: (task) =>
    `Perform a detailed analysis of the following subject. Identify patterns, strengths, weaknesses, opportunities, and provide data-driven conclusions.

Subject: ${task.title}
${task.description ? `Scope/Context: ${task.description}` : ''}

Structure your analysis with:
1. Overview
2. Key Observations
3. Strengths & Weaknesses
4. Opportunities & Risks
5. Conclusions & Recommendations`,

  summary: (task) =>
    `Create a comprehensive yet concise summary of the following topic or content. Capture all key points while being succinct.

Topic: ${task.title}
${task.description ? `Content/Context: ${task.description}` : ''}

Provide:
1. One-paragraph overview
2. Key points (bullet list)
3. Main takeaways`,
};

const TASK_CONFIG: Record<string, { temperature: number; maxTokens: number }> = {
  research: { temperature: 0.5, maxTokens: 3000 },
  writing: { temperature: 0.7, maxTokens: 3000 },
  analysis: { temperature: 0.4, maxTokens: 2500 },
  summary: { temperature: 0.3, maxTokens: 1500 },
};

export async function executeTask(
  task: TaskInput,
  profile: TwinProfile,
  styleProfile?: StyleProfile | null,
  writingMd?: string | null,
  repairFeedback?: string
): Promise<string> {
  const personaPrompt = buildPersonaPrompt(profile, styleProfile, writingMd);
  const config = TASK_CONFIG[task.taskType] ?? TASK_CONFIG.research;

  // On a repair attempt, append the voice-gate feedback to the task prompt so the
  // regeneration steers back toward the author's WRITING.md voice. Mirrors the
  // book engine's repair block (lib/book/provider.ts buildChapterPrompt).
  let taskPrompt = TASK_PROMPTS[task.taskType](task);
  if (repairFeedback && repairFeedback.trim()) {
    taskPrompt += `\n\n${repairFeedback.trim()}`;
  }

  const response = await completeForTool('twin-task', {
    prompt: taskPrompt,
    systemInstruction: personaPrompt,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
  });

  return response.text;
}
