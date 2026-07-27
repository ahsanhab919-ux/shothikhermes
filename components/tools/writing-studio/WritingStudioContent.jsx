"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import WritingHomeDashboard from "./dashboard/WritingHomeDashboard";
import { WorkspaceHeader } from "./workspace/WorkspaceHeader";
import { WriteView } from "./workspace/WriteView";
import { OutlineView } from "./workspace/OutlineView";
import { FormattingView } from "./workspace/FormattingView";
import { PublishView } from "./workspace/PublishView";
import ResearchPaperWriteView from "./workspace/ResearchPaperWriteView";
import AssignmentWriteView from "./workspace/AssignmentWriteView";
import { useProjectsStore } from "@/hooks/useProjectsStore";

const BOOK_TABS = [
  { id: "write", label: "Write" },
  { id: "outline", label: "Outline" },
  { id: "formatting", label: "Formatting" },
  { id: "publish", label: "Publish" },
];

const RESEARCH_TABS = [
  { id: "write", label: "Write" },
  { id: "research", label: "Research" },
  { id: "citations", label: "Citations" },
  { id: "submit", label: "Submit" },
];

const ASSIGNMENT_TABS = [
  { id: "write", label: "Write" },
  { id: "research", label: "Research" },
  { id: "review", label: "Review" },
  { id: "submit", label: "Submit" },
];

function getTabsForType(type) {
  switch (type) {
    case "research": return RESEARCH_TABS;
    case "assignment": return ASSIGNMENT_TABS;
    default: return BOOK_TABS;
  }
}

function WorkspaceView({ project, onBack }) {
  const [activeTab, setActiveTab] = useState("write");
  const [title, setTitle] = useState(project?.title || "Untitled Project");
  const { updateProject } = useProjectsStore();

  const tabs = getTabsForType(project?.type);

  const handleTitleChange = useCallback((newTitle) => {
    setTitle(newTitle);
    if (project?._id) {
      updateProject(project._id, { title: newTitle });
    }
  }, [project, updateProject]);

  function renderView() {
    if (project?.type === "book") {
      switch (activeTab) {
        case "write": return <WriteView bookTitle={title} project={project} />;
        case "outline": return <OutlineView bookTitle={title} project={project} />;
        case "formatting": return <FormattingView bookTitle={title} project={project} />;
        case "publish": return <PublishView bookTitle={title} project={project} />;
        default: return <WriteView bookTitle={title} project={project} />;
      }
    }

    if (project?.type === "research") {
      switch (activeTab) {
        case "write": return <ResearchPaperWriteView bookTitle={title} project={project} />;
        case "research": return <ResearchPaperWriteView bookTitle={title} project={project} tabMode="research" />;
        case "citations": return <ResearchPaperWriteView bookTitle={title} project={project} tabMode="citations" />;
        case "submit": return <ResearchPaperWriteView bookTitle={title} project={project} tabMode="submit" />;
        default: return <ResearchPaperWriteView bookTitle={title} project={project} />;
      }
    }

    if (project?.type === "assignment") {
      switch (activeTab) {
        case "write": return <AssignmentWriteView bookTitle={title} project={project} />;
        case "research": return <AssignmentWriteView bookTitle={title} project={project} tabMode="research" />;
        case "review": return <AssignmentWriteView bookTitle={title} project={project} tabMode="review" />;
        case "submit": return <AssignmentWriteView bookTitle={title} project={project} tabMode="submit" />;
        default: return <AssignmentWriteView bookTitle={title} project={project} />;
      }
    }

    return <WriteView bookTitle={title} project={project} />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-[#f6f7f8] dark:bg-brand-surface text-zinc-900 dark:text-zinc-100" style={{ fontFamily: "'Inter', sans-serif" }}>
      <WorkspaceHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        title={title}
        onTitleChange={handleTitleChange}
        tabs={tabs}
        projectType={project?.type}
        onBack={onBack}
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="flex flex-1 overflow-hidden"
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function WritingStudioContent() {
  const [currentProject, setCurrentProject] = useState(null);

  if (currentProject) {
    return (
      <WorkspaceView
        project={currentProject}
        onBack={() => setCurrentProject(null)}
      />
    );
  }

  return <WritingHomeDashboard onOpenProject={setCurrentProject} />;
}
