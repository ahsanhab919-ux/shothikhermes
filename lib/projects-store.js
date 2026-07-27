const STORAGE_KEY = "shothik_writing_projects";

const DEFAULT_SECTIONS = {
  book: [
    { id: "ch1", title: "Chapter 1: Untitled", content: "", order: 0, children: [
      { id: "s1-1", title: "Scene 1", content: "", order: 0, status: "not_started" }
    ]},
    { id: "ch2", title: "Chapter 2: Untitled", content: "", order: 1, children: [
      { id: "s2-1", title: "Scene 1", content: "", order: 0, status: "not_started" }
    ]},
  ],
  research: [
    { id: "abstract", title: "Abstract", content: "", order: 0 },
    { id: "intro", title: "Introduction", content: "", order: 1 },
    { id: "lit-review", title: "Literature Review", content: "", order: 2 },
    { id: "methodology", title: "Methodology", content: "", order: 3 },
    { id: "results", title: "Results", content: "", order: 4 },
    { id: "discussion", title: "Discussion", content: "", order: 5 },
    { id: "conclusion", title: "Conclusion", content: "", order: 6 },
    { id: "references", title: "References", content: "", order: 7 },
  ],
  assignment: [
    { id: "intro", title: "Introduction", content: "", order: 0 },
    { id: "body-1", title: "Body Section 1", content: "", order: 1 },
    { id: "body-2", title: "Body Section 2", content: "", order: 2 },
    { id: "conclusion", title: "Conclusion", content: "", order: 3 },
    { id: "references", title: "References", content: "", order: 4 },
  ],
};

const TEMPLATES = {
  book: [
    { id: "novel", name: "Novel", description: "Full-length fiction with chapters and scenes", icon: "BookOpen" },
    { id: "short-story", name: "Short Story Collection", description: "Multiple interconnected short stories", icon: "Library" },
    { id: "non-fiction", name: "Non-Fiction Book", description: "Structured non-fiction with parts and chapters", icon: "GraduationCap" },
    { id: "poetry", name: "Poetry Collection", description: "A collection of poems organized by theme", icon: "Feather" },
    { id: "blank-book", name: "Blank Book", description: "Start from scratch with an empty manuscript", icon: "FileText" },
  ],
  research: [
    { id: "journal-article", name: "Journal Article", description: "Standard IMRaD structure for journal submission", icon: "FileText" },
    { id: "thesis", name: "Thesis / Dissertation", description: "Multi-chapter thesis with literature review", icon: "GraduationCap" },
    { id: "conference-paper", name: "Conference Paper", description: "Short paper for conference proceedings", icon: "Users" },
    { id: "review-paper", name: "Review Paper", description: "Systematic literature review or meta-analysis", icon: "Search" },
    { id: "blank-paper", name: "Blank Paper", description: "Start from scratch with custom structure", icon: "FileText" },
  ],
  assignment: [
    { id: "essay", name: "Essay", description: "Standard academic essay with intro, body, conclusion", icon: "FileText" },
    { id: "lab-report", name: "Lab Report", description: "Scientific lab report with methods and results", icon: "FlaskConical" },
    { id: "case-study", name: "Case Study", description: "Business or academic case study analysis", icon: "Briefcase" },
    { id: "literature-review", name: "Literature Review", description: "Critical review of existing research", icon: "BookOpen" },
    { id: "thesis-proposal", name: "Thesis Proposal", description: "Research proposal with methodology plan", icon: "Lightbulb" },
    { id: "blank-assignment", name: "Blank Assignment", description: "Start from scratch", icon: "FileText" },
  ],
};

function generateId() {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getProjects() {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveProjects(projects) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function createProject({ title, type, template, description, settings, researchNotes, agentChapters }) {
  const project = {
    _id: generateId(),
    title,
    type,
    template: template || null,
    description: description || "",
    content: "",
    sections: DEFAULT_SECTIONS[type] || [],
    settings: settings || {},
    wordCount: 0,
    progress: 0,
    lastEditedAt: Date.now(),
    _creationTime: Date.now(),
    starred: false,
    researchNotes: researchNotes || null,
    agentChapters: agentChapters || null,
  };

  const projects = getProjects();
  projects.unshift(project);
  saveProjects(projects);
  return project;
}

export function getProject(id) {
  const projects = getProjects();
  return projects.find((p) => p._id === id) || null;
}

export function updateProject(id, updates) {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p._id === id);
  if (idx === -1) return null;
  projects[idx] = { ...projects[idx], ...updates, lastEditedAt: Date.now() };
  saveProjects(projects);
  return projects[idx];
}

export function deleteProject(id) {
  const projects = getProjects();
  saveProjects(projects.filter((p) => p._id !== id));
}

export function getTemplates(type) {
  return TEMPLATES[type] || [];
}

export function getDefaultSections(type) {
  return DEFAULT_SECTIONS[type] || [];
}
