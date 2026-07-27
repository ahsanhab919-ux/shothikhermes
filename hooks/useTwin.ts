"use client";

import { useQuery, useMutation, useConvex } from "convex/react";
import { twinApi } from "@/lib/twin-convex";
import type { TwinRecord, TwinTask, TwinActivityLogEntry, TwinApproval, TwinTransferRequest } from "@/lib/twin-convex";
import type { Id } from "@/convex/_generated/dataModel";
import { useSelector } from "react-redux";
import { useState, useCallback, useEffect, useMemo } from "react";
import {
  trackTwinOnboarded,
  trackTwinCreated,
  trackTwinTrainingStarted,
  trackTwinTrainingCompleted,
  trackTwinTaskQueued,
  trackTwinStatusToggled,
  trackTwinApprovalResolved,
} from "@/lib/posthog";

interface AuthState {
  auth: { user: { id?: string; _id?: string; userId?: string; name?: string } | null };
}

interface KnowledgeEntry {
  sourceType: "writing_history" | "project" | "chat" | "manual";
}

export function useTwin() {
  const { user } = useSelector((state: AuthState) => state.auth);
  const userId = user?.id ?? user?._id ?? user?.userId ?? null;
  const userName = user?.name ?? null;

  const profile = useQuery(
    twinApi.twin.getByMaster,
    userId ? { masterId: userId } : "skip"
  ) as TwinRecord | null | undefined;

  const tasks = useQuery(
    twinApi.twin.getTasksByUser,
    userId ? { userId } : "skip"
  ) as TwinTask[] | undefined;

  const knowledge = useQuery(
    twinApi.twin.getKnowledgeByUser,
    userId ? { userId } : "skip"
  ) as KnowledgeEntry[] | undefined;

  const [activityCursor, setActivityCursor] = useState<number | undefined>(undefined);
  const [allActivityLogs, setAllActivityLogs] = useState<TwinActivityLogEntry[]>([]);

  const activityLogPage = useQuery(
    twinApi.twin.getActivityLog,
    profile?._id ? { twinId: profile._id, beforeTimestamp: activityCursor } : "skip"
  ) as { logs: TwinActivityLogEntry[]; hasMore: boolean; nextCursor?: number } | undefined;

  const pendingApprovals = useQuery(
    twinApi.twin.getPendingApprovals,
    userId ? { masterId: userId } : "skip"
  ) as TwinApproval[] | undefined;

  const transferRequests = useQuery(
    twinApi.twin.getTransferRequestsForUser,
    userId ? { userId } : "skip"
  ) as { incoming: TwinTransferRequest[]; outgoing: TwinTransferRequest[] } | undefined;

  const createOrUpdateMutation = useMutation(twinApi.twin.createOrUpdate);
  const setActiveMutation = useMutation(twinApi.twin.setActive);
  const incrementKnowledgeMutation = useMutation(twinApi.twin.incrementKnowledge);
  const createTaskMutation = useMutation(twinApi.twin.createTask);
  const addKnowledgeMutation = useMutation(twinApi.twin.addKnowledge);
  const claimTwinMutation = useMutation(twinApi.twin.claimTwin);
  const requestVerificationMutation = useMutation(twinApi.twin.requestVerification);
  const verifyTwinMutation = useMutation(twinApi.twin.verifyTwin);
  const unlinkTwinMutation = useMutation(twinApi.twin.unlinkTwin);
  const updatePermissionsMutation = useMutation(twinApi.twin.updatePermissions);
  const requestTransferMutation = useMutation(twinApi.twin.requestTransfer);
  const rejectTransferMutation = useMutation(twinApi.twin.rejectTransfer);
  const approveActionMutation = useMutation(twinApi.twin.approveAction);
  const rejectActionMutation = useMutation(twinApi.twin.rejectAction);

  useEffect(() => {
    if (activityLogPage?.logs) {
      if (!activityCursor) {
        setAllActivityLogs(activityLogPage.logs);
      } else {
        setAllActivityLogs((prev) => {
          const existingIds = new Set(prev.map((l) => l._id));
          const newLogs = activityLogPage.logs.filter((l) => !existingIds.has(l._id));
          return [...prev, ...newLogs];
        });
      }
    }
  }, [activityLogPage, activityCursor]);

  const loadMoreActivity = useCallback(() => {
    if (activityLogPage?.hasMore && activityLogPage.nextCursor) {
      setActivityCursor(activityLogPage.nextCursor);
    }
  }, [activityLogPage]);

  const convex = useConvex();

  const resolveRecipient = useCallback(
    async (identifier: string): Promise<{ userId: string; name: string } | null> => {
      const result = await convex.query(twinApi.twin.resolveRecipient, { identifier });
      return result as { userId: string; name: string } | null;
    },
    [convex]
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);

  const isOrphan = profile ? !profile.masterId : false;

  const updateProfile = useCallback(
    async (data: {
      name?: string;
      persona?: string;
      expertiseAreas?: string[];
      communicationStyle?: "formal" | "casual" | "academic" | "creative";
      goals?: string[];
      languages?: string[];
    }) => {
      if (!userId) return;
      const isNew = !profile;
      setIsSaving(true);
      try {
        await createOrUpdateMutation({ masterId: userId, ...data });
        if (isNew) {
          trackTwinOnboarded();
          trackTwinCreated();
        }
      } finally {
        setIsSaving(false);
      }
    },
    [userId, profile, createOrUpdateMutation]
  );

  const trainNow = useCallback(async (textSamples?: string[]) => {
    if (!userId || !profile) return;

    const samples = textSamples?.filter((s) => s.trim().length > 0) ?? [];
    if (samples.length === 0) {
      throw new Error("Please provide at least one writing sample to train your Twin.");
    }

    const totalWordCount = samples.reduce((sum, s) => sum + s.split(/\s+/).length, 0);
    setIsTraining(true);
    trackTwinTrainingStarted(totalWordCount, samples.length);
    setTrainingProgress(10);

    try {
      setTrainingProgress(30);

      const res = await fetch("/api/twin/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textSamples: samples }),
      });

      setTrainingProgress(80);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Training failed");
      }

      setTrainingProgress(100);
      trackTwinTrainingCompleted(0, 0);
    } finally {
      setTimeout(() => {
        setIsTraining(false);
        setTrainingProgress(0);
      }, 500);
    }
  }, [userId, profile]);

  const toggleActive = useCallback(
    async (isActive: boolean) => {
      if (!userId) return;
      await setActiveMutation({ masterId: userId, isActive });
      trackTwinStatusToggled(isActive);
    },
    [userId, setActiveMutation]
  );

  const queueTask = useCallback(
    async (data: {
      title: string;
      description?: string;
      taskType: "research" | "writing" | "analysis" | "summary";
    }) => {
      if (!userId || !profile) return;
      const res = await fetch("/api/twin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to queue task");
      }
      trackTwinTaskQueued(data.taskType);
      return await res.json();
    },
    [userId, profile]
  );

  const claimTwin = useCallback(
    async (registrationToken: string) => {
      if (!userId) return;
      return await claimTwinMutation({ masterId: userId, registrationToken });
    },
    [userId, claimTwinMutation]
  );

  const requestVerification = useCallback(async () => {
    if (!profile) return;
    return await requestVerificationMutation({ twinId: profile._id });
  }, [profile, requestVerificationMutation]);

  const verifyTwin = useCallback(async () => {
    if (!profile) return;
    return await verifyTwinMutation({ twinId: profile._id });
  }, [profile, verifyTwinMutation]);

  const unlinkTwin = useCallback(async () => {
    if (!profile) return;
    return await unlinkTwinMutation({ twinId: profile._id });
  }, [profile, unlinkTwinMutation]);

  const updatePermissions = useCallback(
    async (data: {
      allowedSkills?: string[];
      blockedSkills?: string[];
      approvalRequiredActions?: string[];
    }) => {
      if (!profile) return;
      return await updatePermissionsMutation({ twinId: profile._id, ...data });
    },
    [profile, updatePermissionsMutation]
  );

  const revokeAndRotateKey = useCallback(
    async (): Promise<string | null> => {
      const res = await fetch("/api/twin/revoke-key", { method: "POST" });
      const data = await res.json();
      if (data.newKey) return data.newKey as string;
      return null;
    },
    []
  );

  const initiateTransfer = useCallback(
    async (toMasterId: string) => {
      if (!profile) return;
      return await requestTransferMutation({ twinId: profile._id, toMasterId });
    },
    [profile, requestTransferMutation]
  );

  const acceptTransfer = useCallback(
    async (args: { requestId: string }) => {
      const res = await fetch("/api/twin/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept", requestId: args.requestId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Transfer accept failed");
      return data;
    },
    []
  );

  const approveAction = useCallback(
    async (approvalId: string) => {
      const res = await fetch("/api/twin/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId, action: "approve" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Approval failed");
      }
      trackTwinApprovalResolved(approvalId, "approve");
      return await res.json();
    },
    []
  );

  const rejectAction = useCallback(
    async (approvalId: string) => {
      const res = await fetch("/api/twin/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId, action: "reject" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Rejection failed");
      }
      trackTwinApprovalResolved(approvalId, "reject");
      return await res.json();
    },
    []
  );

  const styleProfile = useMemo(() => {
    if (!knowledge || knowledge.length === 0) return null;
    const entries = knowledge as unknown as Array<Record<string, unknown>>;
    const styleEntries = entries
      .filter((k) => k.summary === "__style_profile__")
      .sort((a, b) => (Number(b.addedAt) || 0) - (Number(a.addedAt) || 0));
    if (styleEntries.length > 0 && styleEntries[0].content) {
      try {
        return JSON.parse(styleEntries[0].content as string) as {
          avgSentenceLength: number;
          formalityScore: number;
          vocabularyComplexity: number;
          domainKeywords: string[];
          preferredStructures: string[];
          toneDescriptor: string;
          writingPatterns: string[];
        };
      } catch {
        return null;
      }
    }
    return null;
  }, [knowledge]);

  const knowledgeSources = knowledge
    ? Object.entries(
        (knowledge as KnowledgeEntry[]).reduce(
          (acc: Record<string, number>, k: KnowledgeEntry) => {
            acc[k.sourceType] = (acc[k.sourceType] ?? 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        )
      ).map(([type, count]) => ({
        type: type as "writing_history" | "project" | "chat" | "manual",
        count: count as number,
      }))
    : [];

  return {
    profile,
    tasks: (tasks ?? []) as TwinTask[],
    knowledge: knowledge ?? [],
    knowledgeSources,
    styleProfile,
    activityLog: allActivityLogs as TwinActivityLogEntry[],
    activityHasMore: activityLogPage?.hasMore ?? false,
    loadMoreActivity,
    pendingApprovals: (pendingApprovals ?? []) as TwinApproval[],
    transferRequests: transferRequests ?? { incoming: [] as TwinTransferRequest[], outgoing: [] as TwinTransferRequest[] },
    isLoading: profile === undefined,
    isOrphan,
    isSaving,
    isTraining,
    trainingProgress,
    userId,
    userName,
    updateProfile,
    trainNow,
    toggleActive,
    queueTask,
    claimTwin,
    requestVerification,
    verifyTwin,
    unlinkTwin,
    updatePermissions,
    revokeAndRotateKey,
    initiateTransfer,
    acceptTransfer,
    rejectTransfer: rejectTransferMutation,
    approveAction,
    rejectAction,
    resolveRecipient,
  };
}
