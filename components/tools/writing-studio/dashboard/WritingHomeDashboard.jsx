"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  BookOpen,
  FlaskConical,
  GraduationCap,
  MoreHorizontal,
  Trash2,
  Clock,
  FileText,
  LayoutGrid,
  List,
  Loader2,
  Cloud,
  ArrowRight,
} from "lucide-react";
import { getTemplates, useProjectsStore } from "@/hooks/useProjectsStore";
import CreateProjectModal from "./CreateProjectModal";

const TYPE_CONFIG = {
  book: { label: "Book", color: "var(--color-type-book)", bgColor: "bg-type-book-subtle", icon: BookOpen },
  research: { label: "Research Paper", color: "var(--color-type-research)", bgColor: "bg-type-research-subtle", icon: FlaskConical },
  assignment: { label: "Assignment", color: "var(--color-type-assignment)", bgColor: "bg-type-assignment-subtle", icon: GraduationCap },
};

const INTENT_GUIDANCE = {
  writing_studio: {
    title: "Jump back into Writing Studio",
    description: "Create a new project or continue a saved draft with the core writing workspace.",
    cta: "Open project setup",
  },
  research: {
    title: "Start with a research paper",
    description: "Create a research-ready workspace with structure, citations, and source-driven planning.",
    cta: "Create research project",
  },
  assignment: {
    title: "Start your assignment workflow",
    description: "Open an assignment template with rubric-aware planning and writing support.",
    cta: "Create assignment project",
  },
  continue: {
    title: "Continue your recent work",
    description: "Review recent projects or create a fresh workspace if you are starting something new.",
    cta: "Review projects",
  },
};

function formatDate(timestamp) {
  if (!timestamp) return "Just now";
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatWordCount(count) {
  if (!count) return "0 words";
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k words`;
  return `${count} words`;
}

function getRecentProjects(projects, limit = 3) {
  return [...(projects || [])]
    .sort((a, b) => (b.lastEditedAt || 0) - (a.lastEditedAt || 0))
    .slice(0, limit);
}

function ProjectCard({ project, onOpen, onDelete, viewMode }) {
  const [showMenu, setShowMenu] = useState(false);
  const config = TYPE_CONFIG[project.type];
  const Icon = config.icon;

  if (viewMode === "list") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="group flex items-center gap-4 px-4 py-3 bg-card border border-border rounded-xl hover:border-brand/40 hover:shadow-md transition-all cursor-pointer"
        onClick={() => onOpen(project)}
      >
        <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center shrink-0`}>
          <Icon size={18} style={{ color: config.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground truncate">{project.title}</h3>
          <p className="text-xs text-muted-foreground truncate">{project.template || config.label}</p>
        </div>
        <span className="text-xs text-muted-foreground hidden sm:block">{formatWordCount(project.wordCount)}</span>
        <div className="w-20 hidden sm:block">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${project.progress || 0}%`, backgroundColor: config.color }} />
          </div>
        </div>
        <span className="text-xs text-muted-foreground w-16 text-right hidden sm:block">{formatDate(project.lastEditedAt)}</span>
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
            aria-label="Project options"
          >
            <MoreHorizontal size={14} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 bg-card border border-border rounded-lg shadow-lg py-1 z-50 w-36">
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(project._id); setShowMenu(false); }}
                className="flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 w-full"
              >
                <Trash2 size={12} /> Delete Project
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group bg-card border border-border rounded-2xl hover:border-brand/40 hover:shadow-lg transition-all cursor-pointer overflow-hidden"
      onClick={() => onOpen(project)}
    >
      <div className={`h-2 w-full`} style={{ backgroundColor: config.color }} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center`}>
            <Icon size={18} style={{ color: config.color }} />
          </div>
          <div className="flex items-center gap-1">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${config.bgColor}`} style={{ color: config.color }}>
              {config.label}
            </span>
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
                aria-label="Project options"
              >
                <MoreHorizontal size={14} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-7 bg-card border border-border rounded-lg shadow-lg py-1 z-50 w-36">
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(project._id); setShowMenu(false); }}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 w-full"
                  >
                    <Trash2 size={12} /> Delete Project
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <h3 className="font-semibold text-sm text-foreground mb-1 truncate">{project.title}</h3>
        <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
          {project.description || `${project.template || config.label} project`}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1"><FileText size={11} /> {formatWordCount(project.wordCount)}</span>
          <span className="flex items-center gap-1"><Clock size={11} /> {formatDate(project.lastEditedAt)}</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${project.progress || 0}%`, backgroundColor: config.color }} />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 text-right">{project.progress || 0}% complete</p>
      </div>
    </motion.div>
  );
}

export default function WritingHomeDashboard({ onOpenProject, onNewProject }) {
  const { projects, isLoading, isAuthenticated, createProject, deleteProject } = useProjectsStore();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [initialCreateType, setInitialCreateType] = useState(null);

  const intent = searchParams.get("intent");
  const guidance = INTENT_GUIDANCE[intent] || null;
  const recentProjects = useMemo(() => getRecentProjects(projects), [projects]);
  const matchingIntentProjects = useMemo(() => {
    if (intent !== "research" && intent !== "assignment") return [];
    return recentProjects.filter((project) => project.type === intent).slice(0, 2);
  }, [intent, recentProjects]);
  const suggestedTemplates = useMemo(() => {
    if (intent !== "research" && intent !== "assignment") return [];
    return getTemplates(intent).slice(0, 3);
  }, [intent]);

  const filteredProjects = useMemo(() => {
    let result = projects || [];
    if (filterType !== "all") {
      result = result.filter((p) => p.type === filterType);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q));
    }
    return result;
  }, [projects, filterType, searchQuery]);

  const stats = useMemo(() => ({
    total: (projects || []).length,
    books: (projects || []).filter((p) => p.type === "book").length,
    papers: (projects || []).filter((p) => p.type === "research").length,
    assignments: (projects || []).filter((p) => p.type === "assignment").length,
    totalWords: (projects || []).reduce((sum, p) => sum + (p.wordCount || 0), 0),
  }), [projects]);

  async function handleProjectCreated(project) {
    setShowCreateModal(false);
    setInitialCreateType(null);
    onOpenProject(project);
  }

  async function handleDelete(id) {
    await deleteProject(id);
  }

  function openCreateFlow(type = null) {
    setInitialCreateType(type);
    setShowCreateModal(true);
  }

  return (
    <div className="flex flex-col h-full bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="border-b border-border bg-card/80 backdrop-blur-md px-6 py-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Writing Studio</h1>
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                {stats.total} project{stats.total !== 1 ? "s" : ""} &middot; {formatWordCount(stats.totalWords)} total
                {isAuthenticated && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400">
                    <Cloud size={10} /> Synced
                  </span>
                )}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand/90 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition-colors"
              aria-label="Create new project"
            >
              <Plus size={16} /> New Project
            </motion.button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-muted border border-transparent focus:border-brand/40 rounded-lg outline-none transition-colors text-foreground placeholder:text-muted-foreground"
                aria-label="Search projects"
              />
            </div>

            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              {[
                { value: "all", label: "All" },
                { value: "book", label: "Books" },
                { value: "research", label: "Papers" },
                { value: "assignment", label: "Assignments" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilterType(f.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    filterType === f.value
                      ? "bg-background dark:bg-muted text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-label={`Filter by ${f.label}`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-background dark:bg-muted shadow-sm" : "text-muted-foreground"}`}
                aria-label="Grid view"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-background dark:bg-muted shadow-sm" : "text-muted-foreground"}`}
                aria-label="List view"
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-6xl mx-auto">
          {guidance && (
            <div className="mb-6 rounded-2xl border border-border bg-card/80 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Recommended from login
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-foreground">{guidance.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{guidance.description}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {intent === "research" && (
                    <button
                      onClick={() => openCreateFlow("research")}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand/90"
                    >
                      {guidance.cta}
                      <ArrowRight size={14} />
                    </button>
                  )}
                  {intent === "assignment" && (
                    <button
                      onClick={() => openCreateFlow("assignment")}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand/90"
                    >
                      {guidance.cta}
                      <ArrowRight size={14} />
                    </button>
                  )}
                  {intent === "writing_studio" && (
                    <button
                      onClick={() => openCreateFlow(null)}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand/90"
                    >
                      {guidance.cta}
                      <ArrowRight size={14} />
                    </button>
                  )}
                  {intent === "continue" && (
                    <button
                      onClick={() => setFilterType("all")}
                      className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand/90"
                    >
                      {guidance.cta}
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>

              {matchingIntentProjects.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Continue recent work
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {matchingIntentProjects.map((project) => {
                      const config = TYPE_CONFIG[project.type];
                      const Icon = config.icon;
                      return (
                        <button
                          key={project._id}
                          onClick={() => onOpenProject(project)}
                          className="rounded-2xl border border-border bg-background/70 p-4 text-left transition-all hover:border-brand/40 hover:bg-card"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${config.bgColor}`}>
                              <Icon size={18} style={{ color: config.color }} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{project.title}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {project.template || config.label} · {formatDate(project.lastEditedAt)}
                              </p>
                              <p className="mt-2 text-xs text-muted-foreground">
                                {formatWordCount(project.wordCount)} · {project.progress || 0}% complete
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {suggestedTemplates.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Suggested templates
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {suggestedTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => openCreateFlow(intent)}
                        className="rounded-2xl border border-border bg-background/70 p-4 text-left transition-all hover:border-brand/40 hover:bg-card"
                      >
                        <p className="text-sm font-semibold text-foreground">{template.name}</p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">{template.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={32} className="text-brand animate-spin mb-3" />
              <p className="text-sm text-muted-foreground">Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              {projects.length === 0 ? (
                <>
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-950/40 dark:to-background flex items-center justify-center mb-5">
                    <BookOpen size={32} className="text-brand" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Start your first project</h3>
                  <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                    Create a book, research paper, or university assignment. Each gets its own workspace with the right tools.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openCreateFlow(intent === "research" || intent === "assignment" ? intent : null)}
                    className="flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand/90 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 transition-colors"
                  >
                    <Plus size={16} /> Create New Project
                  </motion.button>
                </>
              ) : (
                <>
                  <Search size={32} className="text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No projects match your search</p>
                </>
              )}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className={viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                : "flex flex-col gap-2"
              }>
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    onOpen={onOpenProject}
                    onDelete={handleDelete}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <CreateProjectModal
            onClose={() => setShowCreateModal(false)}
            onProjectCreated={handleProjectCreated}
            onStartAgentFlow={onNewProject}
            initialType={initialCreateType}
            createProject={createProject}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
