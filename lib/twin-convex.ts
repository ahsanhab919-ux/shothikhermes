import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { FunctionReference } from "convex/server";
import type { Id } from "@/convex/_generated/dataModel";

export interface TwinRecord {
  _id: Id<"twins">;
  masterId?: string;
  name: string;
  specialization?: string;
  persona?: string;
  expertiseAreas?: string[];
  communicationStyle?: string;
  goals?: string[];
  languages?: string[];
  bio?: string;
  sourcePlatform: string;
  trainingStatus: string;
  knowledgeScore: number;
  isActive: boolean;
  taskCount: number;
  lifecycleState: string;
  verificationBadge: boolean;
  trustScore: number;
  publishedCount: number;
  followersCount: number;
  allowedSkills: string[];
  blockedSkills: string[];
  approvalRequiredActions: string[];
  apiKeyHash?: string;
  apiKeyPrefix?: string;
  registrationToken?: string;
  previousOwners?: Array<{
    masterId: string;
    linkedAt: number;
    unlinkedAt: number;
  }>;
  verifiedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface TwinTask {
  _id: Id<"twin_tasks">;
  twinId: Id<"twins">;
  userId: string;
  title: string;
  description?: string;
  taskType: string;
  status: string;
  result?: string;
  completedAt?: number;
  createdAt: number;
}

export interface TwinActivityLogEntry {
  _id: Id<"twin_activity_log">;
  twinId: Id<"twins">;
  masterId?: string;
  action: string;
  targetResource: string;
  metadata?: Record<string, string>;
  timestamp: number;
}

export interface TwinTransferRequest {
  _id: Id<"twin_transfer_requests">;
  twinId: Id<"twins">;
  fromMasterId: string;
  toMasterId: string;
  status: string;
  requestedAt: number;
  resolvedAt?: number;
}

export interface TwinApproval {
  _id: Id<"twin_pending_approvals">;
  twinId: Id<"twins">;
  masterId: string;
  action: string;
  payload?: unknown;
  status: string;
  requestedAt: number;
  resolvedAt?: number;
}

const twinApi = api as typeof api & {
  forums: {
    getOpenForums: FunctionReference<"query", "public">;
  };
  twin: {
    getByMaster: FunctionReference<"query", "public">;
    getAllByMaster: FunctionReference<"query", "public">;
    getById: FunctionReference<"query", "public">;
    getPublicById: FunctionReference<"query", "public">;
    getByKeyHash: FunctionReference<"query", "public">;
    getByRegistrationToken: FunctionReference<"query", "public">;
    getOnlineTwins: FunctionReference<"query", "public">;
    getActivityLog: FunctionReference<"query", "public">;
    getTasksByUser: FunctionReference<"query", "public">;
    getTaskById: FunctionReference<"query", "public">;
    getKnowledgeByUser: FunctionReference<"query", "public">;
    getPendingApprovals: FunctionReference<"query", "public">;
    getTransferRequest: FunctionReference<"query", "public">;
    getTransferRequestsForUser: FunctionReference<"query", "public">;
    resolveRecipient: FunctionReference<"query", "public">;
    createOrUpdate: FunctionReference<"mutation", "public">;
    setActive: FunctionReference<"mutation", "public">;
    createTask: FunctionReference<"mutation", "public">;
    updateTaskStatus: FunctionReference<"mutation", "public">;
    addKnowledge: FunctionReference<"mutation", "public">;
    incrementKnowledge: FunctionReference<"mutation", "public">;
    registerTwin: FunctionReference<"mutation", "public">;
    claimTwin: FunctionReference<"mutation", "public">;
    requestVerification: FunctionReference<"mutation", "public">;
    verifyTwin: FunctionReference<"mutation", "public">;
    unlinkTwin: FunctionReference<"mutation", "public">;
    suspendTwin: FunctionReference<"mutation", "public">;
    requestTransfer: FunctionReference<"mutation", "public">;
    acceptTransfer: FunctionReference<"mutation", "public">;
    rejectTransfer: FunctionReference<"mutation", "public">;
    updatePermissions: FunctionReference<"mutation", "public">;
    approveAction: FunctionReference<"mutation", "public">;
    rejectAction: FunctionReference<"mutation", "public">;
    createPendingApproval: FunctionReference<"mutation", "public">;
    logActivity: FunctionReference<"mutation", "public">;
    heartbeat: FunctionReference<"mutation", "public">;
    rotateApiKey: FunctionReference<"mutation", "public">;
    revokeAndRegenerateKey: FunctionReference<"mutation", "public">;
    twinCreateForum: FunctionReference<"mutation", "public">;
    twinCreateForumPost: FunctionReference<"mutation", "public">;
    twinStartBook: FunctionReference<"mutation", "public">;
    twinAdvanceBookContentState: FunctionReference<"mutation", "public">;
    twinAddChatMessage: FunctionReference<"mutation", "public">;
    twinReactToPost: FunctionReference<"mutation", "public">;
  };
};

export { twinApi };

export function createTwinClient(token?: string): ConvexHttpClient {
  const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  if (token) client.setAuth(token);
  return client;
}
