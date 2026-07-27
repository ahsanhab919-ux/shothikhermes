import { describe, it, expect, beforeEach } from "vitest";

import * as bookService from "../bookService";

/**
 * These tests exercise the raw Convex handlers (`_handler`) against a minimal
 * in-memory fake `ctx.db`. They cover the data-integrity guards added for the
 * shared-`books`-table findings: host-row leakage, orphaned chapterAttempts on
 * reset, and the server-side attempt cap.
 */

type Doc = Record<string, any>;

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
    return Object.entries(this.constraints).every(([k, v]) => doc[k] === v);
  }

  async collect() {
    const rows = this.docs
      .filter((d) => this.matches(d))
      .sort((a, b) => a._creationTime - b._creationTime);
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
    const stored = { ...doc, _id: id, _creationTime: doc._creationTime ?? this.seq };
    this.seq += 1;
    this.table(table).set(id, stored);
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

  count(table: string) {
    return this.table(table).size;
  }
}

const USER = "user_123";

function run(fn: any, ctx: any, args: any) {
  return fn._handler(ctx, args);
}

let db: FakeDb;
let ctx: { db: FakeDb };

beforeEach(() => {
  db = new FakeDb();
  ctx = { db };
});

describe("listBooks (host-row leakage)", () => {
  it("returns only engine-owned rows, excluding host publishing books", async () => {
    db.seed("books", { userId: USER, title: "Engine A", engineStatus: "draft" });
    db.seed("books", { userId: USER, title: "Host B", status: "submitted" }); // no engineStatus
    db.seed("books", { userId: USER, title: "Engine C", engineStatus: "running" });

    const books = await run(bookService.listBooks, ctx, { userId: USER });

    expect(books.map((b: Doc) => b.title)).toEqual(["Engine C", "Engine A"]);
    expect(books.every((b: Doc) => b.engineStatus !== undefined)).toBe(true);
  });
});

describe("getBook (host-row guard)", () => {
  it("returns null for a host-owned book", async () => {
    const id = db.seed("books", { userId: USER, title: "Host", status: "submitted" });
    expect(await run(bookService.getBook, ctx, { userId: USER, bookId: id })).toBeNull();
  });

  it("returns an engine-owned book", async () => {
    const id = db.seed("books", { userId: USER, title: "Engine", engineStatus: "draft" });
    const book = await run(bookService.getBook, ctx, { userId: USER, bookId: id });
    expect(book?.title).toBe("Engine");
  });
});

describe("claimBookForRun (rejects host books)", () => {
  it("does not claim a host-owned book (undefined engineStatus)", async () => {
    const id = db.seed("books", { userId: USER, title: "Host", status: "submitted" });
    const result = await run(bookService.claimBookForRun, ctx, { userId: USER, bookId: id });
    expect(result.status).toBe("conflict");
    // The host book must be left untouched (no engineStatus written).
    expect((await db.get(id))?.engineStatus).toBeUndefined();
  });

  it("claims an engine-owned draft", async () => {
    const id = db.seed("books", { userId: USER, title: "Engine", engineStatus: "draft" });
    const result = await run(bookService.claimBookForRun, ctx, { userId: USER, bookId: id });
    expect(result.status).toBe("claimed");
    expect((await db.get(id))?.engineStatus).toBe("running");
  });
});

describe("resetBookToDraft (deletes chapterAttempts)", () => {
  it("clears chapters AND chapterAttempts", async () => {
    const bookId = db.seed("books", { userId: USER, title: "Engine", engineStatus: "running" });
    db.seed("chapters", { userId: USER, bookId, index: 0, status: "accepted", createdAt: 1, updatedAt: 1 });
    db.seed("chapterAttempts", { userId: USER, bookId, index: 0, attempt: 1, status: "accepted", gateIssues: [], createdAt: 1, updatedAt: 1 });
    db.seed("chapterAttempts", { userId: USER, bookId, index: 0, attempt: 2, status: "rejected", gateIssues: [], createdAt: 2, updatedAt: 2 });

    const result = await run(bookService.resetBookToDraft, ctx, { userId: USER, bookId });

    expect(result.status).toBe("ok");
    expect(db.count("chapters")).toBe(0);
    expect(db.count("chapterAttempts")).toBe(0);
    expect((await db.get(bookId))?.engineStatus).toBe("draft");
  });
});

describe("recordChapterAttempt (server-side cap)", () => {
  it("inserts while under MAX_CHAPTER_ATTEMPTS", async () => {
    const bookId = db.seed("books", { userId: USER, engineStatus: "running" });
    const result = await run(bookService.recordChapterAttempt, ctx, {
      userId: USER, bookId, index: 0, attempt: 1, status: "rejected", gateIssues: [],
    });
    expect(result.status).toBe("ok");
    expect(result.attempt.attempt).toBe(1);
    expect(db.count("chapterAttempts")).toBe(1);
  });

  it("rejects once MAX_CHAPTER_ATTEMPTS already exist for the chapter", async () => {
    const bookId = db.seed("books", { userId: USER, engineStatus: "running" });
    for (let i = 1; i <= 3; i++) {
      db.seed("chapterAttempts", { userId: USER, bookId, index: 0, attempt: i, status: "rejected", gateIssues: [], createdAt: i, updatedAt: i });
    }
    const result = await run(bookService.recordChapterAttempt, ctx, {
      userId: USER, bookId, index: 0, attempt: 4, status: "failed", gateIssues: [],
    });
    expect(result.status).toBe("limit_exceeded");
    expect(result.attempt).toBeNull();
    // Nothing new inserted.
    expect(db.count("chapterAttempts")).toBe(3);
  });

  it("counts per-chapter, so a different index is unaffected", async () => {
    const bookId = db.seed("books", { userId: USER, engineStatus: "running" });
    for (let i = 1; i <= 3; i++) {
      db.seed("chapterAttempts", { userId: USER, bookId, index: 0, attempt: i, status: "rejected", gateIssues: [], createdAt: i, updatedAt: i });
    }
    const result = await run(bookService.recordChapterAttempt, ctx, {
      userId: USER, bookId, index: 1, attempt: 1, status: "accepted", gateIssues: [],
    });
    expect(result.status).toBe("ok");
  });
});

describe("resetBookToDraft (engine-ownership guard)", () => {
  it("rejects a host-owned book and does NOT stamp engineStatus:draft onto it", async () => {
    const id = db.seed("books", { userId: USER, title: "Host", status: "submitted" });
    const result = await run(bookService.resetBookToDraft, ctx, { userId: USER, bookId: id });
    expect(result.status).toBe("not_found");
    expect((await db.get(id))?.engineStatus).toBeUndefined();
  });

  it("resets a genuine engine-owned book", async () => {
    const id = db.seed("books", { userId: USER, title: "Engine", engineStatus: "running" });
    const result = await run(bookService.resetBookToDraft, ctx, { userId: USER, bookId: id });
    expect(result.status).toBe("ok");
    expect((await db.get(id))?.engineStatus).toBe("draft");
  });
});

describe("setBookStatus (engine-ownership guard)", () => {
  it("rejects a host-owned book and leaves engineStatus undefined", async () => {
    const id = db.seed("books", { userId: USER, title: "Host", status: "submitted" });
    const result = await run(bookService.setBookStatus, ctx, { userId: USER, bookId: id, status: "draft" });
    expect(result.status).toBe("not_found");
    expect((await db.get(id))?.engineStatus).toBeUndefined();
  });

  it("updates status on a genuine engine-owned book", async () => {
    const id = db.seed("books", { userId: USER, title: "Engine", engineStatus: "running" });
    const result = await run(bookService.setBookStatus, ctx, { userId: USER, bookId: id, status: "completed" });
    expect(result.status).toBe("ok");
    expect((await db.get(id))?.engineStatus).toBe("completed");
  });
});
