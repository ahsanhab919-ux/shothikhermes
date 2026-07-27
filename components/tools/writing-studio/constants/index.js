"use client";
import {
  RefreshCw,
  Bot,
  CheckCircle2,
  FileText,
  FlaskConical,
  MessageSquare,
  GraduationCap,
  BookOpen,
} from "lucide-react";

export const AI_TOOLS = [
  {
    id: "paraphrase",
    name: "Paraphrase",
    icon: RefreshCw,
    description: "Rewrite text while preserving meaning",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "humanize",
    name: "Humanize",
    icon: Bot,
    description: "Make AI text sound more natural",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    id: "grammar",
    name: "Grammar & Clarity",
    icon: CheckCircle2,
    description: "Fix errors and improve clarity",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    id: "summarize",
    name: "Summarize",
    icon: FileText,
    description: "Condense text to key points",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
];

export const PARAPHRASE_MODES = [
  { id: "Fluency", name: "Fluency", description: "Improve readability" },
  { id: "Standard", name: "Standard", description: "Balanced rewrite" },
  { id: "Formal", name: "Academic", description: "Academic tone" },
  { id: "Simple", name: "Simplify", description: "Clearer language" },
  { id: "Creative", name: "Creative", description: "More varied wording" },
  { id: "Shorten", name: "Shorten", description: "Reduce word count" },
  { id: "Expand", name: "Expand", description: "Add more detail" },
];

export const WRITING_TEMPLATES = [
  {
    id: "research-paper",
    name: "Research Paper",
    icon: FlaskConical,
    description: "Standard academic research structure",
    content: `<h1>Research Paper Title</h1>
<h2>Abstract</h2>
<p>[Provide a brief summary of your research, including the problem, methods, key findings, and conclusions. Keep it under 300 words.]</p>
<h2>1. Introduction</h2>
<p>[Introduce your research topic and its significance. State the research problem or question. Outline the objectives and scope of your study.]</p>
<h2>2. Literature Review</h2>
<p>[Summarize relevant existing research. Identify gaps in current knowledge. Explain how your research addresses these gaps.]</p>
<h2>3. Methodology</h2>
<p>[Describe your research design and approach. Explain data collection methods. Detail your analysis procedures.]</p>
<h2>4. Results</h2>
<p>[Present your findings objectively. Use tables and figures where appropriate. Report statistical analyses if applicable.]</p>
<h2>5. Discussion</h2>
<p>[Interpret your results. Compare findings with existing literature. Discuss implications and limitations.]</p>
<h2>6. Conclusion</h2>
<p>[Summarize key findings. State contributions to the field. Suggest directions for future research.]</p>
<h2>References</h2>
<p>[List all cited sources in your chosen citation format.]</p>`,
  },
  {
    id: "argumentative-essay",
    name: "Argumentative Essay",
    icon: MessageSquare,
    description: "Persuasive essay with thesis and evidence",
    content: `<h1>Essay Title</h1>
<h2>Introduction</h2>
<p><strong>Hook:</strong> Start with an engaging opening that captures reader attention.</p>
<p><strong>Background:</strong> Provide context and background information on your topic.</p>
<p><strong>Thesis Statement:</strong> Clearly state your main argument or position.</p>
<h2>Body Paragraph 1: First Main Point</h2>
<p><strong>Topic Sentence:</strong> State your first supporting argument.</p>
<p><strong>Evidence:</strong> Present facts, statistics, or examples that support this point.</p>
<p><strong>Analysis:</strong> Explain how this evidence supports your thesis.</p>
<p><strong>Transition:</strong> Connect to the next paragraph.</p>
<h2>Body Paragraph 2: Second Main Point</h2>
<p><strong>Topic Sentence:</strong> State your second supporting argument.</p>
<p><strong>Evidence:</strong> Present supporting evidence.</p>
<p><strong>Analysis:</strong> Explain the significance of this evidence.</p>
<p><strong>Transition:</strong> Connect to the next paragraph.</p>
<h2>Body Paragraph 3: Counterargument & Rebuttal</h2>
<p>[Acknowledge opposing viewpoints fairly.]</p>
<p>[Explain why your position is stronger.]</p>
<p>[Provide evidence to refute counterarguments.]</p>
<h2>Conclusion</h2>
<p>[Restate thesis in new words.]</p>
<p>[Summarize main points.]</p>
<p>[End with a call to action or thought-provoking statement.]</p>`,
  },
  {
    id: "thesis-chapter",
    name: "Thesis Chapter",
    icon: GraduationCap,
    description: "Detailed thesis/dissertation chapter",
    content: `<h1>Chapter [X]: [Chapter Title]</h1>
<h2>[X.1] Introduction to Chapter</h2>
<p>[Outline what this chapter covers. Explain its role in your overall thesis. State the chapter objectives.]</p>
<h2>[X.2] Theoretical Framework</h2>
<p>[Present relevant theories and concepts. Explain how they apply to your research. Justify your theoretical choices.]</p>
<h2>[X.3] Main Content Section</h2>
<h3>[X.3.1] First Subsection</h3>
<p>[Develop your main ideas with detailed analysis. Support claims with evidence and citations. Connect to your research questions.]</p>
<h3>[X.3.2] Second Subsection</h3>
<p>[Continue developing your argument. Maintain logical flow between sections. Reference related literature.]</p>
<h3>[X.3.3] Third Subsection</h3>
<p>[Further elaborate on key points. Address complexities and nuances. Build toward chapter conclusions.]</p>
<h2>[X.4] Critical Analysis</h2>
<p>[Synthesize the information presented. Evaluate different perspectives. Identify patterns and relationships.]</p>
<h2>[X.5] Chapter Summary</h2>
<p>[Recap the main points covered. Explain how this chapter contributes to your thesis. Preview connections to subsequent chapters.]</p>
<h2>References</h2>
<p>[Chapter-specific references if using footnote style.]</p>`,
  },
  {
    id: "literature-review",
    name: "Literature Review",
    icon: BookOpen,
    description: "Comprehensive review of existing research",
    content: `<h1>Literature Review: [Topic]</h1>
<h2>1. Introduction</h2>
<p>[Define the scope of your review. Explain the significance of the topic. State your review objectives and organization.]</p>
<h2>2. Search Strategy</h2>
<p>[Describe databases and sources searched. Explain inclusion/exclusion criteria. Note the time period covered.]</p>
<h2>3. Thematic Section 1: [Theme Name]</h2>
<p>[Summarize key studies related to this theme. Compare and contrast different findings. Identify consensus and disagreements.]</p>
<h2>4. Thematic Section 2: [Theme Name]</h2>
<p>[Present relevant literature. Analyze methodological approaches. Evaluate quality of evidence.]</p>
<h2>5. Thematic Section 3: [Theme Name]</h2>
<p>[Discuss emerging trends. Note evolving perspectives. Highlight influential works.]</p>
<h2>6. Gaps in Current Research</h2>
<p>[Identify what is missing in the literature. Explain why these gaps matter. Connect to your research questions.]</p>
<h2>7. Conclusion</h2>
<p>[Synthesize main findings. Explain implications for your research. Justify the need for your study.]</p>
<h2>References</h2>
<p></p>`,
  },
  {
    id: "lab-report",
    name: "Lab Report",
    icon: FlaskConical,
    description: "Scientific laboratory report format",
    content: `<h1>Lab Report: [Experiment Title]</h1>
<p><strong>Date:</strong> [Date of experiment]</p>
<p><strong>Course:</strong> [Course name and number]</p>
<p><strong>Instructor:</strong> [Instructor name]</p>
<h2>Abstract</h2>
<p>[Brief summary of the experiment, methods, key results, and conclusions in ~150 words.]</p>
<h2>1. Introduction</h2>
<p>[Explain the scientific background. State the purpose of the experiment. Present your hypothesis.]</p>
<h2>2. Materials and Methods</h2>
<h3>2.1 Materials</h3>
<ul><li>[List all equipment and materials used]</li></ul>
<h3>2.2 Procedure</h3>
<ol><li>[Step-by-step description of what you did]</li><li>[Be specific enough for replication]</li><li>[Include safety precautions taken]</li></ol>
<h2>3. Results</h2>
<p>[Present data in tables and figures. Describe observations objectively. Include calculations and statistical analysis.]</p>
<h2>4. Discussion</h2>
<p>[Interpret your results. Compare with expected outcomes. Explain sources of error. Suggest improvements.]</p>
<h2>5. Conclusion</h2>
<p>[State whether hypothesis was supported. Summarize key findings. Suggest future experiments.]</p>
<h2>References</h2>
<p></p>`,
  },
];
