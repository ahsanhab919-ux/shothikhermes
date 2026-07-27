"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  FlaskConical,
  GraduationCap,
  BookOpen,
  MessageSquare,
  ClipboardList,
  Sparkles,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWritingStudio } from "../providers/WritingStudioProvider";
import { toast } from "react-toastify";

const springTransition = { type: "spring", stiffness: 300, damping: 30 };

const DOCUMENT_TYPES = [
  {
    id: "assignment",
    name: "Assignment",
    icon: ClipboardList,
    description: "University course assignment with proper formatting",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    fields: ["studentName", "studentId", "courseCode", "courseName", "instructor", "university", "date", "department"],
    formats: ["apa", "ieee", "generic"],
  },
  {
    id: "research-paper",
    name: "Research Paper",
    icon: FlaskConical,
    description: "Full academic research paper with all sections",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    fields: ["studentName", "courseCode", "courseName", "instructor", "university", "date", "department"],
    formats: ["apa", "ieee", "generic"],
  },
  {
    id: "lab-report",
    name: "Lab Report",
    icon: FlaskConical,
    description: "Scientific laboratory experiment report",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    fields: ["studentName", "studentId", "courseCode", "courseName", "instructor", "university", "date", "labPartner"],
    formats: ["apa", "ieee", "generic"],
  },
  {
    id: "thesis-chapter",
    name: "Thesis Chapter",
    icon: GraduationCap,
    description: "Thesis or dissertation chapter",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    fields: ["studentName", "university", "department", "supervisor", "date", "degree"],
    formats: ["apa", "ieee", "generic"],
  },
  {
    id: "literature-review",
    name: "Literature Review",
    icon: BookOpen,
    description: "Comprehensive review of existing research",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    fields: ["studentName", "courseCode", "courseName", "instructor", "university", "date"],
    formats: ["apa", "ieee", "generic"],
  },
  {
    id: "essay",
    name: "Argumentative Essay",
    icon: MessageSquare,
    description: "Persuasive essay with thesis and evidence",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    fields: ["studentName", "courseCode", "courseName", "instructor", "university", "date"],
    formats: ["apa", "generic"],
  },
];

const FORMAT_OPTIONS = [
  { id: "apa", name: "APA 7th Edition", description: "12pt, double-spaced, author-date citations" },
  { id: "ieee", name: "IEEE", description: "10pt, two-column, numbered references" },
  { id: "generic", name: "University Standard", description: "12pt, single-column, standard margins" },
];

const FIELD_LABELS = {
  studentName: "Your Name",
  studentId: "Student ID",
  courseCode: "Course Code",
  courseName: "Course Name",
  instructor: "Instructor / Professor",
  university: "University Name",
  department: "Department",
  date: "Due Date",
  supervisor: "Supervisor",
  degree: "Degree Program",
  labPartner: "Lab Partner(s)",
};

const FIELD_PLACEHOLDERS = {
  studentName: "e.g. Rahul Sharma",
  studentId: "e.g. 2024-CS-101",
  courseCode: "e.g. CSE 301",
  courseName: "e.g. Data Structures & Algorithms",
  instructor: "e.g. Dr. Anwar Hossain",
  university: "e.g. University of Dhaka",
  department: "e.g. Computer Science & Engineering",
  date: "",
  supervisor: "e.g. Prof. Karim Ahmed",
  degree: "e.g. M.Sc. in Computer Science",
  labPartner: "e.g. Priya Patel, Arun Das",
};

function generateTemplateContent(docType, fields, format) {
  const name = fields.studentName || "[Your Name]";
  const studentId = fields.studentId || "[Student ID]";
  const courseCode = fields.courseCode || "[Course Code]";
  const courseName = fields.courseName || "[Course Name]";
  const instructor = fields.instructor || "[Instructor Name]";
  const university = fields.university || "[University Name]";
  const department = fields.department || "[Department]";
  const date = fields.date || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const supervisor = fields.supervisor || "[Supervisor Name]";
  const degree = fields.degree || "[Degree Program]";
  const labPartner = fields.labPartner || "[Lab Partner(s)]";

  const titlePage = `<div style="text-align: center; padding: 4rem 0 2rem;">
<p style="margin-bottom: 2rem;">&nbsp;</p>
<h1 style="text-align: center;">[Your Title Here]</h1>
<p style="text-align: center; margin-top: 2rem;">&nbsp;</p>
<p style="text-align: center;">${name}${docType === "lab-report" || docType === "assignment" ? `<br/>${studentId}` : ""}</p>
<p style="text-align: center;">${department}, ${university}</p>
<p style="text-align: center;">${courseCode}: ${courseName}</p>
<p style="text-align: center;">${docType === "thesis-chapter" ? `Supervisor: ${supervisor}` : `Instructor: ${instructor}`}</p>
<p style="text-align: center;">${date}</p>
${docType === "lab-report" ? `<p style="text-align: center;">Lab Partner(s): ${labPartner}</p>` : ""}
</div><hr/>`;

  switch (docType) {
    case "assignment":
      return `${titlePage}
<h2>Introduction</h2>
<p>[Introduce the assignment topic. State the purpose and objectives of this work. Provide context for why this topic is relevant to the course.]</p>
<h2>Background</h2>
<p>[Present background information and key concepts. Reference relevant theories, frameworks, or prior work covered in the course.]</p>
<h2>Main Discussion</h2>
<h3>Section 1: [First Key Point]</h3>
<p>[Develop your first main argument or analysis with supporting evidence.]</p>
<h3>Section 2: [Second Key Point]</h3>
<p>[Continue with your second point, maintaining logical flow.]</p>
<h3>Section 3: [Third Key Point]</h3>
<p>[Further develop your analysis or argument.]</p>
<h2>Conclusion</h2>
<p>[Summarize key findings. Restate how the objectives were met. Discuss implications or recommendations.]</p>
<h2>References</h2>
<p>[List all cited sources in ${format === "apa" ? "APA" : format === "ieee" ? "IEEE" : "your required"} format.]</p>`;

    case "research-paper":
      return `${titlePage}
<h2>Abstract</h2>
<p>[Provide a brief summary of your research, including the problem, methods, key findings, and conclusions. Keep it under 300 words.]</p>
${format === "apa" ? "<p><strong>Keywords:</strong> [keyword 1, keyword 2, keyword 3, keyword 4, keyword 5]</p>" : ""}
<h2>${format === "ieee" ? "I. " : "1. "}Introduction</h2>
<p>[Introduce your research topic and its significance. State the research problem or question. Outline the objectives and scope of your study.]</p>
<h2>${format === "ieee" ? "II. " : "2. "}Literature Review</h2>
<p>[Summarize relevant existing research. Identify gaps in current knowledge. Explain how your research addresses these gaps.]</p>
<h2>${format === "ieee" ? "III. " : "3. "}Methodology</h2>
<p>[Describe your research design and approach. Explain data collection methods. Detail your analysis procedures.]</p>
<h2>${format === "ieee" ? "IV. " : "4. "}Results</h2>
<p>[Present your findings objectively. Use tables and figures where appropriate. Report statistical analyses if applicable.]</p>
<h2>${format === "ieee" ? "V. " : "5. "}Discussion</h2>
<p>[Interpret your results. Compare findings with existing literature. Discuss implications and limitations.]</p>
<h2>${format === "ieee" ? "VI. " : "6. "}Conclusion</h2>
<p>[Summarize key findings. State contributions to the field. Suggest directions for future research.]</p>
<h2>References</h2>
<p>[List all cited sources in ${format === "apa" ? "APA 7th edition" : format === "ieee" ? "IEEE numbered" : "your required"} format.]</p>`;

    case "lab-report":
      return `${titlePage}
<h2>Abstract</h2>
<p>[Brief summary of the experiment, methods, key results, and conclusions in ~150 words.]</p>
<h2>1. Introduction</h2>
<p>[Explain the scientific background. State the purpose of the experiment. Present your hypothesis.]</p>
<h2>2. Materials and Methods</h2>
<h3>2.1 Materials</h3>
<ul><li>[List all equipment and materials used]</li><li>[Include model numbers and specifications]</li></ul>
<h3>2.2 Procedure</h3>
<ol><li>[Step-by-step description of what you did]</li><li>[Be specific enough for replication]</li><li>[Include safety precautions taken]</li></ol>
<h2>3. Results</h2>
<p>[Present data in tables and figures. Describe observations objectively. Include calculations and statistical analysis.]</p>
<h2>4. Discussion</h2>
<p>[Interpret your results. Compare with expected outcomes. Explain sources of error. Suggest improvements.]</p>
<h2>5. Conclusion</h2>
<p>[State whether hypothesis was supported. Summarize key findings. Suggest future experiments.]</p>
<h2>References</h2>
<p>[List all cited sources.]</p>
<h2>Appendix</h2>
<p>[Include raw data, additional calculations, or supplementary material.]</p>`;

    case "thesis-chapter":
      return `${titlePage}
<h1>Chapter [X]: [Chapter Title]</h1>
<h2>[X.1] Introduction</h2>
<p>[Outline what this chapter covers. Explain its role in your overall ${degree || "thesis"}. State the chapter objectives.]</p>
<h2>[X.2] Theoretical Framework</h2>
<p>[Present relevant theories and concepts. Explain how they apply to your research. Justify your theoretical choices.]</p>
<h2>[X.3] Main Analysis</h2>
<h3>[X.3.1] First Subsection</h3>
<p>[Develop your main ideas with detailed analysis. Support claims with evidence and citations.]</p>
<h3>[X.3.2] Second Subsection</h3>
<p>[Continue developing your argument. Maintain logical flow between sections.]</p>
<h3>[X.3.3] Third Subsection</h3>
<p>[Further elaborate on key points. Address complexities and nuances.]</p>
<h2>[X.4] Critical Analysis</h2>
<p>[Synthesize the information presented. Evaluate different perspectives. Identify patterns and relationships.]</p>
<h2>[X.5] Chapter Summary</h2>
<p>[Recap the main points covered. Explain how this chapter contributes to your thesis. Preview connections to subsequent chapters.]</p>
<h2>References</h2>
<p>[Chapter-specific references.]</p>`;

    case "literature-review":
      return `${titlePage}
<h2>1. Introduction</h2>
<p>[Define the scope of your review. Explain the significance of the topic. State your review objectives and organization.]</p>
<h2>2. Search Strategy</h2>
<p>[Describe databases and sources searched (e.g., Semantic Scholar, IEEE Xplore, PubMed). Explain inclusion/exclusion criteria. Note the time period covered.]</p>
<h2>3. Theme 1: [Theme Name]</h2>
<p>[Summarize key studies related to this theme. Compare and contrast different findings. Identify consensus and disagreements.]</p>
<h2>4. Theme 2: [Theme Name]</h2>
<p>[Present relevant literature. Analyze methodological approaches. Evaluate quality of evidence.]</p>
<h2>5. Theme 3: [Theme Name]</h2>
<p>[Discuss emerging trends. Note evolving perspectives. Highlight influential works.]</p>
<h2>6. Gaps in Current Research</h2>
<p>[Identify what is missing in the literature. Explain why these gaps matter. Connect to your research questions.]</p>
<h2>7. Conclusion</h2>
<p>[Synthesize main findings. Explain implications for your research. Justify the need for your study.]</p>
<h2>References</h2>
<p>[List all sources reviewed.]</p>`;

    case "essay":
      return `${titlePage}
<h2>Introduction</h2>
<p><strong>Hook:</strong> [Start with an engaging opening that captures reader attention.]</p>
<p><strong>Background:</strong> [Provide context and background information on your topic.]</p>
<p><strong>Thesis Statement:</strong> [Clearly state your main argument or position.]</p>
<h2>Body: First Main Point</h2>
<p><strong>Topic Sentence:</strong> [State your first supporting argument.]</p>
<p><strong>Evidence:</strong> [Present facts, statistics, or examples that support this point.]</p>
<p><strong>Analysis:</strong> [Explain how this evidence supports your thesis.]</p>
<h2>Body: Second Main Point</h2>
<p><strong>Topic Sentence:</strong> [State your second supporting argument.]</p>
<p><strong>Evidence:</strong> [Present supporting evidence.]</p>
<p><strong>Analysis:</strong> [Explain the significance of this evidence.]</p>
<h2>Body: Counterargument & Rebuttal</h2>
<p>[Acknowledge opposing viewpoints fairly. Explain why your position is stronger. Provide evidence to refute counterarguments.]</p>
<h2>Conclusion</h2>
<p>[Restate thesis in new words. Summarize main points. End with a call to action or thought-provoking statement.]</p>
<h2>References</h2>
<p>[List all cited sources.]</p>`;

    default:
      return "";
  }
}

export function TemplatePicker({ onClose }) {
  const { editor, setDocumentTitle, setDocumentFormat } = useWritingStudio();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState("apa");
  const [fields, setFields] = useState({});

  const docType = DOCUMENT_TYPES.find(t => t.id === selectedType);

  const handleFieldChange = (key, value) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    if (!editor || !selectedType) return;
    const content = generateTemplateContent(selectedType, fields, selectedFormat);
    editor.commands.setContent(content);
    const title = fields.courseName
      ? `${docType.name} - ${fields.courseName}`
      : `${docType.name} - Untitled`;
    setDocumentTitle(title);
    setDocumentFormat(selectedFormat);
    toast.success(`${docType.name} created with ${selectedFormat.toUpperCase()} formatting`);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={springTransition}
        className="w-full max-w-xl bg-background rounded-xl shadow-2xl mx-4 overflow-hidden"
      >
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-semibold">
                {step === 1 ? "What are you writing?" : step === 2 ? "Document Details" : "Choose Format"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {step === 1
                  ? "Pick a template that matches your assignment"
                  : step === 2
                  ? "Fill in your submission details"
                  : "Select your university's required format"}
              </p>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3].map(s => (
                <div key={s} className={cn("h-1.5 rounded-full transition-all", s <= step ? "w-8 bg-primary" : "w-4 bg-muted")} />
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={springTransition} className="grid gap-2">
                {DOCUMENT_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => { setSelectedType(type.id); setStep(2); }}
                    className={cn(
                      "w-full p-4 rounded-xl border text-left transition-all flex items-center gap-4 group",
                      selectedType === type.id ? "border-primary bg-primary/5" : "hover:border-primary/40 hover:bg-muted/30"
                    )}
                  >
                    <div className={cn("p-2.5 rounded-xl", type.bgColor)}>
                      <type.icon className={cn("h-5 w-5", type.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{type.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </button>
                ))}
              </motion.div>
            )}

            {step === 2 && docType && (
              <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={springTransition} className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <div className={cn("p-2 rounded-lg", docType.bgColor)}>
                    <docType.icon className={cn("h-4 w-4", docType.color)} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{docType.name}</p>
                    <p className="text-xs text-muted-foreground">{docType.description}</p>
                  </div>
                </div>

                <div className="grid gap-3">
                  {docType.fields.map(fieldKey => (
                    <div key={fieldKey}>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">{FIELD_LABELS[fieldKey]}</label>
                      {fieldKey === "date" ? (
                        <Input
                          type="date"
                          value={fields[fieldKey] || ""}
                          onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
                          className="h-9 text-sm"
                        />
                      ) : (
                        <Input
                          value={fields[fieldKey] || ""}
                          onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
                          placeholder={FIELD_PLACEHOLDERS[fieldKey]}
                          className="h-9 text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={springTransition} className="space-y-3">
                {FORMAT_OPTIONS.filter(f => docType?.formats.includes(f.id)).map(format => (
                  <button
                    key={format.id}
                    onClick={() => setSelectedFormat(format.id)}
                    className={cn(
                      "w-full p-4 rounded-xl border text-left transition-all",
                      selectedFormat === format.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/40 hover:bg-muted/30"
                    )}
                  >
                    <h4 className="font-medium text-sm">{format.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{format.description}</p>
                  </button>
                ))}

                <div className="p-4 rounded-xl bg-muted/50 mt-4">
                  <h4 className="text-xs font-medium text-muted-foreground mb-2">Preview</h4>
                  <div className="text-xs space-y-1">
                    <p><span className="text-muted-foreground">Type:</span> {docType?.name}</p>
                    <p><span className="text-muted-foreground">Name:</span> {fields.studentName || "—"}</p>
                    <p><span className="text-muted-foreground">Course:</span> {fields.courseCode ? `${fields.courseCode}: ${fields.courseName || ""}` : "—"}</p>
                    <p><span className="text-muted-foreground">University:</span> {fields.university || "—"}</p>
                    <p><span className="text-muted-foreground">Format:</span> {FORMAT_OPTIONS.find(f => f.id === selectedFormat)?.name}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-4 border-t flex items-center gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
          {step === 2 && (
            <Button
              onClick={() => {
                if (!fields.studentName?.trim()) {
                  toast.warn("Please enter your name to continue");
                  return;
                }
                setStep(3);
              }}
              className="flex-1 gap-2"
            >
              Next: Choose Format <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          {step === 3 && (
            <Button onClick={handleApply} className="flex-1 gap-2">
              <Sparkles className="h-4 w-4" />
              Create Document
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
