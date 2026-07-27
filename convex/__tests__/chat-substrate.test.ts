import { beforeEach, describe, expect, it } from "vitest";

import * as conversations from "../conversations";
import * as messages from "../messages";

type Doc = Record<string, any>;

class FakeAuth {
  constructor(private subject: string | null) {}

  async getUserIdentity() {
    return this.subject ? { subject: this.subject } : null;
  }
}

class FakeQuery {
  private constraints: Record<string, unknown> = {};
  private descending = false;

  constructor(private docs: Doc[]) {}

  withIndex(_name: string, cb?: (q: any) => any) {
    if (cb) {
      const q: any = {
        eq: (field: string, value: unknown) => {
          this.constraints[field] = value;
          return q;
        },
      };
      cb(q);
    }
    return this;
  }

  order(dir: "asc" | "desc") {
    this.descending = dir === "desc";
    return this;
  }

  private matches(doc: Doc) {
    return Object.entries(this.constraints).every(([key, value]) => doc[key] === value);
  }

  async collect() {
    const rows = this.docs
      .filter((doc) => this.matches(doc))
      .sort((a, b) => (a._creationTime ?? 0) - (b._creationTime ?? 0));
    return this.descending ? rows.reverse() : rows;
  }

  async first() {
    return (await this.collect())[0] ?? null;
  }
}

class FakeDb {
  private tables: Record<string, Map<string, Doc>> = {};
  private seq = 0;

  private table(name: string) {
    return (this.tables[name] ??= new Map());
  }

  seed(table: string, doc: Doc): string {
    const id = doc._id ?? `${table}_${this.seq}`;
    const creationTime = doc._creationTime ?? this.seq;
    this.seq += 1;
    this.table(table).set(id, { ...doc, _id: id, _creationTime: creationTime });
    return id;
  }

  query(table: string) {
    return new FakeQuery([...this.table(table).values()]);
  }

  async get(id: string) {
    for (const map of Object.values(this.tables)) {
      if (map.has(id)) return map.get(id)!;
    }
    return null;
  }

  async insert(table: string, doc: Doc) {
    return this.seed(table, doc);
  }

  async patch(id: string, fields: Doc) {
    for (const map of Object.values(this.tables)) {
      if (map.has(id)) {
        map.set(id, { ...map.get(id)!, ...fields });
        return;
      }
    }
    throw new Error(`patch: id not found ${id}`);
  }

  async delete(id: string) {
    for (const map of Object.values(this.tables)) {
      if (map.delete(id)) return;
    }
    throw new Error(`delete: id not found ${id}`);
  }
}

const USER = "user_123";

function run(fn: any, ctx: any, args: any) {
  return fn._handler(ctx, args);
}

let db: FakeDb;
let ctx: { db: FakeDb; auth: FakeAuth };

beforeEach(() => {
  db = new FakeDb();
  ctx = { db, auth: new FakeAuth(USER) };
});

describe("conversations.listConversations", () => {
  it("excludes deleted conversations by default", async () => {
    db.seed("conversations", {
      userId: USER,
      surface: "flagship",
      title: "active",
      status: "active",
      temporary: false,
      createdAt: 1,
      updatedAt: 2,
      lastMessageAt: 2,
      messageCount: 1,
      pinned: false,
    });
    db.seed("conversations", {
      userId: USER,
      surface: "flagship",
      title: "deleted",
      status: "deleted",
      temporary: false,
      createdAt: 3,
      updatedAt: 4,
      lastMessageAt: 4,
      messageCount: 2,
      pinned: false,
    });

    const result = await run(conversations.listConversations, ctx, { surface: "flagship" });

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("active");
  });

  it("can still list deleted conversations when explicitly requested", async () => {
    db.seed("conversations", {
      userId: USER,
      surface: "flagship",
      title: "deleted",
      status: "deleted",
      temporary: false,
      createdAt: 1,
      updatedAt: 2,
      lastMessageAt: 2,
      messageCount: 1,
      pinned: false,
    });

    const result = await run(conversations.listConversations, ctx, {
      surface: "flagship",
      status: "deleted",
    });

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("deleted");
  });
});

describe("messages.deleteMessage", () => {
  it("recomputes conversation preview, timestamp, and count from remaining messages", async () => {
    const conversationId = db.seed("conversations", {
      userId: USER,
      surface: "flagship",
      title: "chat",
      status: "active",
      temporary: false,
      createdAt: 100,
      updatedAt: 300,
      lastMessageAt: 300,
      lastMessagePreview: "newest answer",
      messageCount: 3,
      pinned: false,
      modelHandle: "gemini-2.5-flash",
    });

    db.seed("messages", {
      conversationId,
      userId: USER,
      role: "user",
      content: "first question",
      status: "completed",
      createdAt: 110,
      updatedAt: 110,
      _creationTime: 1,
    });
    db.seed("messages", {
      conversationId,
      userId: USER,
      role: "assistant",
      content: "older answer",
      status: "completed",
      modelHandle: "gemini-2.5-flash",
      createdAt: 200,
      updatedAt: 220,
      _creationTime: 2,
    });
    const newestMessageId = db.seed("messages", {
      conversationId,
      userId: USER,
      role: "assistant",
      content: "newest answer",
      status: "completed",
      modelHandle: "gemini-2.5-pro",
      createdAt: 280,
      updatedAt: 290,
      _creationTime: 3,
    });

    await run(messages.deleteMessage, ctx, { messageId: newestMessageId });

    const updatedConversation = await db.get(conversationId);
    expect(updatedConversation).not.toBeNull();
    expect(updatedConversation!.messageCount).toBe(2);
    expect(updatedConversation!.lastMessagePreview).toBe("older answer");
    expect(updatedConversation!.lastMessageAt).toBe(220);
    expect(updatedConversation!.modelHandle).toBe("gemini-2.5-flash");
  });

  it("resets preview when the final message is deleted", async () => {
    const conversationId = db.seed("conversations", {
      userId: USER,
      surface: "flagship",
      title: "solo chat",
      status: "active",
      temporary: false,
      createdAt: 100,
      updatedAt: 200,
      lastMessageAt: 200,
      lastMessagePreview: "only message",
      messageCount: 1,
      pinned: false,
    });

    const messageId = db.seed("messages", {
      conversationId,
      userId: USER,
      role: "user",
      content: "only message",
      status: "completed",
      createdAt: 150,
      updatedAt: 150,
      _creationTime: 1,
    });

    await run(messages.deleteMessage, ctx, { messageId });

    const updatedConversation = await db.get(conversationId);
    expect(updatedConversation).not.toBeNull();
    expect(updatedConversation!.messageCount).toBe(0);
    expect(updatedConversation!.lastMessagePreview).toBeUndefined();
    expect(updatedConversation!.lastMessageAt).toBe(100);
  });
});
