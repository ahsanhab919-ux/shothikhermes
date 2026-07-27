import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  projects: defineTable({
    title: v.string(),
    type: v.union(v.literal("book"), v.literal("research"), v.literal("assignment")),
    template: v.optional(v.string()),
    description: v.optional(v.string()),
    content: v.optional(v.string()),
    sections: v.optional(v.array(v.object({
      id: v.string(),
      title: v.string(),
      content: v.optional(v.string()),
      order: v.number(),
      children: v.optional(v.array(v.object({
        id: v.string(),
        title: v.string(),
        content: v.optional(v.string()),
        order: v.number(),
        status: v.optional(v.string()),
      }))),
    }))),
    settings: v.optional(v.object({
      citationStyle: v.optional(v.string()),
      targetJournal: v.optional(v.string()),
      deadline: v.optional(v.string()),
      dailyGoal: v.optional(v.number()),
      fontFamily: v.optional(v.string()),
      fontSize: v.optional(v.number()),
      trimSize: v.optional(v.string()),
    })),
    wordCount: v.optional(v.number()),
    progress: v.optional(v.number()),
    lastEditedAt: v.optional(v.number()),
    userId: v.optional(v.string()),
    starred: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["type"])
    .index("by_user_type", ["userId", "type"]),

  projectVersions: defineTable({
    projectId: v.id("projects"),
    content: v.string(),
    sections: v.optional(v.any()),
    savedAt: v.number(),
    label: v.optional(v.string()),
  }).index("by_project", ["projectId"]),

  chapters: defineTable({
    // Host (writing-studio) chapters are project-scoped. These three were
    // required; they are relaxed to optional so the engine's book-scoped
    // chapters can coexist in the same table. Existing project chapters are
    // unaffected (they still carry projectId/title/order). No Convex function
    // currently reads/writes this table, so relaxing carries no runtime risk.
    projectId: v.optional(v.id("projects")),
    userId: v.string(),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    order: v.optional(v.number()),
    // --- engine (book-service) fields — additive, book-scoped chapters ---
    bookId: v.optional(v.id("books")),
    index: v.optional(v.number()),
    intent: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("accepted"),
      v.literal("rejected")
    )),
    attempts: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_and_order", ["projectId", "order"])
    .index("by_book", ["bookId", "userId", "index"]),

  versions: defineTable({
    projectId: v.id("projects"),
    userId: v.string(),
    content: v.string(),
    wordCount: v.number(),
    description: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_and_date", ["projectId", "createdAt"]),

  // New table for the engine's book-service. No host equivalent exists.
  // Records each generation attempt for a chapter (gate results, tokens, model).
  chapterAttempts: defineTable({
    userId: v.string(),
    bookId: v.id("books"),
    index: v.number(),
    attempt: v.number(),
    status: v.union(
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("failed")
    ),
    gateIssues: v.array(v.string()),
    tokensUsed: v.optional(v.number()),
    modelHandle: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_book", ["bookId", "userId"])
    .index("by_user", ["userId"]),

  books: defineTable({
    userId: v.string(),
    projectId: v.optional(v.id("projects")),
    status: v.union(
      v.literal("draft"),
      v.literal("submitted"),
      v.literal("in_review"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("uploading"),
      v.literal("published")
    ),
    manuscriptStorageId: v.optional(v.id("_storage")),
    manuscriptName: v.optional(v.string()),
    manuscriptSize: v.optional(v.number()),
    manuscriptFormat: v.optional(v.string()),
    title: v.string(),
    subtitle: v.optional(v.string()),
    description: v.optional(v.string()),
    language: v.optional(v.string()),
    category: v.optional(v.string()),
    subcategory: v.optional(v.string()),
    keywords: v.optional(v.array(v.string())),
    coverStorageId: v.optional(v.id("_storage")),
    coverDimensions: v.optional(v.object({
      width: v.number(),
      height: v.number(),
    })),
    listPrice: v.optional(v.string()),
    currency: v.optional(v.string()),
    agreementAccepted: v.optional(v.boolean()),
    agreementName: v.optional(v.string()),
    agreementScrolled: v.optional(v.boolean()),
    currentStep: v.optional(v.number()),
    completedSteps: v.optional(v.array(v.string())),
    rejectionReason: v.optional(v.string()),
    rejectionCategory: v.optional(v.string()),
    reviewNotes: v.optional(v.string()),
    reviewedBy: v.optional(v.string()),
    reviewedAt: v.optional(v.string()),
    resubmissionCount: v.optional(v.number()),
    previousRejections: v.optional(v.array(v.object({
      reason: v.string(),
      category: v.string(),
      reviewNotes: v.optional(v.string()),
      rejectedAt: v.string(),
      reviewedBy: v.optional(v.string()),
    }))),
    googlePlayUrl: v.optional(v.string()),
    isbn: v.optional(v.string()),
    salesCount: v.optional(v.number()),
    totalEarnings: v.optional(v.number()),
    distributionEnabled: v.optional(v.boolean()),
    distributionOptIn: v.optional(v.boolean()),
    distributionChannels: v.optional(v.array(v.object({
      channelId: v.string(),
      channelName: v.string(),
      status: v.string(),
      url: v.optional(v.string()),
    }))),
    publishDriveBookId: v.optional(v.string()),
    notifications: v.optional(v.array(v.object({
      id: v.string(),
      type: v.string(),
      message: v.string(),
      read: v.boolean(),
      createdAt: v.string(),
    }))),
    timestamps: v.optional(v.object({
      draft: v.optional(v.string()),
      submitted: v.optional(v.string()),
      in_review: v.optional(v.string()),
      approved: v.optional(v.string()),
      uploading: v.optional(v.string()),
      published: v.optional(v.string()),
      rejected: v.optional(v.string()),
    })),
    creditPrice: v.optional(v.number()),
    contentState: v.optional(v.union(
      v.literal("draft"),
      v.literal("agent_generated"),
      v.literal("pending_master_review"),
      v.literal("approved"),
      v.literal("published"),
      v.literal("community_preview_posted")
    )),
    twinId: v.optional(v.id("twins")),
    // --- engine (book-service) fields — additive, non-destructive ---
    // The engine's book domain (ported from Mongoose) reuses this table.
    // `engineStatus` holds the generation-run lifecycle and is deliberately
    // separate from the host's publishing-workflow `status` above so the two
    // state machines never collide.
    author: v.optional(v.string()),
    kind: v.optional(v.union(v.literal("fiction"), v.literal("nonfiction"))),
    sourceKind: v.optional(v.union(v.literal("outline"), v.literal("manuscript"))),
    engineStatus: v.optional(v.union(
      v.literal("draft"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    )),
    plan: v.optional(v.array(v.object({
      index: v.number(),
      intent: v.string(),
      beats: v.array(v.string()),
    }))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_status", ["status"]),

  // --- Second Me satellite tables (engine Step 3a) — additive, userId-keyed ---
  // These enrich the existing twins subsystem in place; they add NO behavior to
  // any twin function. CRITICAL: sealed BYOK keys live here, keyed by
  // {userId, purpose}, and NEVER on the transferable twins row. There is no
  // twinId on this table by design, so a twin ownership transfer can never carry
  // the previous owner's keys.
  secondMeKeyCustody: defineTable({
    userId: v.string(),
    purpose: v.string(),
    // Vault envelope only (crypto-vault seal output). Never plaintext.
    sealedKey: v.string(),
    provider: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_purpose", ["userId", "purpose"]),

  // One writing profile per user: the metadata mirror of their Letta writing
  // agent (which owns their WRITING.md). Keyed by userId.
  writingProfiles: defineTable({
    userId: v.string(),
    lettaAgentId: v.string(),
    blockLabel: v.string(),
    modelHandle: v.optional(v.string()),
    embeddingHandle: v.optional(v.string()),
    lastContentLength: v.number(),
    lastSyncedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  contentPurchases: defineTable({
    userId: v.string(),
    bookId: v.id("books"),
    creditAmount: v.number(),
    masterAmount: v.number(),
    platformAmount: v.number(),
    purchasedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_book", ["bookId"])
    .index("by_user_book", ["userId", "bookId"]),

  salesRecords: defineTable({
    bookId: v.id("books"),
    userId: v.string(),
    channel: v.string(),
    period: v.string(),
    month: v.optional(v.string()),
    unitsSold: v.number(),
    grossRevenue: v.number(),
    netRevenue: v.number(),
    royaltyAmount: v.number(),
    currency: v.string(),
    recordedAt: v.number(),
  })
    .index("by_book", ["bookId"])
    .index("by_user", ["userId"])
    .index("by_user_period", ["userId", "period"])
    .index("by_book_period", ["bookId", "period"])
    .index("by_user_and_month", ["userId", "month"]),

  payouts: defineTable({
    userId: v.string(),
    amount: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    method: v.union(v.literal("stripe"), v.literal("payoneer"), v.literal("bank_transfer")),
    stripePayoutId: v.optional(v.string()),
    stripeTransferId: v.optional(v.string()),
    payoneerPayoutId: v.optional(v.string()),
    failureReason: v.optional(v.string()),
    processedAt: v.optional(v.number()),
    periodStart: v.string(),
    periodEnd: v.string(),
    bookBreakdown: v.optional(v.array(v.object({
      bookId: v.string(),
      bookTitle: v.string(),
      amount: v.number(),
      unitsSold: v.number(),
    }))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"])
    .index("by_stripe_transfer", ["stripeTransferId"]),

  earningsRecords: defineTable({
    userId: v.string(),
    period: v.string(),
    amount: v.number(),
    holdback: v.number(),
    bookCount: v.number(),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_period", ["userId", "period"])
    .index("by_period", ["period"]),

  authorTaxInfo: defineTable({
    userId: v.string(),
    formType: v.string(),
    country: v.string(),
    taxId: v.string(),
    legalName: v.string(),
    address: v.string(),
    city: v.string(),
    postalCode: v.string(),
    treatyBenefit: v.optional(v.boolean()),
    treatyCountry: v.optional(v.string()),
    withholdingRate: v.optional(v.number()),
    certifiedAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  distributionRecords: defineTable({
    bookId: v.string(),
    userId: v.string(),
    jobId: v.string(),
    status: v.string(),
    publishDriveBookId: v.optional(v.string()),
    channels: v.array(
      v.object({
        channelId: v.string(),
        channelName: v.string(),
        status: v.string(),
        url: v.optional(v.string()),
        updatedAt: v.number(),
      }),
    ),
    submittedAt: v.number(),
    updatedAt: v.number(),
    errorMessage: v.optional(v.string()),
  })
    .index("by_book", ["bookId"])
    .index("by_user", ["userId"])
    .index("by_publishdrive_id", ["publishDriveBookId"]),

  payoutAccounts: defineTable({
    userId: v.string(),
    method: v.union(v.literal("stripe"), v.literal("payoneer"), v.literal("bank_transfer")),
    isDefault: v.boolean(),
    stripeConnectAccountId: v.optional(v.string()),
    stripeOnboardingComplete: v.optional(v.boolean()),
    payoneerAccountEmail: v.optional(v.string()),
    payoneerPayeeId: v.optional(v.string()),
    bankDetails: v.optional(v.object({
      accountHolder: v.string(),
      bankName: v.string(),
      lastFourDigits: v.string(),
      country: v.string(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_method", ["userId", "method"]),

  llmUsage: defineTable({
    userId: v.string(),
    tool: v.string(),
    provider: v.string(),
    tokens: v.number(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    costUsd: v.number(),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_tool", ["tool"])
    .index("by_timestamp", ["timestamp"])
    .index("by_user_tool", ["userId", "tool"]),

  // @deprecated — Migrated to `twins` table. Retained for backward compatibility with existing data.
  /** @deprecated — Legacy table retained for FK references only. All runtime operations use `twins`. */
  agents: defineTable({
    name: v.string(),
    specialization: v.string(),
    masterId: v.string(),
    apiKeyHash: v.string(),
    apiKeyPrefix: v.string(),
    trustScore: v.number(),
    status: v.union(v.literal("active"), v.literal("suspended")),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    publishedCount: v.number(),
    followersCount: v.number(),
    lastHeartbeatAt: v.optional(v.number()),
    onlineStatus: v.optional(v.union(
      v.literal("online"),
      v.literal("writing"),
      v.literal("idle"),
      v.literal("offline")
    )),
    currentActivity: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_master", ["masterId"])
    .index("by_key_hash", ["apiKeyHash"])
    .index("by_status", ["status"]),

  agent_follows: defineTable({
    agentId: v.id("agents"),
    followerId: v.string(),
    followerType: v.union(v.literal("human"), v.literal("agent")),
    createdAt: v.number(),
  })
    .index("by_agent", ["agentId"])
    .index("by_follower", ["followerId"]),

  agent_notifications: defineTable({
    masterId: v.string(),
    agentId: v.optional(v.id("agents")),
    twinId: v.optional(v.id("twins")),
    agentName: v.optional(v.string()),
    type: v.union(
      v.literal("format_complete"),
      v.literal("review_needed"),
      v.literal("forum_opened"),
      v.literal("revision_requested"),
      v.literal("distribution_failed"),
      v.literal("distribution_submitted")
    ),
    bookId: v.optional(v.id("books")),
    bookTitle: v.optional(v.string()),
    forumId: v.optional(v.string()),
    message: v.string(),
    feedback: v.optional(v.string()),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_master", ["masterId"])
    .index("by_master_unread", ["masterId", "read"])
    .index("by_agent", ["agentId"])
    .index("by_twin", ["twinId"]),

  public_notifications: defineTable({
    userId: v.string(),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "read"]),

  forums: defineTable({
    bookId: v.optional(v.id("books")),
    agentId: v.optional(v.id("agents")),
    twinId: v.optional(v.id("twins")),
    masterId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    channelSlug: v.optional(v.string()),
    participantType: v.union(
      v.literal("agent_only"),
      v.literal("human_only"),
      v.literal("both")
    ),
    status: v.union(v.literal("open"), v.literal("closed"), v.literal("published")),
    publicationDate: v.optional(v.number()),
    reservationCount: v.number(),
    coverImageUrl: v.optional(v.string()),
    category: v.optional(v.string()),
    language: v.optional(v.string()),
    postCount: v.number(),
    lastActivityAt: v.number(),
    votingMode: v.optional(v.union(
      v.literal("balance_of_probabilities"),
      v.literal("beyond_reasonable_doubt")
    )),
    citationRequired: v.optional(v.boolean()),
    agentBrief: v.optional(v.string()),
    agentOpinion: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_agent", ["agentId"])
    .index("by_twin", ["twinId"])
    .index("by_master", ["masterId"])
    .index("by_status", ["status"])
    .index("by_last_activity", ["lastActivityAt"])
    .index("by_publication_date", ["publicationDate"])
    .index("by_channel", ["channelSlug"]),

  forum_posts: defineTable({
    forumId: v.id("forums"),
    authorId: v.string(),
    authorType: v.union(v.literal("human"), v.literal("agent")),
    authorName: v.string(),
    content: v.string(),
    shareToken: v.string(),
    reactions: v.object({
      intrigued: v.number(),
      skeptical: v.number(),
      impressed: v.number(),
      unsettled: v.number(),
    }),
    createdAt: v.number(),
  })
    .index("by_forum", ["forumId"])
    .index("by_share_token", ["shareToken"])
    .index("by_forum_time", ["forumId", "createdAt"]),

  forum_reactions: defineTable({
    postId: v.id("forum_posts"),
    forumId: v.id("forums"),
    reactorId: v.string(),
    reactorType: v.union(v.literal("human"), v.literal("agent")),
    reactionType: v.union(
      v.literal("intrigued"),
      v.literal("skeptical"),
      v.literal("impressed"),
      v.literal("unsettled")
    ),
    createdAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_reactor_post", ["reactorId", "postId"]),

  forum_reservations: defineTable({
    forumId: v.id("forums"),
    reserverId: v.string(),
    reserverType: v.union(v.literal("human"), v.literal("agent")),
    earlyReaderBadge: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_forum", ["forumId"])
    .index("by_reserver", ["reserverId"])
    .index("by_forum_reserver", ["forumId", "reserverId"]),

  forum_tips: defineTable({
    forumId: v.id("forums"),
    postId: v.optional(v.id("forum_posts")),
    fromId: v.string(),
    fromType: v.union(v.literal("human"), v.literal("agent")),
    toAgentId: v.optional(v.id("agents")),
    toTwinId: v.optional(v.id("twins")),
    amount: v.number(),
    createdAt: v.number(),
  })
    .index("by_forum", ["forumId"])
    .index("by_agent", ["toAgentId"])
    .index("by_twin", ["toTwinId"]),

  forum_chat: defineTable({
    forumId: v.id("forums"),
    authorId: v.string(),
    authorType: v.union(v.literal("human"), v.literal("agent")),
    authorName: v.string(),
    message: v.string(),
    replyToId: v.optional(v.id("forum_chat")),
    createdAt: v.number(),
  })
    .index("by_forum", ["forumId"])
    .index("by_forum_time", ["forumId", "createdAt"]),

  conversations: defineTable({
    userId: v.string(),
    surface: v.union(
      v.literal("flagship"),
      v.literal("writing-studio"),
      v.literal("sheet"),
      v.literal("research"),
      v.literal("book-agent")
    ),
    title: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("archived"),
      v.literal("deleted")
    ),
    pinned: v.boolean(),
    temporary: v.boolean(),
    modelHandle: v.optional(v.string()),
    contextRef: v.optional(v.object({
      projectId: v.optional(v.id("projects")),
      bookId: v.optional(v.id("books")),
      sheetId: v.optional(v.string()),
      researchId: v.optional(v.string()),
      localProjectId: v.optional(v.string()),
      agentType: v.optional(v.string()),
    })),
    lastMessageAt: v.number(),
    lastMessagePreview: v.optional(v.string()),
    messageCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_updated", ["userId", "updatedAt"])
    .index("by_user_surface", ["userId", "surface"])
    .index("by_user_status", ["userId", "status"])
    .index("by_user_pinned", ["userId", "pinned"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    userId: v.string(),
    role: v.union(
      v.literal("system"),
      v.literal("user"),
      v.literal("assistant"),
      v.literal("tool")
    ),
    content: v.string(),
    contentFormat: v.union(
      v.literal("markdown"),
      v.literal("plain")
    ),
    status: v.union(
      v.literal("streaming"),
      v.literal("completed"),
      v.literal("stopped"),
      v.literal("error")
    ),
    modelHandle: v.optional(v.string()),
    parentMessageId: v.optional(v.id("messages")),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_conversation_created", ["conversationId", "createdAt"])
    .index("by_user", ["userId"]),

  conversationSessions: defineTable({
    conversationId: v.id("conversations"),
    userId: v.string(),
    clientSessionId: v.string(),
    streamState: v.union(
      v.literal("idle"),
      v.literal("streaming"),
      v.literal("stopped"),
      v.literal("error")
    ),
    lastHeartbeatAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_user", ["userId"])
    .index("by_user_session", ["userId", "clientSessionId"]),

  writingAutosaves: defineTable({
    localProjectId: v.string(),
    userId: v.string(),
    content: v.string(),
    wordCount: v.number(),
    savedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project_user", ["localProjectId", "userId"])
    .index("by_user", ["userId"]),

  distributions: defineTable({
    bookId: v.string(),
    userId: v.string(),
    jobId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    publishDriveBookId: v.optional(v.string()),
    channels: v.array(v.object({
      channelId: v.string(),
      channelName: v.string(),
      status: v.string(),
      url: v.optional(v.string()),
      updatedAt: v.number(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_book", ["bookId"])
    .index("by_user", ["userId"])
    .index("by_job", ["jobId"])
    .index("by_pd_book", ["publishDriveBookId"]),

  admins: defineTable({
    userId: v.string(),
    email: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_email", ["email"]),

  users: defineTable({
    userId: v.string(),
    email: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    preferences: v.optional(
      v.object({
        locale: v.optional(v.string()),
        theme: v.optional(v.string()),
        fontSize: v.optional(v.number()),
      }),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_email", ["email"])
    .index("by_stripe_customer", ["stripeCustomerId"]),

  twins: defineTable({
    masterId: v.optional(v.string()),
    name: v.string(),
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
    trainingStatus: v.union(
      v.literal("untrained"),
      v.literal("partial"),
      v.literal("trained")
    ),
    knowledgeScore: v.number(),
    isActive: v.boolean(),
    lastActiveAt: v.optional(v.number()),
    taskCount: v.number(),
    specialization: v.optional(v.string()),
    apiKeyHash: v.optional(v.string()),
    apiKeyPrefix: v.optional(v.string()),
    trustScore: v.optional(v.number()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    publishedCount: v.optional(v.number()),
    followersCount: v.optional(v.number()),
    lastHeartbeatAt: v.optional(v.number()),
    onlineStatus: v.optional(v.union(
      v.literal("online"),
      v.literal("writing"),
      v.literal("idle"),
      v.literal("offline")
    )),
    currentActivity: v.optional(v.string()),
    lifecycleState: v.union(
      v.literal("unregistered"),
      v.literal("registered"),
      v.literal("unverified"),
      v.literal("pending_verification"),
      v.literal("verified"),
      v.literal("suspended"),
      v.literal("unlinked"),
      v.literal("transfer_pending")
    ),
    verificationBadge: v.boolean(),
    verifiedAt: v.optional(v.number()),
    sourcePlatform: v.optional(v.union(
      v.literal("vscode"),
      v.literal("replit"),
      v.literal("shell"),
      v.literal("web"),
      v.literal("other")
    )),
    previousOwners: v.optional(v.array(v.object({
      masterId: v.string(),
      linkedAt: v.number(),
      unlinkedAt: v.optional(v.number()),
    }))),
    allowedSkills: v.optional(v.array(v.string())),
    blockedSkills: v.optional(v.array(v.string())),
    approvalRequiredActions: v.optional(v.array(v.string())),
    registrationToken: v.optional(v.string()),
    masterEmail: v.optional(v.string()),
    masterName: v.optional(v.string()),
    // Additive (engine Step 3a): links a twin to its Letta writing agent for the
    // 3b voice-profile wiring. Optional so no existing twin row breaks, and it is
    // the ONLY twins change here — no key material ever lives on this row.
    lettaAgentId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_master", ["masterId"])
    .index("by_key_hash", ["apiKeyHash"])
    .index("by_lifecycle", ["lifecycleState"])
    .index("by_registration_token", ["registrationToken"])
    .index("by_master_email", ["masterEmail"]),

  twin_tasks: defineTable({
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
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    ),
    result: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_twin", ["twinId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  twin_knowledge: defineTable({
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
    addedAt: v.number(),
  })
    .index("by_twin", ["twinId"])
    .index("by_user", ["userId"]),

  twin_follows: defineTable({
    twinId: v.id("twins"),
    followerId: v.string(),
    followerType: v.union(v.literal("human"), v.literal("agent")),
    createdAt: v.number(),
  })
    .index("by_twin", ["twinId"])
    .index("by_follower", ["followerId"]),

  twin_notifications: defineTable({
    masterId: v.string(),
    twinId: v.optional(v.id("twins")),
    twinName: v.optional(v.string()),
    type: v.union(
      v.literal("format_complete"),
      v.literal("review_needed"),
      v.literal("forum_opened"),
      v.literal("revision_requested"),
      v.literal("distribution_failed"),
      v.literal("distribution_submitted")
    ),
    bookId: v.optional(v.id("books")),
    bookTitle: v.optional(v.string()),
    forumId: v.optional(v.string()),
    message: v.string(),
    feedback: v.optional(v.string()),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_master", ["masterId"])
    .index("by_master_unread", ["masterId", "read"])
    .index("by_twin", ["twinId"]),

  twin_activity_log: defineTable({
    twinId: v.id("twins"),
    masterId: v.optional(v.string()),
    action: v.string(),
    targetResource: v.optional(v.string()),
    metadata: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_twin", ["twinId"])
    .index("by_master", ["masterId"])
    .index("by_timestamp", ["timestamp"]),

  twin_transfer_requests: defineTable({
    fromMasterId: v.string(),
    toMasterId: v.string(),
    twinId: v.id("twins"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("cancelled")
    ),
    requestedAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_from", ["fromMasterId"])
    .index("by_to", ["toMasterId"])
    .index("by_twin", ["twinId"])
    .index("by_status", ["status"]),

  twin_pending_approvals: defineTable({
    twinId: v.id("twins"),
    masterId: v.string(),
    action: v.string(),
    payload: v.optional(v.any()),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    requestedAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_twin", ["twinId"])
    .index("by_master", ["masterId"])
    .index("by_status", ["status"]),

  // @deprecated — Migrated to `twins` table. Retained for backward compatibility with existing data.
  /** @deprecated — Legacy table retained for FK references only. All runtime operations use `twins`. */
  second_me: defineTable({
    userId: v.string(),
    name: v.string(),
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
    trainingStatus: v.union(
      v.literal("untrained"),
      v.literal("partial"),
      v.literal("trained")
    ),
    knowledgeScore: v.number(),
    isActive: v.boolean(),
    lastActiveAt: v.optional(v.number()),
    taskCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  second_me_tasks: defineTable({
    secondMeId: v.id("second_me"),
    userId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    taskType: v.union(
      v.literal("research"),
      v.literal("writing"),
      v.literal("analysis"),
      v.literal("summary")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    ),
    result: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_second_me", ["secondMeId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  second_me_knowledge: defineTable({
    secondMeId: v.id("second_me"),
    userId: v.string(),
    sourceType: v.union(
      v.literal("writing_history"),
      v.literal("project"),
      v.literal("chat"),
      v.literal("manual")
    ),
    content: v.string(),
    summary: v.optional(v.string()),
    addedAt: v.number(),
  })
    .index("by_second_me", ["secondMeId"])
    .index("by_user", ["userId"]),

  votes: defineTable({
    userId: v.string(),
    targetType: v.union(v.literal("book"), v.literal("forum_post"), v.literal("forum")),
    targetId: v.string(),
    value: v.union(v.literal(1), v.literal(-1)),
    createdAt: v.number(),
  })
    .index("by_target", ["targetType", "targetId"])
    .index("by_user_target", ["userId", "targetType", "targetId"])
    .index("by_user", ["userId"]),

  channels: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    domain: v.string(),
    icon: v.string(),
    memberCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"]),

  channelMemberships: defineTable({
    userId: v.string(),
    channelId: v.id("channels"),
    role: v.union(v.literal("member"), v.literal("moderator"), v.literal("expert")),
    joinedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_channel", ["channelId"])
    .index("by_user_channel", ["userId", "channelId"]),

  userReputation: defineTable({
    userId: v.string(),
    karma: v.number(),
    reviewCount: v.number(),
    helpfulnessScore: v.number(),
    level: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_karma", ["karma"]),

  starBalances: defineTable({
    userId: v.string(),
    balance: v.number(),
    totalPurchased: v.number(),
    totalSent: v.number(),
    totalReceived: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  starTransactions: defineTable({
    userId: v.string(),
    type: v.union(
      v.literal("purchase"),
      v.literal("gift_sent"),
      v.literal("gift_received"),
      v.literal("platform_fee"),
      v.literal("reviewer_fund"),
      v.literal("content_purchase"),
      v.literal("content_sale")
    ),
    amount: v.number(),
    referenceId: v.optional(v.string()),
    description: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["type"])
    .index("by_user_type", ["userId", "type"]),

  starGifts: defineTable({
    senderId: v.string(),
    recipientMasterId: v.string(),
    targetType: v.union(v.literal("forum"), v.literal("agent")),
    targetId: v.string(),
    agentId: v.optional(v.string()),
    amount: v.number(),
    masterAmount: v.number(),
    platformAmount: v.number(),
    createdAt: v.number(),
  })
    .index("by_sender", ["senderId"])
    .index("by_target", ["targetType", "targetId"])
    .index("by_master", ["recipientMasterId"]),

  reviewerFundPool: defineTable({
    balance: v.number(),
    totalAccumulated: v.number(),
    totalDistributed: v.number(),
    distributionCount: v.number(),
    lastDistributionAt: v.optional(v.number()),
    updatedAt: v.number(),
  }),

  userPreferences: defineTable({
    userId: v.string(),
    locale: v.optional(v.string()),
    theme: v.optional(v.string()),
    fontSize: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  notifications: defineTable({
    userId: v.string(),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "read"]),

  reviewerFundDistributions: defineTable({
    periodLabel: v.string(),
    userId: v.string(),
    amount: v.number(),
    qualityScore: v.number(),
    rank: v.number(),
    totalEligible: v.number(),
    poolSnapshot: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_period", ["periodLabel"]),

  latexBuilds: defineTable({
    buildId: v.string(),
    userId: v.string(),
    status: v.string(),
    pdfUrl: v.optional(v.string()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_build_id", ["buildId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),

  isbnPool: defineTable({
    isbn: v.string(),
    format: v.string(),
    status: v.union(v.literal("available"), v.literal("assigned")),
    assignedTo: v.optional(v.string()),
    assignedAt: v.optional(v.number()),
    registrant: v.optional(v.string()),
    prefix: v.optional(v.string()),
  })
    .index("by_isbn", ["isbn"])
    .index("by_status", ["status"])
    .index("by_assigned_to", ["assignedTo"]),

  subscriptionPlans: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    stripePriceIdMonthly: v.optional(v.string()),
    stripePriceIdYearly: v.optional(v.string()),
    isActive: v.boolean(),
    features: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_active", ["isActive"])
    .index("by_stripe_price_monthly", ["stripePriceIdMonthly"])
    .index("by_stripe_price_yearly", ["stripePriceIdYearly"]),

  userCredits: defineTable({
    userId: v.id("users"),
    balance: v.number(),
    lifetimeEarned: v.number(),
    lifetimeSpent: v.number(),
    tier: v.string(),
    monthlyLimit: v.number(),
    monthlyUsed: v.number(),
    monthlyResetAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  creditTransactions: defineTable({
    userId: v.id("users"),
    type: v.string(),
    amount: v.number(),
    balanceAfter: v.number(),
    description: v.string(),
    metadata: v.optional(v.any()),
    paymentIntentId: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  usageMetrics: defineTable({
    userId: v.id("users"),
    date: v.string(),
    hour: v.optional(v.number()),
    metrics: v.any(),
    createdAt: v.number(),
  })
    .index("by_user_and_hour", ["userId", "hour"])
    .index("by_user", ["userId"]),

  webhookEvents: defineTable({
    id: v.string(),
    stripeEventId: v.string(),
    type: v.string(),
    payload: v.any(),
    processed: v.boolean(),
    createdAt: v.number(),
    processedAt: v.optional(v.number()),
  }).index("by_stripe_event", ["stripeEventId"]),

  userSubscriptions: defineTable({
    userId: v.string(),
    tier: v.string(),
    status: v.string(),
    interval: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId: v.string(),
    cancelAtPeriodEnd: v.boolean(),
    canceledAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_stripe_customer", ["stripeCustomerId"])
    .index("by_stripe_subscription", ["stripeSubscriptionId"])
    .index("by_status", ["status"]),

  subscriptionUsage: defineTable({
    userId: v.string(),
    plagiarismChecks: v.number(),
    aiDetectorScans: v.number(),
    paraphraseUses: v.number(),
    grammarChecks: v.number(),
    humanizeUses: v.number(),
    summarizeUses: v.number(),
    translatorUses: v.number(),
    periodStart: v.number(),
    periodEnd: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  auditEvents: defineTable({
    requestId: v.optional(v.string()),
    timestamp: v.number(),
    actorType: v.union(
      v.literal("user"),
      v.literal("api_key"),
      v.literal("anonymous"),
      v.literal("system"),
    ),
    actorId: v.optional(v.string()),
    actorRole: v.optional(v.string()),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    action: v.string(),
    outcome: v.union(v.literal("allow"), v.literal("deny"), v.literal("error")),
    method: v.optional(v.string()),
    path: v.optional(v.string()),
    details: v.optional(v.any()),
    prevHash: v.optional(v.string()),
    hash: v.string(),
  })
    .index("by_time", ["timestamp"])
    .index("by_actor_time", ["actorId", "timestamp"])
    .index("by_action_time", ["action", "timestamp"])
    .index("by_request", ["requestId"]),
});
