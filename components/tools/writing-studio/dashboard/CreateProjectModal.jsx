"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  BookOpen,
  FlaskConical,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  FileText,
  Library,
  Feather,
  Search,
  Users,
  Briefcase,
  Lightbulb,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { getTemplates } from "@/lib/projects-store";

const ICON_MAP = {
  BookOpen, Library, GraduationCap, Feather, FileText, Search, Users, Briefcase, Lightbulb, FlaskConical,
};

const PURPOSE_CARDS = [
  {
    type: "book",
    title: "Book Writing & Publishing",
    description: "Write, format, and publish your book. From novel to non-fiction, with AI-powered chapter planning and one-click export to KDP, EPUB, and PDF.",
    icon: BookOpen,
    color: "var(--color-brand)",
    bgGradient: "from-blue-500/10 to-blue-600/5",
    features: ["AI Chapter Planner", "Story Bible", "KDP Export", "Cover Generator"],
  },
  {
    type: "research",
    title: "Research Paper",
    description: "Write, cite, and submit your research. IMRaD structure with smart citations, literature search, and journal-ready formatting.",
    icon: FlaskConical,
    color: "var(--color-type-research)",
    bgGradient: "from-emerald-500/10 to-emerald-600/5",
    features: ["Smart Citations", "Literature Search", "Journal Templates", "LaTeX Export"],
  },
  {
    type: "assignment",
    title: "University Assignment",
    description: "Complete assignments with integrity. Essay, lab report, or case study templates with rubric checking and plagiarism tools.",
    icon: GraduationCap,
    color: "var(--color-type-assignment)",
    bgGradient: "from-amber-500/10 to-amber-600/5",
    features: ["Rubric Checker", "Plagiarism Check", "Citation Manager", "Deadline Tracker"],
  },
];

export default function CreateProjectModal({
  onClose,
  onProjectCreated,
  onStartAgentFlow,
  createProject: createProjectFn,
  initialType = null,
}) {
  const [step, setStep] = useState(initialType ? 2 : 1);
  const [selectedType, setSelectedType] = useState(initialType);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [projectTitle, setProjectTitle] = useState("");

  const templates = selectedType ? getTemplates(selectedType) : [];
  const purposeConfig = PURPOSE_CARDS.find((p) => p.type === selectedType);

  useEffect(() => {
    setSelectedType(initialType);
    setSelectedTemplate(null);
    setProjectTitle("");
    setStep(initialType ? 2 : 1);
  }, [initialType]);

  async function handleCreate() {
    if (!selectedType || !projectTitle.trim()) return;
    const createFn = createProjectFn || (await import("@/lib/projects-store")).createProject;
    const project = await createFn({
      title: projectTitle.trim(),
      type: selectedType,
      template: selectedTemplate || null,
      description: "",
      settings: selectedType === "research" ? { citationStyle: "APA" } : {},
    });
    onProjectCreated(project);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Create new project"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                aria-label="Go back"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {step === 1 ? "Create New Project" : step === 2 ? "Choose a Template" : "Name Your Project"}
              </h2>
              <p className="text-xs text-muted-foreground">Step {step} of 3</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2 px-6 pt-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all ${s <= step ? "bg-brand" : "bg-muted"}`} />
          ))}
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">What would you like to work on?</p>

              {onStartAgentFlow && (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => { onClose(); onStartAgentFlow(); }}
                  className="w-full text-left p-5 rounded-xl border-2 border-brand/50 bg-gradient-to-br from-blue-500/8 to-purple-500/5 hover:border-brand hover:from-blue-500/12 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/10 flex items-center justify-center shrink-0">
                      <Sparkles size={22} className="text-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm text-foreground">Build with AI Agent</h3>
                        <span className="px-1.5 py-0.5 bg-brand/15 text-brand text-[10px] font-bold rounded-full uppercase tracking-wide">Recommended</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Describe your idea, add reference sources, and let the AI research, plan chapters, and scaffold your entire project.
                      </p>
                    </div>
                    <ArrowRight size={16} className="text-brand opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0" />
                  </div>
                </motion.button>
              )}

              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">or start from a template</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {PURPOSE_CARDS.map((card) => {
                const Icon = card.icon;
                const isSelected = selectedType === card.type;
                return (
                  <motion.button
                    key={card.type}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedType(card.type)}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-brand bg-blue-50/50 dark:bg-blue-950/20"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.bgGradient} flex items-center justify-center shrink-0`}>
                        <Icon size={22} style={{ color: card.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm text-foreground">{card.title}</h3>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center">
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{card.description}</p>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {card.features.map((f) => (
                            <span key={f} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Choose a starting template for your {purposeConfig?.title.toLowerCase()}:
              </p>
              {purposeConfig && (
                <div className="mb-4 rounded-xl border border-border bg-muted/40 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Recommended path
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {purposeConfig.description}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {templates.map((tmpl) => {
                  const Icon = ICON_MAP[tmpl.icon] || FileText;
                  const isSelected = selectedTemplate === tmpl.id;
                  return (
                    <motion.button
                      key={tmpl.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedTemplate(tmpl.id)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? "border-brand bg-blue-50/50 dark:bg-blue-950/20"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <Icon size={18} className="mb-2" style={{ color: purposeConfig?.color }} />
                      <h4 className="text-sm font-semibold text-foreground">{tmpl.name}</h4>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{tmpl.description}</p>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/20 dark:to-transparent border border-border">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${purposeConfig?.color}15` }}>
                  {purposeConfig && <purposeConfig.icon size={18} style={{ color: purposeConfig.color }} />}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{purposeConfig?.title}</p>
                  <p className="text-sm font-semibold text-foreground">
                    {templates.find((t) => t.id === selectedTemplate)?.name || "Custom"}
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="create-project-title-input" className="block text-sm font-medium text-foreground mb-2">Project Title</label>
                <input
                  id="create-project-title-input"
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder={
                    selectedType === "book" ? "e.g., The Midnight Protocol"
                    : selectedType === "research" ? "e.g., Neural Network Optimization in Edge Computing"
                    : "e.g., CS301 Final Assignment"
                  }
                  className="w-full px-4 py-3 text-sm bg-muted/50 border border-border rounded-xl outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all text-foreground placeholder:text-muted-foreground"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter" && projectTitle.trim()) handleCreate(); }}
                  aria-label="Project title"
                  aria-required="true"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-type-assignment-subtle border border-border">
                <Sparkles size={14} className="text-type-assignment shrink-0" />
                <p className="text-xs text-muted-foreground">
                  AI will generate a smart outline based on your project type and template when you create it.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          {step < 3 ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (step === 1 && !selectedType) return;
                setStep(step + 1);
              }}
              disabled={step === 1 && !selectedType}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Continue <ChevronRight size={14} />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreate}
              disabled={!projectTitle.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Create Project <ArrowRight size={14} />
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
