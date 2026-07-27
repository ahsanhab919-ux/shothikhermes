"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import WritingHomeDashboard from "@/components/tools/writing-studio/dashboard/WritingHomeDashboard";
import { PolishedWriteView } from "@/components/writing-studio/PolishedWriteView";
import { UnifiedStudioHub } from "@/components/writing-studio/UnifiedStudioHub";
import { trackWritingStudioOpened } from "@/lib/posthog";
import { getProject } from "@/lib/projects-store";
import { clearWritingStudioSeed, getWritingStudioSeed } from "@/lib/writing-studio-seed";

function WritingStudioInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const showProjects = searchParams.get("projects") === "1";
  const showChat = searchParams.get("tab") === "chat";
  const projectId = searchParams.get("projectId");
  const intent = searchParams.get("intent");
  const initialProjectType =
    intent === "research" || intent === "assignment" || intent === "book" ? intent : "book";

  const [view, setView] = useState(showProjects ? "projects" : "hub");
  const [activeProject, setActiveProject] = useState(null);
  const [seedDescription, setSeedDescription] = useState("");

  useEffect(() => {
    trackWritingStudioOpened();
  }, []);

  useEffect(() => {
    if (showProjects && view !== "projects") {
      setView("projects");
    } else if (!showProjects && view === "projects") {
      setView("hub");
    }
  }, [showProjects]);

  useEffect(() => {
    if (showChat) {
      router.replace("/writing-studio/chat");
    }
  }, [showChat, router]);

  useEffect(() => {
    if (!projectId) return;
    const project = getProject(projectId);
    if (!project) return;
    setActiveProject(project);
    setView("editor");
  }, [projectId]);

  useEffect(() => {
    if (projectId) return;
    const seed = getWritingStudioSeed();
    if (!seed) return;
    setSeedDescription(seed.description || "");
    clearWritingStudioSeed();
  }, [projectId]);

  if (showChat) {
    return <div className="h-screen bg-background" />;
  }

  if (view === "editor" && activeProject) {
    return (
      <PolishedWriteView
        key={activeProject._id}
        project={activeProject}
        bookTitle={activeProject.title}
        projectType={activeProject.type || "book"}
        onBack={() => {
          setActiveProject(null);
          setView("hub");
        }}
      />
    );
  }

  if (view === "projects") {
    return (
      <div className="h-screen">
        <WritingHomeDashboard
          onOpenProject={(project) => {
            setActiveProject(project);
            setView("editor");
          }}
          onNewProject={() => {
            router.push("/writing-studio");
            setView("hub");
          }}
        />
      </div>
    );
  }

  return (
    <UnifiedStudioHub
      initialProjectType={initialProjectType}
      initialDescription={seedDescription}
      onProjectCreated={(project) => {
        setActiveProject(project);
        setView("editor");
      }}
      onCancel={() => setView("projects")}
    />
  );
}

export default function WritingStudioPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-[#0f0f0f]" />}>
      <WritingStudioInner />
    </Suspense>
  );
}
