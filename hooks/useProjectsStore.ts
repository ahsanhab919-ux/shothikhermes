"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { useSelector } from "react-redux";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  getProjects as getLocalProjects,
  createProject as createLocalProject,
  updateProject as updateLocalProject,
  deleteProject as deleteLocalProject,
  getTemplates,
  getDefaultSections,
} from "@/lib/projects-store";

export { getTemplates, getDefaultSections };

interface AuthState {
  auth: {
    user: {
      id?: string;
      clerkId?: string;
      [key: string]: unknown;
    } | null;
  };
}

interface ProjectParams {
  title: string;
  type: string;
  template?: string;
  description?: string;
  settings?: Record<string, unknown>;
  researchNotes?: unknown;
  agentChapters?: unknown;
}

interface ProjectData {
  _id: string | Id<"projects">;
  title: string;
  type: string;
  template?: string | null;
  description: string;
  content: string;
  sections: unknown[];
  settings: Record<string, unknown>;
  wordCount: number;
  progress: number;
  starred: boolean;
  lastEditedAt: number;
  _creationTime: number;
}

interface ProjectUpdates {
  title?: string;
  description?: string;
  content?: string;
  wordCount?: number;
  progress?: number;
  starred?: boolean;
  sections?: unknown[];
  settings?: Record<string, unknown>;
}

export function useProjectsStore() {
  const user = useSelector((state: AuthState) => state.auth.user);
  const clerkUserId = user?.id || user?.clerkId || null;

  const convexProjects = useQuery(
    api.projects.list,
    clerkUserId ? {} : "skip"
  );

  const createConvex = useMutation(api.projects.create);
  const updateConvex = useMutation(api.projects.update);
  const removeConvex = useMutation(api.projects.remove);

  const [localProjects, setLocalProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!clerkUserId) {
      setLocalProjects(getLocalProjects() as ProjectData[]);
      setIsLoading(false);
    } else if (convexProjects !== undefined) {
      setIsLoading(false);
    }
  }, [clerkUserId, convexProjects]);

  const projects = clerkUserId && convexProjects
    ? (convexProjects as ProjectData[])
    : localProjects;

  const createProject = useCallback(async (params: ProjectParams): Promise<ProjectData> => {
    const defaultSections = getDefaultSections(params.type);

    if (clerkUserId) {
      const id = await createConvex({
        title: params.title,
        type: params.type as "book" | "research" | "assignment",
        template: params.template || undefined,
        description: params.description || "",
        sections: defaultSections as any,
        settings: params.settings as any,
      });
      return {
        _id: id,
        title: params.title,
        type: params.type,
        template: params.template || null,
        description: params.description || "",
        content: "",
        sections: defaultSections,
        settings: (params.settings || {}) as Record<string, unknown>,
        wordCount: 0,
        progress: 0,
        lastEditedAt: Date.now(),
        _creationTime: Date.now(),
        starred: false,
      };
    } else {
      const project = createLocalProject(params as any);
      setLocalProjects(getLocalProjects() as ProjectData[]);
      return project as ProjectData;
    }
  }, [clerkUserId, createConvex]);

  const updateProject = useCallback(async (
    id: string,
    updates: ProjectUpdates
  ) => {
    if (clerkUserId) {
      const convexId = id as Id<"projects">;
      try {
        await updateConvex({
          id: convexId,
          ...(updates.title !== undefined && { title: updates.title }),
          ...(updates.content !== undefined && { content: updates.content }),
          ...(updates.wordCount !== undefined && { wordCount: updates.wordCount }),
          ...(updates.progress !== undefined && { progress: updates.progress }),
          ...(updates.starred !== undefined && { starred: updates.starred }),
          ...(updates.sections !== undefined && { sections: updates.sections as any }),
          ...(updates.settings !== undefined && { settings: updates.settings as any }),
        });
      } catch (err) {
        console.error("[useProjectsStore] update failed:", err);
        throw err;
      }
    } else {
      updateLocalProject(id, updates);
      setLocalProjects(getLocalProjects() as ProjectData[]);
    }
  }, [clerkUserId, updateConvex]);

  const deleteProject = useCallback(async (id: string) => {
    if (clerkUserId) {
      const convexId = id as Id<"projects">;
      try {
        await removeConvex({ id: convexId });
      } catch (err) {
        console.error("[useProjectsStore] delete failed:", err);
        throw err;
      }
    } else {
      deleteLocalProject(id);
      setLocalProjects(getLocalProjects() as ProjectData[]);
    }
  }, [clerkUserId, removeConvex]);

  return {
    projects,
    isLoading,
    isAuthenticated: !!clerkUserId,
    createProject,
    updateProject,
    deleteProject,
  };
}
