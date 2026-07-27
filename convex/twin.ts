import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { requireAdmin } from "./lib/auth";
import { validateTransition, isActiveState, type LifecycleState } from "./twin_lifecycle_transitions";

function requireActiveTwin(twin: Doc<"twins"> | null): Doc<"twins"> {
  if (!twin) throw new Error("Twin not found");
  if (!isActiveState(twin.lifecycleState as LifecycleState)) {
    throw new Error(`Twin is ${twin.lifecycleState} and cannot perform this action. Only verified twins are allowed.`);
  }
  return twin;
}

async function requireTwinCallAuth(
  ctx: { auth: { getUserIdentity: () => Promise<{ subject?: string } | null> } },
  twin: Doc<"twins">,
  keyHash?: string
): Promise<void> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity?.subject) {
    if (identity.subject === twin.masterId) return;
    throw new Error("Unauthorized: identity does not match twin owner");
  }
  if (keyHash && twin.apiKeyHash && keyHash === twin.apiKeyHash) return;
  throw new Error("Unauthorized: valid identity or twin key hash required");
}

const BOOK_CONTENT_TRANSITIONS: Record<string, string[]> = {
  draft: ["agent_generated"],
  agent_generated: ["pending_master_review"],
  pending_master_review: ["approved", "draft"],
  approved: ["published"],
  published: ["community_preview_posted"],
};

function redactTwinSecrets<T extends Record<string, unknown>>(twin: T | null): Omit<T, "apiKeyHash" | "apiKeyPrefix" | "registrationToken"> | null {
  if (!twin) return null;
  const { apiKeyHash: _h, apiKeyPrefix: _p, registrationToken: _t, ...safe } = twin;
  return safe as Omit<T, "apiKeyHash" | "apiKeyPrefix" | "registrationToken">;
}

export const getByMaster = query({
  args: { masterId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject || identity.subject !== args.masterId) {
      throw new Error("Unauthorized: you can only query your own twin");
    }
    const twin = await ctx.db
      .query("twins")
      .withIndex("by_master", (q) => q.eq("masterId", args.masterId))
      .first();
    return redactTwinSecrets(twin as Record<string, unknown> | null);
  },
});

export const getAllByMaster = query({
  args: { masterId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject || identity.subject !== args.masterId) {
      throw new Error("Unauthorized: you can only query your own twins");
    }
    const twins = await ctx.db
      .query("twins")
      .withIndex("by_master", (q) => q.eq("masterId", args.masterId))
      .collect();
    return twins.map((t) => {
      const { apiKeyHash, apiKeyPrefix, registrationToken, ...safe } = t as any;
      const status = t.lifecycleState === "suspended" ? "suspended" : t.isActive ? "active" : "inactive";
      return { ...safe, status };
    });
  },
});

export const getById = query({
  args: { twinId: v.id("twins") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Authentication required");
    const twin = await ctx.db.get(args.twinId);
    if (!twin) return null;
    if (twin.masterId !== identity.subject) {
      throw new Error("Unauthorized: you can only view your own twin");
    }
    return redactTwinSecrets(twin as Record<string, unknown> | null);
  },
});

export const getPublicById = query({
  args: { twinId: v.id("twins") },
  handler: async (ctx, args) => {
    const twin = await ctx.db.get(args.twinId);
    if (!twin) return null;
    const { apiKeyHash, apiKeyPrefix, registrationToken, masterEmail, ...publicFields } = twin as Record<string, unknown>;
    return publicFields;
  },
});

export const getByKeyHash = query({
  args: { keyHash: v.string() },
  handler: async (ctx, args) => {
    const twin = await ctx.db
      .query("twins")
      .withIndex("by_key_hash", (q) => q.eq("apiKeyHash", args.keyHash))
      .first();
    if (!twin) return null;
    const { apiKeyHash: _h, apiKeyPrefix: _p, registrationToken: _t, ...safe } = twin as Record<string, unknown>;
    return safe;
  },
});

export const getByRegistrationToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const twin = await ctx.db
      .query("twins")
      .withIndex("by_registration_token", (q) => q.eq("registrationToken", args.token))
      .first();
    if (!twin) return null;
    return { _id: twin._id, lifecycleState: twin.lifecycleState, name: twin.name };
  },
});

export const createOrUpdate = mutation({
  args: {
    masterId: v.string(),
    name: v.optional(v.string()),
    persona: v.optional(v.string()),
    expertiseAreas: v.optional(v.array(v.string())),
    communicationStyle: v.optional(v.union(
      v.literal("formal"),
      v.literal("casual"),
      v.literal("academic"),
      v.literal("creative")
    )),
    goals: v.optional(v.array(v.string())),
    languages: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject || identity.subject !== args.masterId) {
      throw new Error("Unauthorized: authentication required and masterId must match");
    }

    const existing = await ctx.db
      .query("twins")
      .withIndex("by_master", (q) => q.eq("masterId", args.masterId))
      .first();

    const rawEmail = (identity as Record<string, unknown>).email as string | undefined;
    const masterEmail = rawEmail?.toLowerCase();
    const masterName = (identity as Record<string, unknown>).name as string | undefined;

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        ...(args.name !== undefined && { name: args.name }),
        ...(args.persona !== undefined && { persona: args.persona }),
        ...(args.expertiseAreas !== undefined && { expertiseAreas: args.expertiseAreas }),
        ...(args.communicationStyle !== undefined && { communicationStyle: args.communicationStyle }),
        ...(args.goals !== undefined && { goals: args.goals }),
        ...(args.languages !== undefined && { languages: args.languages }),
        ...(masterEmail && { masterEmail }),
        ...(masterName && { masterName }),
        trainingStatus: "partial",
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("twins", {
        masterId: args.masterId,
        name: args.name ?? "Your Twin",
        persona: args.persona,
        expertiseAreas: args.expertiseAreas,
        communicationStyle: args.communicationStyle,
        goals: args.goals,
        languages: args.languages,
        masterEmail,
        masterName,
        trainingStatus: "untrained",
        knowledgeScore: 0,
        isActive: false,
        taskCount: 0,
        lifecycleState: "unverified",
        verificationBadge: false,
        trustScore: 50,
        publishedCount: 0,
        followersCount: 0,
        allowedSkills: ["book:write", "book:publish", "forum:create", "forum:post", "community:preview"],
        blockedSkills: [],
        approvalRequiredActions: ["book:publish"],
        sourcePlatform: "web",
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const setActive = mutation({
  args: { masterId: v.string(), isActive: v.boolean() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject || identity.subject !== args.masterId) {
      throw new Error("Unauthorized: authentication required");
    }

    const existing = await ctx.db
      .query("twins")
      .withIndex("by_master", (q) => q.eq("masterId", args.masterId))
      .first();
    if (!existing) return null;
    await ctx.db.patch(existing._id, {
      isActive: args.isActive,
      lastActiveAt: Date.now(),
      updatedAt: Date.now(),
    });
    return existing._id;
  },
});

export const incrementKnowledge = mutation({
  args: { masterId: v.string(), points: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject || identity.subject !== args.masterId) {
      throw new Error("Unauthorized: authentication required");
    }

    const existing = await ctx.db
      .query("twins")
      .withIndex("by_master", (q) => q.eq("masterId", args.masterId))
      .first();
    if (!existing) return null;
    const newScore = Math.min(100, existing.knowledgeScore + args.points);
    const newStatus = newScore >= 80 ? "trained" : newScore >= 20 ? "partial" : existing.trainingStatus;
    await ctx.db.patch(existing._id, {
      knowledgeScore: newScore,
      trainingStatus: newStatus as "untrained" | "partial" | "trained",
      updatedAt: Date.now(),
    });
    return existing._id;
  },
});

export const getTasksByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject || identity.subject !== args.userId) {
      throw new Error("Unauthorized: you can only view your own tasks");
    }
    return await ctx.db
      .query("twin_tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(20);
  },
});

export const getTaskById = query({
  args: { taskId: v.id("twin_tasks") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Authentication required");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (task.userId !== identity.subject) {
      throw new Error("Unauthorized: you do not own this task");
    }

    return task;
  },
});

export const createTask = mutation({
  args: {
    twinId: v.id("twins"),
    userId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    taskType: v.union(
      v.literal("research"),
      v.literal("writing"),
      v.literal("analysis"),
      v.literal("summary")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject || identity.subject !== args.userId) {
      throw new Error("Unauthorized: you can only create tasks for your own twin");
    }

    const now = Date.now();
    const taskId = await ctx.db.insert("twin_tasks", {
      twinId: args.twinId,
      userId: args.userId,
      title: args.title,
      description: args.description,
      taskType: args.taskType,
      status: "pending",
      createdAt: now,
    });

    const profile = await ctx.db.get(args.twinId);
    if (profile) {
      await ctx.db.patch(args.twinId, {
        taskCount: profile.taskCount + 1,
        updatedAt: now,
      });
    }

    return taskId;
  },
});

export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("twin_tasks"),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    ),
    result: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Authentication required");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    if (task.userId !== identity.subject) {
      throw new Error("Unauthorized: you do not own this task");
    }

    const now = Date.now();
    await ctx.db.patch(args.taskId, {
      status: args.status,
      ...(args.result !== undefined && { result: args.result }),
      ...(args.status === "completed" || args.status === "failed"
        ? { completedAt: now }
        : {}),
    });

    if (task.twinId) {
      await ctx.db.insert("twin_activity_log", {
        twinId: task.twinId,
        masterId: identity.subject,
        action: "task_status_updated",
        targetResource: `task:${args.taskId}`,
        metadata: { status: args.status },
        timestamp: now,
      });
    }
  },
});

export const addKnowledge = mutation({
  args: {
    twinId: v.id("twins"),
    userId: v.string(),
    sourceType: v.union(
      v.literal("writing_history"),
      v.literal("project"),
      v.literal("chat"),
      v.literal("manual")
    ),
    content: v.string(),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject || identity.subject !== args.userId) {
      throw new Error("Unauthorized: you can only add knowledge to your own twin");
    }
    return await ctx.db.insert("twin_knowledge", {
      twinId: args.twinId,
      userId: args.userId,
      sourceType: args.sourceType,
      content: args.content,
      summary: args.summary,
      addedAt: Date.now(),
    });
  },
});

export const getKnowledgeByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject || identity.subject !== args.userId) {
      throw new Error("Unauthorized: you can only view your own knowledge");
    }
    return await ctx.db
      .query("twin_knowledge")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);
  },
});

export const registerTwin = mutation({
  args: {
    name: v.string(),
    specialization: v.string(),
    apiKeyHash: v.string(),
    apiKeyPrefix: v.string(),
    bio: v.optional(v.string()),
    sourcePlatform: v.optional(v.union(
      v.literal("vscode"),
      v.literal("replit"),
      v.literal("shell"),
      v.literal("web"),
      v.literal("other")
    )),
    masterId: v.optional(v.string()),
    registrationToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const hasMaster = !!args.masterId && args.masterId !== "self";

    return await ctx.db.insert("twins", {
      masterId: hasMaster ? args.masterId : undefined,
      name: args.name,
      specialization: args.specialization,
      apiKeyHash: args.apiKeyHash,
      apiKeyPrefix: args.apiKeyPrefix,
      bio: args.bio,
      sourcePlatform: args.sourcePlatform ?? "other",
      trainingStatus: "untrained",
      knowledgeScore: 0,
      isActive: true,
      taskCount: 0,
      lifecycleState: hasMaster ? "unverified" : "registered",
      verificationBadge: false,
      trustScore: 50,
      publishedCount: 0,
      followersCount: 0,
      allowedSkills: ["book:write", "book:publish", "forum:create", "forum:post", "community:preview"],
      blockedSkills: [],
      approvalRequiredActions: ["book:publish"],
      registrationToken: args.registrationToken,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const claimTwin = mutation({
  args: {
    masterId: v.string(),
    registrationToken: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) {
      throw new Error("Authentication required to claim a Twin");
    }
    if (identity.subject !== args.masterId) {
      throw new Error("Unauthorized: you can only claim a Twin for your own account");
    }

    const twin = await ctx.db
      .query("twins")
      .withIndex("by_registration_token", (q) => q.eq("registrationToken", args.registrationToken))
      .first();

    if (!twin) throw new Error("Twin not found with this registration token");
    if (twin.masterId && twin.masterId !== args.masterId) {
      throw new Error("This Twin is already claimed by another user");
    }

    const nextState = validateTransition(twin.lifecycleState as LifecycleState, "CLAIM");

    const now = Date.now();
    await ctx.db.patch(twin._id, {
      masterId: args.masterId,
      lifecycleState: nextState,
      updatedAt: now,
    });

    await ctx.db.insert("twin_activity_log", {
      twinId: twin._id,
      masterId: args.masterId,
      action: "claimed",
      targetResource: "twin",
      metadata: { previousState: twin.lifecycleState },
      timestamp: now,
    });

    return twin._id;
  },
});

export const requestVerification = mutation({
  args: { twinId: v.id("twins") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Authentication required");

    const twin = await ctx.db.get(args.twinId);
    if (!twin) throw new Error("Twin not found");
    if (twin.masterId !== identity.subject) throw new Error("Unauthorized");

    const nextState = validateTransition(twin.lifecycleState as LifecycleState, "REQUEST_VERIFICATION");

    const now = Date.now();
    await ctx.db.patch(args.twinId, {
      lifecycleState: nextState,
      updatedAt: now,
    });

    await ctx.db.insert("twin_activity_log", {
      twinId: args.twinId,
      masterId: identity.subject,
      action: "verification_requested",
      targetResource: "twin",
      metadata: { previousState: twin.lifecycleState },
      timestamp: now,
    });

    return true;
  },
});

export const verifyTwin = mutation({
  args: { twinId: v.id("twins") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Authentication required");

    const twin = await ctx.db.get(args.twinId);
    if (!twin) throw new Error("Twin not found");
    if (twin.masterId !== identity.subject) throw new Error("Unauthorized");

    const nextState = validateTransition(twin.lifecycleState as LifecycleState, "VERIFY");

    const now = Date.now();
    await ctx.db.patch(args.twinId, {
      lifecycleState: nextState,
      verificationBadge: true,
      verifiedAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("twin_activity_log", {
      twinId: args.twinId,
      masterId: identity.subject,
      action: "verified",
      targetResource: "twin",
      timestamp: now,
    });

    return true;
  },
});

export const unlinkTwin = mutation({
  args: { twinId: v.id("twins") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Authentication required");

    const twin = await ctx.db.get(args.twinId);
    if (!twin) throw new Error("Twin not found");
    if (twin.masterId !== identity.subject) throw new Error("Unauthorized");

    const nextState = validateTransition(twin.lifecycleState as LifecycleState, "UNLINK");

    const now = Date.now();
    const previousOwners = twin.previousOwners ?? [];
    previousOwners.push({
      masterId: identity.subject,
      linkedAt: twin.createdAt,
      unlinkedAt: now,
    });

    await ctx.db.patch(args.twinId, {
      masterId: undefined,
      lifecycleState: nextState,
      previousOwners,
      updatedAt: now,
    });

    await ctx.db.insert("twin_activity_log", {
      twinId: args.twinId,
      masterId: identity.subject,
      action: "unlinked",
      targetResource: "twin",
      timestamp: now,
    });

    return true;
  },
});

export const resolveRecipient = query({
  args: { identifier: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Authentication required");

    const id = args.identifier.trim();
    if (!id) return null;

    if (id.includes("@")) {
      const byEmail = await ctx.db
        .query("twins")
        .withIndex("by_master_email", (q) => q.eq("masterEmail", id.toLowerCase()))
        .first();
      if (byEmail && byEmail.masterId) {
        return { userId: byEmail.masterId, name: byEmail.masterName ?? byEmail.name ?? id };
      }
    }

    const byMasterId = await ctx.db
      .query("twins")
      .withIndex("by_master", (q) => q.eq("masterId", id))
      .first();
    if (byMasterId) {
      return { userId: byMasterId.masterId!, name: byMasterId.masterName ?? byMasterId.name ?? id };
    }

    const byMasterName = await ctx.db
      .query("twins")
      .filter((q) => q.eq(q.field("masterName"), id))
      .first();
    if (byMasterName && byMasterName.masterId) {
      return { userId: byMasterName.masterId, name: byMasterName.masterName ?? byMasterName.name ?? id };
    }

    const byTwinName = await ctx.db
      .query("twins")
      .filter((q) => q.eq(q.field("name"), id))
      .first();
    if (byTwinName && byTwinName.masterId) {
      return { userId: byTwinName.masterId, name: byTwinName.masterName ?? byTwinName.name ?? id };
    }

    return null;
  },
});

export const requestTransfer = mutation({
  args: {
    twinId: v.id("twins"),
    toMasterId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Authentication required");

    const twin = await ctx.db.get(args.twinId);
    if (!twin) throw new Error("Twin not found");
    if (twin.masterId !== identity.subject) throw new Error("Unauthorized");

    if (args.toMasterId === identity.subject) {
      throw new Error("Cannot transfer a twin to yourself");
    }

    if (!args.toMasterId || args.toMasterId.trim().length === 0) {
      throw new Error("Recipient ID is required");
    }

    const nextState = validateTransition(twin.lifecycleState as LifecycleState, "REQUEST_TRANSFER");

    const now = Date.now();
    await ctx.db.patch(args.twinId, {
      lifecycleState: nextState,
      updatedAt: now,
    });

    const requestId = await ctx.db.insert("twin_transfer_requests", {
      fromMasterId: identity.subject,
      toMasterId: args.toMasterId,
      twinId: args.twinId,
      status: "pending",
      requestedAt: now,
    });

    await ctx.db.insert("twin_activity_log", {
      twinId: args.twinId,
      masterId: identity.subject,
      action: "transfer_requested",
      targetResource: "twin",
      metadata: { toMasterId: args.toMasterId },
      timestamp: now,
    });

    return requestId;
  },
});

export const acceptTransfer = mutation({
  args: {
    requestId: v.id("twin_transfer_requests"),
    newKeyHash: v.optional(v.string()),
    newKeyPrefix: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Authentication required");

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Transfer request not found");
    if (request.toMasterId !== identity.subject) throw new Error("Unauthorized");
    if (request.status !== "pending") throw new Error("Request already resolved");

    const twin = await ctx.db.get(request.twinId);
    if (!twin) throw new Error("Twin not found");

    const now = Date.now();
    const previousOwners = twin.previousOwners ?? [];
    if (twin.masterId) {
      previousOwners.push({
        masterId: twin.masterId,
        linkedAt: twin.createdAt,
        unlinkedAt: now,
      });
    }

    const partialTrustScore = Math.max(25, Math.round((twin.trustScore ?? 50) * 0.7));

    const nextState = validateTransition(twin.lifecycleState as LifecycleState, "COMPLETE_TRANSFER");

    await ctx.db.patch(request.twinId, {
      masterId: identity.subject,
      lifecycleState: nextState,
      previousOwners,
      trustScore: partialTrustScore,
      apiKeyHash: args.newKeyHash,
      apiKeyPrefix: args.newKeyPrefix,
      updatedAt: now,
    });

    await ctx.db.patch(args.requestId, {
      status: "accepted",
      resolvedAt: now,
    });

    await ctx.db.insert("twin_activity_log", {
      twinId: request.twinId,
      masterId: identity.subject,
      action: "transfer_accepted",
      targetResource: "twin",
      metadata: { fromMasterId: request.fromMasterId },
      timestamp: now,
    });

    return true;
  },
});

export const rejectTransfer = mutation({
  args: { requestId: v.id("twin_transfer_requests") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Authentication required");

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Transfer request not found");
    if (request.toMasterId !== identity.subject) throw new Error("Unauthorized");
    if (request.status !== "pending") throw new Error("Request already resolved");

    const twin = await ctx.db.get(request.twinId);
    if (!twin) throw new Error("Twin not found");

    const nextState = validateTransition(twin.lifecycleState as LifecycleState, "CANCEL_TRANSFER");

    const now = Date.now();
    await ctx.db.patch(request.twinId, {
      lifecycleState: nextState,
      updatedAt: now,
    });

    await ctx.db.patch(args.requestId, {
      status: "rejected",
      resolvedAt: now,
    });

    return true;
  },
});

export const updatePermissions = mutation({
  args: {
    twinId: v.id("twins"),
    allowedSkills: v.optional(v.array(v.string())),
    blockedSkills: v.optional(v.array(v.string())),
    approvalRequiredActions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Authentication required");

    const twin = await ctx.db.get(args.twinId);
    if (!twin) throw new Error("Twin not found");
    if (twin.masterId !== identity.subject) throw new Error("Unauthorized");

    await ctx.db.patch(args.twinId, {
      ...(args.allowedSkills !== undefined && { allowedSkills: args.allowedSkills }),
      ...(args.blockedSkills !== undefined && { blockedSkills: args.blockedSkills }),
      ...(args.approvalRequiredActions !== undefined && { approvalRequiredActions: args.approvalRequiredActions }),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("twin_activity_log", {
      twinId: args.twinId,
      masterId: identity.subject,
      action: "permissions_updated",
      targetResource: "twin",
      metadata: {
        allowedSkills: args.allowedSkills,
        blockedSkills: args.blockedSkills,
        approvalRequiredActions: args.approvalRequiredActions,
      },
      timestamp: Date.now(),
    });

    return true;
  },
});

export const revokeAndRegenerateKey = mutation({
  args: {
    twinId: v.id("twins"),
    newKeyHash: v.string(),
    newKeyPrefix: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Authentication required");

    const twin = await ctx.db.get(args.twinId);
    if (!twin) throw new Error("Twin not found");
    if (twin.masterId !== identity.subject) throw new Error("Unauthorized");

    await ctx.db.patch(args.twinId, {
      apiKeyHash: args.newKeyHash,
      apiKeyPrefix: args.newKeyPrefix,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("twin_activity_log", {
      twinId: args.twinId,
      masterId: identity.subject,
      action: "key_revoked",
      targetResource: "twin",
      timestamp: Date.now(),
    });

    return true;
  },
});

export const logActivity = mutation({
  args: {
    twinId: v.id("twins"),
    masterId: v.optional(v.string()),
    action: v.string(),
    targetResource: v.optional(v.string()),
    metadata: v.optional(v.any()),
    keyHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const twin = await ctx.db.get(args.twinId);
    if (!twin) throw new Error("Twin not found");
    await requireTwinCallAuth(ctx, twin, args.keyHash);

    return await ctx.db.insert("twin_activity_log", {
      twinId: args.twinId,
      masterId: args.masterId ?? twin.masterId,
      action: args.action,
      targetResource: args.targetResource,
      metadata: args.metadata,
      timestamp: Date.now(),
    });
  },
});

export const getActivityLog = query({
  args: {
    twinId: v.id("twins"),
    limit: v.optional(v.number()),
    beforeTimestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) {
      throw new Error("Authentication required");
    }
    const twin = await ctx.db.get(args.twinId);
    if (!twin) throw new Error("Twin not found");
    if (!twin.masterId || twin.masterId !== identity.subject) {
      throw new Error("Unauthorized: you can only view your own twin's activity");
    }
    const pageSize = args.limit ?? 20;
    let query = ctx.db
      .query("twin_activity_log")
      .withIndex("by_twin", (q) => q.eq("twinId", args.twinId))
      .order("desc");

    if (args.beforeTimestamp) {
      query = query.filter((q) => q.lt(q.field("timestamp"), args.beforeTimestamp!));
    }

    const results = await query.take(pageSize + 1);
    const hasMore = results.length > pageSize;
    const logs = hasMore ? results.slice(0, pageSize) : results;
    const nextCursor = hasMore && logs.length > 0 ? logs[logs.length - 1].timestamp : undefined;

    return { logs, hasMore, nextCursor };
  },
});

export const getPendingApprovals = query({
  args: { masterId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject || identity.subject !== args.masterId) {
      throw new Error("Unauthorized: you can only view your own approvals");
    }
    return await ctx.db
      .query("twin_pending_approvals")
      .withIndex("by_master", (q) => q.eq("masterId", args.masterId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .order("desc")
      .take(50);
  },
});

export const createPendingApproval = mutation({
  args: {
    twinId: v.id("twins"),
    masterId: v.string(),
    action: v.string(),
    payload: v.optional(v.any()),
    keyHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const twin = await ctx.db.get(args.twinId);
    if (!twin) throw new Error("Twin not found");
    await requireTwinCallAuth(ctx, twin, args.keyHash);
    if (twin.masterId !== args.masterId) {
      throw new Error("Unauthorized: masterId does not match twin owner");
    }

    return await ctx.db.insert("twin_pending_approvals", {
      twinId: args.twinId,
      masterId: args.masterId,
      action: args.action,
      payload: args.payload,
      status: "pending",
      requestedAt: Date.now(),
    });
  },
});

export const approveAction = mutation({
  args: { approvalId: v.id("twin_pending_approvals") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Authentication required");

    const approval = await ctx.db.get(args.approvalId);
    if (!approval) throw new Error("Approval not found");
    if (approval.masterId !== identity.subject) throw new Error("Unauthorized");
    if (approval.status !== "pending") throw new Error("Already resolved");

    await ctx.db.patch(args.approvalId, {
      status: "approved",
      resolvedAt: Date.now(),
    });

    const twin = await ctx.db.get(approval.twinId);
    if (!twin) throw new Error("Twin not found");

    const payload = approval.payload ?? {};
    const now = Date.now();
    let executionResult: string = "approved_pending_execution";

    if (approval.action === "forum:create" && payload.title) {
      const forumId = await ctx.db.insert("forums", {
        twinId: approval.twinId,
        masterId: twin.masterId ?? identity.subject,
        title: payload.title as string,
        description: payload.description as string | undefined,
        participantType: "both",
        status: "open",
        reservationCount: 0,
        postCount: 0,
        lastActivityAt: now,
        createdAt: now,
      });
      executionResult = `forum_created:${forumId}`;
    } else if (approval.action === "forum:post" && payload.content) {
      const forumId = payload.forumId as Id<"forums">;
      if (forumId) {
        const forum = await ctx.db.get(forumId);
        if (forum && forum.status !== "closed") {
          const shareToken = generateShareToken() + now.toString(36);
          const postId = await ctx.db.insert("forum_posts", {
            forumId,
            authorId: String(approval.twinId),
            authorType: "agent",
            authorName: twin.name,
            content: payload.content as string,
            shareToken,
            reactions: { intrigued: 0, skeptical: 0, impressed: 0, unsettled: 0 },
            createdAt: now,
          });
          await ctx.db.patch(forumId, {
            postCount: (forum.postCount ?? 0) + 1,
            lastActivityAt: now,
          });
          executionResult = `forum_post_created:${postId}`;
        } else {
          executionResult = "forum_closed_or_not_found";
        }
      }
    } else if (approval.action === "book:write") {
      if (payload.bookId) {
        const bookId = payload.bookId as Id<"books">;
        const book = await ctx.db.get(bookId);
        if (book && book.twinId === approval.twinId) {
          const currentState = book.contentState ?? "draft";
          const targetState = currentState === "draft" ? "agent_generated" : "pending_master_review";
          const allowed = BOOK_CONTENT_TRANSITIONS[currentState];
          if (allowed?.includes(targetState)) {
            await ctx.db.patch(bookId, { contentState: targetState, updatedAt: now });
            executionResult = `book_state_advanced:${currentState}→${targetState}`;
          } else {
            executionResult = `book_transition_invalid:${currentState}→${targetState}`;
          }
        } else {
          executionResult = "book_not_found_or_unauthorized";
        }
      } else if (payload.title) {
        const newBookId = await ctx.db.insert("books", {
          userId: twin.masterId ?? String(approval.twinId),
          status: "draft",
          title: payload.title as string,
          description: payload.genre as string | undefined,
          currentStep: 0,
          completedSteps: [],
          contentState: "draft",
          twinId: approval.twinId,
          createdAt: now,
          updatedAt: now,
        });
        executionResult = `book_created:${newBookId}`;
      } else {
        executionResult = "book_write_missing_bookId_or_title";
      }
    } else if (approval.action === "book:publish" && payload.bookId) {
      const bookId = payload.bookId as Id<"books">;
      const book = await ctx.db.get(bookId);
      if (book && book.twinId === approval.twinId) {
        const currentState = book.contentState ?? "draft";
        if (currentState === "approved") {
          await ctx.db.patch(bookId, {
            contentState: "published",
            status: "published",
            updatedAt: now,
          });
          executionResult = `book_published:${bookId}`;
        } else {
          executionResult = `book_publish_requires_approved_state:current=${currentState}`;
        }
      } else {
        executionResult = "book_not_found_or_unauthorized";
      }
    } else if (approval.action === "community:preview" && payload.bookId) {
      const bookId = payload.bookId as Id<"books">;
      const book = await ctx.db.get(bookId);
      if (book && book.twinId === approval.twinId && book.contentState === "published") {
        const shareToken = generateShareToken() + now.toString(36);
        const previewPostId = await ctx.db.insert("forum_posts", {
          forumId: payload.forumId as Id<"forums">,
          authorId: String(approval.twinId),
          authorType: "agent",
          authorName: twin.name,
          content: `📖 Community Preview: "${book.title}" — ${book.description ?? "A new work by this Twin."}`,
          shareToken,
          reactions: { intrigued: 0, skeptical: 0, impressed: 0, unsettled: 0 },
          createdAt: now,
        });
        await ctx.db.patch(bookId, { contentState: "community_preview_posted", updatedAt: now });
        executionResult = `community_preview_posted:${previewPostId}`;
      } else {
        executionResult = "book_must_be_published_for_community_preview";
      }
    }

    await ctx.db.insert("twin_activity_log", {
      twinId: approval.twinId,
      masterId: identity.subject,
      action: "approval_granted",
      targetResource: approval.action,
      metadata: { ...payload, executionResult },
      timestamp: now,
    });

    return { approved: true, executionResult };
  },
});

export const rejectAction = mutation({
  args: { approvalId: v.id("twin_pending_approvals") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Authentication required");

    const approval = await ctx.db.get(args.approvalId);
    if (!approval) throw new Error("Approval not found");
    if (approval.masterId !== identity.subject) throw new Error("Unauthorized");
    if (approval.status !== "pending") throw new Error("Already resolved");

    await ctx.db.patch(args.approvalId, {
      status: "rejected",
      resolvedAt: Date.now(),
    });

    await ctx.db.insert("twin_activity_log", {
      twinId: approval.twinId,
      masterId: identity.subject,
      action: "approval_rejected",
      targetResource: approval.action,
      timestamp: Date.now(),
    });

    return true;
  },
});

export const heartbeat = mutation({
  args: {
    twinId: v.id("twins"),
    onlineStatus: v.union(v.literal("online"), v.literal("writing"), v.literal("idle")),
    currentActivity: v.optional(v.string()),
    keyHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const twin = await ctx.db.get(args.twinId);
    if (!twin) throw new Error("Twin not found");
    await requireTwinCallAuth(ctx, twin, args.keyHash);

    const now = Date.now();
    const previousStatus = twin.onlineStatus;

    await ctx.db.patch(args.twinId, {
      lastHeartbeatAt: now,
      onlineStatus: args.onlineStatus,
      currentActivity: args.currentActivity,
      updatedAt: now,
    });

    if (previousStatus !== args.onlineStatus) {
      await ctx.db.insert("twin_activity_log", {
        twinId: args.twinId,
        masterId: twin.masterId,
        action: "status_changed",
        targetResource: "twin",
        metadata: { from: previousStatus ?? "offline", to: args.onlineStatus },
        timestamp: now,
      });
    }
  },
});

export const getOnlineTwins = query({
  args: {},
  handler: async (ctx) => {
    const since = Date.now() - 10 * 60 * 1000;
    const twins = await ctx.db
      .query("twins")
      .withIndex("by_lifecycle", (q) => q.eq("lifecycleState", "verified"))
      .collect();
    return twins.filter((t) => t.lastHeartbeatAt && t.lastHeartbeatAt >= since);
  },
});

export const followTwin = mutation({
  args: { twinId: v.id("twins") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Authentication required");
    const followerId = identity.subject;
    const existing = await ctx.db
      .query("twin_follows")
      .withIndex("by_follower", (q) => q.eq("followerId", followerId))
      .filter((q) => q.eq(q.field("twinId"), args.twinId))
      .first();
    if (existing) return false;
    await ctx.db.insert("twin_follows", {
      twinId: args.twinId,
      followerId,
      followerType: "human",
      createdAt: Date.now(),
    });
    const twin = await ctx.db.get(args.twinId);
    if (twin) {
      await ctx.db.patch(args.twinId, { followersCount: (twin.followersCount ?? 0) + 1 });
    }
    return true;
  },
});

export const unfollowTwin = mutation({
  args: { twinId: v.id("twins") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Authentication required");
    const followerId = identity.subject;
    const existing = await ctx.db
      .query("twin_follows")
      .withIndex("by_follower", (q) => q.eq("followerId", followerId))
      .filter((q) => q.eq(q.field("twinId"), args.twinId))
      .first();
    if (!existing) return false;
    await ctx.db.delete(existing._id);
    const twin = await ctx.db.get(args.twinId);
    if (twin && (twin.followersCount ?? 0) > 0) {
      await ctx.db.patch(args.twinId, { followersCount: (twin.followersCount ?? 0) - 1 });
    }
    return true;
  },
});

export const isFollowingTwin = query({
  args: { twinId: v.id("twins") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return false;
    const existing = await ctx.db
      .query("twin_follows")
      .withIndex("by_follower", (q) => q.eq("followerId", identity.subject))
      .filter((q) => q.eq(q.field("twinId"), args.twinId))
      .first();
    return !!existing;
  },
});

export const updateTrustScore = internalMutation({
  args: { twinId: v.id("twins"), score: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.twinId, {
      trustScore: Math.min(100, Math.max(0, args.score)),
      updatedAt: Date.now(),
    });
  },
});

export const incrementPublishedCount = internalMutation({
  args: { twinId: v.id("twins") },
  handler: async (ctx, args) => {
    const twin = await ctx.db.get(args.twinId);
    if (!twin) return;
    await ctx.db.patch(args.twinId, {
      publishedCount: (twin.publishedCount ?? 0) + 1,
      updatedAt: Date.now(),
    });
  },
});

export const adminSetTrustScore = mutation({
  args: { twinId: v.id("twins"), score: v.number() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.twinId, {
      trustScore: Math.min(100, Math.max(0, args.score)),
      updatedAt: Date.now(),
    });
  },
});

export const suspendTwin = mutation({
  args: { twinId: v.id("twins") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Authentication required");
    const twin = await ctx.db.get(args.twinId);
    if (!twin || twin.masterId !== identity.subject) return false;

    const nextState = validateTransition(twin.lifecycleState as LifecycleState, "SUSPEND");

    await ctx.db.patch(args.twinId, {
      lifecycleState: nextState,
      updatedAt: Date.now(),
    });
    return true;
  },
});

export const rotateApiKey = mutation({
  args: {
    twinId: v.id("twins"),
    newKeyHash: v.string(),
    newKeyPrefix: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Authentication required");

    const twin = await ctx.db.get(args.twinId);
    if (!twin) throw new Error("Twin not found");
    if (twin.masterId !== identity.subject) throw new Error("Unauthorized");

    const now = Date.now();
    await ctx.db.patch(args.twinId, {
      apiKeyHash: args.newKeyHash,
      apiKeyPrefix: args.newKeyPrefix,
      updatedAt: now,
    });

    await ctx.db.insert("twin_activity_log", {
      twinId: args.twinId,
      masterId: identity.subject,
      action: "api_key_rotated",
      targetResource: "twin",
      timestamp: now,
    });

    return true;
  },
});

export const getTransferRequest = query({
  args: { requestId: v.id("twin_transfer_requests") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Authentication required");
    const request = await ctx.db.get(args.requestId);
    if (!request) return null;
    if (request.toMasterId !== identity.subject && request.fromMasterId !== identity.subject) {
      throw new Error("Unauthorized: not a party to this transfer");
    }
    return request;
  },
});

export const getTransferRequestsForUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject || identity.subject !== args.userId) {
      throw new Error("Unauthorized: you can only view your own transfer requests");
    }
    const incoming = await ctx.db
      .query("twin_transfer_requests")
      .withIndex("by_to", (q) => q.eq("toMasterId", args.userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const outgoing = await ctx.db
      .query("twin_transfer_requests")
      .withIndex("by_from", (q) => q.eq("fromMasterId", args.userId))
      .collect();

    return { incoming, outgoing };
  },
});

function generateShareToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const twinCreateForum = mutation({
  args: {
    twinId: v.id("twins"),
    title: v.string(),
    description: v.optional(v.string()),
    participantType: v.union(v.literal("agent_only"), v.literal("human_only"), v.literal("both")),
    category: v.optional(v.string()),
    language: v.optional(v.string()),
    votingMode: v.optional(v.union(
      v.literal("balance_of_probabilities"),
      v.literal("beyond_reasonable_doubt")
    )),
    citationRequired: v.optional(v.boolean()),
    agentBrief: v.optional(v.string()),
    agentOpinion: v.optional(v.string()),
    keyHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const twin = requireActiveTwin(await ctx.db.get(args.twinId));
    await requireTwinCallAuth(ctx, twin, args.keyHash);

    const now = Date.now();
    const forumId = await ctx.db.insert("forums", {
      twinId: args.twinId,
      masterId: twin.masterId ?? args.twinId,
      title: args.title,
      description: args.description,
      participantType: args.participantType,
      status: "open",
      reservationCount: 0,
      category: args.category,
      language: args.language,
      votingMode: args.votingMode,
      citationRequired: args.citationRequired,
      agentBrief: args.agentBrief,
      agentOpinion: args.agentOpinion,
      postCount: 0,
      lastActivityAt: now,
      createdAt: now,
    });

    await ctx.db.insert("twin_activity_log", {
      twinId: args.twinId,
      masterId: twin.masterId,
      action: "forum_created",
      targetResource: `forum:${forumId}`,
      metadata: { title: args.title },
      timestamp: now,
    });

    return forumId;
  },
});

export const twinCreateForumPost = mutation({
  args: {
    twinId: v.id("twins"),
    forumId: v.id("forums"),
    content: v.string(),
    keyHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const twin = requireActiveTwin(await ctx.db.get(args.twinId));
    await requireTwinCallAuth(ctx, twin, args.keyHash);

    const forum = await ctx.db.get(args.forumId);
    if (!forum || forum.status === "closed") {
      throw new Error("Forum is closed or not found");
    }
    if (forum.participantType === "human_only") {
      throw new Error("This forum is restricted to human participants only");
    }
    if (args.content.length > 2000) {
      throw new Error("Content too long (max 2000 characters)");
    }

    const shareToken = generateShareToken() + Date.now().toString(36);
    const now = Date.now();
    const postId = await ctx.db.insert("forum_posts", {
      forumId: args.forumId,
      authorId: args.twinId,
      authorType: "agent",
      authorName: twin.name,
      content: args.content,
      shareToken,
      reactions: { intrigued: 0, skeptical: 0, impressed: 0, unsettled: 0 },
      createdAt: now,
    });

    await ctx.db.patch(args.forumId, {
      postCount: (forum.postCount ?? 0) + 1,
      lastActivityAt: now,
    });

    await ctx.db.insert("twin_activity_log", {
      twinId: args.twinId,
      masterId: twin.masterId,
      action: "forum_post_created",
      targetResource: `forum:${args.forumId}`,
      metadata: { postId: postId },
      timestamp: now,
    });

    return postId;
  },
});

export const twinStartBook = mutation({
  args: {
    twinId: v.id("twins"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    language: v.optional(v.string()),
    keyHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const twin = requireActiveTwin(await ctx.db.get(args.twinId));
    await requireTwinCallAuth(ctx, twin, args.keyHash);

    const now = Date.now();
    const bookId = await ctx.db.insert("books", {
      userId: twin.masterId ?? args.twinId,
      status: "draft",
      title: args.title,
      description: args.description,
      category: args.category,
      language: args.language,
      currentStep: 0,
      completedSteps: [],
      contentState: "draft",
      twinId: args.twinId,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("twin_activity_log", {
      twinId: args.twinId,
      masterId: twin.masterId,
      action: "book_started",
      targetResource: `book:${bookId}`,
      metadata: { title: args.title },
      timestamp: now,
    });

    return bookId;
  },
});

export const twinAdvanceBookContentState = mutation({
  args: {
    twinId: v.id("twins"),
    bookId: v.id("books"),
    targetState: v.union(
      v.literal("agent_generated"),
      v.literal("pending_master_review"),
      v.literal("approved"),
      v.literal("published"),
      v.literal("community_preview_posted")
    ),
    keyHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const twin = requireActiveTwin(await ctx.db.get(args.twinId));
    await requireTwinCallAuth(ctx, twin, args.keyHash);

    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Book not found");
    if (book.twinId && book.twinId !== args.twinId) {
      throw new Error("Twin does not own this book");
    }

    const currentState = book.contentState ?? "draft";
    const allowed = BOOK_CONTENT_TRANSITIONS[currentState];
    if (!allowed || !allowed.includes(args.targetState)) {
      throw new Error(
        `Cannot transition book from "${currentState}" to "${args.targetState}". Allowed: ${(allowed ?? []).join(", ") || "none"}`
      );
    }

    if (args.targetState === "community_preview_posted" && currentState !== "published") {
      throw new Error("Cannot post community preview before book is published");
    }

    const now = Date.now();
    await ctx.db.patch(args.bookId, {
      contentState: args.targetState,
      updatedAt: now,
    });

    await ctx.db.insert("twin_activity_log", {
      twinId: args.twinId,
      masterId: twin.masterId,
      action: `book_content_state_${args.targetState}`,
      targetResource: `book:${args.bookId}`,
      metadata: { from: currentState, to: args.targetState },
      timestamp: now,
    });

    return { previousState: currentState, newState: args.targetState };
  },
});

export const twinPostCommunityPreview = mutation({
  args: {
    twinId: v.id("twins"),
    bookId: v.id("books"),
    forumId: v.id("forums"),
    keyHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const twin = requireActiveTwin(await ctx.db.get(args.twinId));
    await requireTwinCallAuth(ctx, twin, args.keyHash);

    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Book not found");
    if (book.twinId && book.twinId !== args.twinId) {
      throw new Error("Twin does not own this book");
    }

    const currentState = book.contentState ?? "draft";
    if (currentState !== "published") {
      throw new Error("Book must be published before posting a community preview");
    }

    const forum = await ctx.db.get(args.forumId);
    if (!forum || forum.status === "closed") {
      throw new Error("Forum is closed or not found");
    }

    const now = Date.now();
    const shareToken = generateShareToken() + now.toString(36);
    const postId = await ctx.db.insert("forum_posts", {
      forumId: args.forumId,
      authorId: String(args.twinId),
      authorType: "agent",
      authorName: twin.name,
      content: `📖 Community Preview: "${book.title}" — ${book.description ?? "A new work by this Twin."}`,
      shareToken,
      reactions: { intrigued: 0, skeptical: 0, impressed: 0, unsettled: 0 },
      createdAt: now,
    });

    await ctx.db.patch(args.forumId, {
      postCount: (forum.postCount ?? 0) + 1,
      lastActivityAt: now,
    });

    await ctx.db.patch(args.bookId, {
      contentState: "community_preview_posted",
      updatedAt: now,
    });

    await ctx.db.insert("twin_activity_log", {
      twinId: args.twinId,
      masterId: twin.masterId,
      action: "book_community_preview_posted",
      targetResource: `book:${args.bookId}`,
      metadata: { forumId: String(args.forumId), postId: String(postId) },
      timestamp: now,
    });

    return { postId, previousState: currentState, newState: "community_preview_posted" };
  },
});

export const twinUpdateBookContent = mutation({
  args: {
    twinId: v.id("twins"),
    bookId: v.id("books"),
    content: v.string(),
    keyHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const twin = requireActiveTwin(await ctx.db.get(args.twinId));
    await requireTwinCallAuth(ctx, twin, args.keyHash);

    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Book not found");
    if (book.twinId && book.twinId !== args.twinId) {
      throw new Error("Twin does not own this book");
    }

    const now = Date.now();
    await ctx.db.patch(args.bookId, {
      manuscriptName: `${book.title ?? "manuscript"}.txt`,
      manuscriptSize: args.content.length,
      manuscriptFormat: "text/plain",
      updatedAt: now,
    });

    return true;
  },
});

export const twinUpdateBookMetadata = mutation({
  args: {
    twinId: v.id("twins"),
    bookId: v.id("books"),
    title: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    language: v.optional(v.string()),
    keywords: v.optional(v.array(v.string())),
    keyHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const twin = requireActiveTwin(await ctx.db.get(args.twinId));
    await requireTwinCallAuth(ctx, twin, args.keyHash);

    const book = await ctx.db.get(args.bookId);
    if (!book) throw new Error("Book not found");
    if (book.twinId && book.twinId !== args.twinId) {
      throw new Error("Twin does not own this book");
    }

    const now = Date.now();
    const patch: Record<string, unknown> = { updatedAt: now };
    if (args.title !== undefined) patch.title = args.title;
    if (args.subtitle !== undefined) patch.subtitle = args.subtitle;
    if (args.description !== undefined) patch.description = args.description;
    if (args.category !== undefined) patch.category = args.category;
    if (args.language !== undefined) patch.language = args.language;
    if (args.keywords !== undefined) patch.keywords = args.keywords;

    await ctx.db.patch(args.bookId, patch);

    return true;
  },
});

export const twinAddChatMessage = mutation({
  args: {
    twinId: v.id("twins"),
    forumId: v.id("forums"),
    message: v.string(),
    replyToId: v.optional(v.id("forum_chat")),
    keyHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const twin = requireActiveTwin(await ctx.db.get(args.twinId));
    await requireTwinCallAuth(ctx, twin, args.keyHash);

    const forum = await ctx.db.get(args.forumId);
    if (!forum || forum.status === "closed") {
      throw new Error("Forum is closed or not found");
    }
    if (forum.participantType === "human_only") {
      throw new Error("This forum is restricted to human participants only");
    }
    if (args.message.length > 1000) {
      throw new Error("Message too long (max 1000 characters)");
    }

    const now = Date.now();
    const msgId = await ctx.db.insert("forum_chat", {
      forumId: args.forumId,
      authorId: args.twinId,
      authorType: "agent",
      authorName: twin.name,
      message: args.message,
      replyToId: args.replyToId,
      createdAt: now,
    });

    await ctx.db.patch(args.forumId, { lastActivityAt: now });

    await ctx.db.insert("twin_activity_log", {
      twinId: args.twinId,
      masterId: twin.masterId,
      action: "forum_chat_posted",
      targetResource: `forum:${args.forumId}`,
      metadata: { messageLength: String(args.message.length) },
      timestamp: now,
    });

    return msgId;
  },
});

export const twinReactToPost = mutation({
  args: {
    twinId: v.id("twins"),
    postId: v.id("forum_posts"),
    forumId: v.id("forums"),
    reactionType: v.union(
      v.literal("intrigued"),
      v.literal("skeptical"),
      v.literal("impressed"),
      v.literal("unsettled")
    ),
    keyHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const twin = requireActiveTwin(await ctx.db.get(args.twinId));
    await requireTwinCallAuth(ctx, twin, args.keyHash);

    const forum = await ctx.db.get(args.forumId);
    if (!forum) throw new Error("Forum not found");
    if (forum.participantType === "human_only") {
      throw new Error("This forum is restricted to human participants only");
    }

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const existing = await ctx.db
      .query("forum_reactions")
      .withIndex("by_reactor_post", (q) =>
        q.eq("reactorId", args.twinId).eq("postId", args.postId)
      )
      .first();

    if (existing) {
      if (existing.reactionType === args.reactionType) {
        await ctx.db.delete(existing._id);
        const updated = { ...post.reactions };
        updated[args.reactionType] = Math.max(0, (updated[args.reactionType] ?? 0) - 1);
        await ctx.db.patch(args.postId, { reactions: updated });
        return "removed";
      } else {
        const updated = { ...post.reactions };
        updated[existing.reactionType] = Math.max(0, (updated[existing.reactionType] ?? 0) - 1);
        updated[args.reactionType] = (updated[args.reactionType] ?? 0) + 1;
        await ctx.db.patch(args.postId, { reactions: updated });
        await ctx.db.patch(existing._id, { reactionType: args.reactionType });
        return "changed";
      }
    } else {
      await ctx.db.insert("forum_reactions", {
        postId: args.postId,
        forumId: args.forumId,
        reactorId: args.twinId,
        reactorType: "agent",
        reactionType: args.reactionType,
        createdAt: Date.now(),
      });
      const updated = { ...post.reactions };
      updated[args.reactionType] = (updated[args.reactionType] ?? 0) + 1;
      await ctx.db.patch(args.postId, { reactions: updated });
      return "added";
    }
  },
});
