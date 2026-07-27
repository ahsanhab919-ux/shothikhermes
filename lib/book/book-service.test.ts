import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

// Mock the Convex transport (the ported storage seam). Previously these tests
// would have mocked the Mongoose models; now they mock the Convex path.
vi.mock("./convex-book-client", () => ({
  runBookQuery: vi.fn(),
  runBookMutation: vi.fn(),
}));

import { runBookQuery, runBookMutation } from "./convex-book-client";
import {
  parseCreateBook,
  createBook,
  listBooks,
  getBook,
  claimBookForRun,
  resetBookToDraft,
  setBookStatus,
  getAcceptedChapters,
  saveChapterRecord,
  recordChapterAttempt,
  listChapterAttempts,
  getChapterProgress,
  BookServiceError,
  MAX_TITLE_LEN,
  MAX_CHAPTER_ATTEMPTS,
} from "./book-service";

const query = runBookQuery as unknown as Mock;
const mutation = runBookMutation as unknown as Mock;

const USER = "user_123";

function bookDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: "book_1",
    userId: USER,
    title: "My Book",
    subtitle: "A Subtitle",
    author: "Jane",
    kind: "fiction",
    sourceKind: "outline",
    engineStatus: "draft",
    plan: [{ index: 0, intent: "Open", beats: ["a", "b"] }],
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

beforeEach(() => {
  query.mockReset();
  mutation.mockReset();
});

describe("parseCreateBook", () => {
  it("parses a valid body and applies defaults", () => {
    const input = parseCreateBook({ title: "  Hello  ", plan: [{ index: 0, intent: "x", beats: ["b1"] }] });
    expect(input.title).toBe("Hello");
    expect(input.kind).toBe("fiction");
    expect(input.sourceKind).toBe("outline");
    expect(input.plan).toEqual([{ index: 0, intent: "x", beats: ["b1"] }]);
  });

  it("throws VALIDATION when title is missing", () => {
    expect(() => parseCreateBook({})).toThrowError(BookServiceError);
    try {
      parseCreateBook({});
    } catch (e) {
      expect((e as BookServiceError).code).toBe("VALIDATION");
    }
  });

  it("throws VALIDATION when title is too long", () => {
    expect(() => parseCreateBook({ title: "x".repeat(MAX_TITLE_LEN + 1) })).toThrowError(
      /at most/
    );
  });

  it("rejects an invalid kind", () => {
    expect(() => parseCreateBook({ title: "ok", kind: "poetry" })).toThrowError(/kind must be/);
  });

  it("defaults a missing plan to an empty array", () => {
    expect(parseCreateBook({ title: "ok" }).plan).toEqual([]);
  });
});

describe("createBook", () => {
  it("validates then inserts and maps the returned doc", async () => {
    mutation.mockResolvedValue(bookDoc());
    const book = await createBook(USER, { title: "My Book", plan: [] });
    expect(mutation).toHaveBeenCalledWith(
      "bookService:createBook",
      expect.objectContaining({ userId: USER, title: "My Book", kind: "fiction", sourceKind: "outline" })
    );
    expect(book).toMatchObject({ id: "book_1", userId: USER, title: "My Book", status: "draft" });
  });

  it("propagates validation errors without touching storage", async () => {
    await expect(createBook(USER, { title: "" })).rejects.toThrowError(BookServiceError);
    expect(mutation).not.toHaveBeenCalled();
  });
});

describe("listBooks", () => {
  it("maps a list of docs", async () => {
    query.mockResolvedValue([bookDoc(), bookDoc({ _id: "book_2", title: "Second" })]);
    const books = await listBooks(USER);
    expect(query).toHaveBeenCalledWith("bookService:listBooks", { userId: USER });
    expect(books.map((b) => b.id)).toEqual(["book_1", "book_2"]);
  });

  it("handles an empty/undefined result", async () => {
    query.mockResolvedValue(undefined);
    expect(await listBooks(USER)).toEqual([]);
  });
});

describe("getBook", () => {
  it("maps the doc when found", async () => {
    query.mockResolvedValue(bookDoc());
    const book = await getBook(USER, "book_1");
    expect(book.id).toBe("book_1");
  });

  it("throws NOT_FOUND when null", async () => {
    query.mockResolvedValue(null);
    await expect(getBook(USER, "missing")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("claimBookForRun (atomic claim)", () => {
  it("returns the running book on a successful claim", async () => {
    mutation.mockResolvedValue({ status: "claimed", book: bookDoc({ engineStatus: "running" }) });
    const book = await claimBookForRun(USER, "book_1");
    expect(book.status).toBe("running");
    // Atomicity: the claim is a single transactional mutation call.
    expect(mutation).toHaveBeenCalledTimes(1);
    expect(mutation).toHaveBeenCalledWith("bookService:claimBookForRun", { userId: USER, bookId: "book_1" });
  });

  it("throws CONFLICT when the book is not claimable", async () => {
    mutation.mockResolvedValue({ status: "conflict", book: bookDoc({ engineStatus: "running" }) });
    await expect(claimBookForRun(USER, "book_1")).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("throws NOT_FOUND when the book is missing", async () => {
    mutation.mockResolvedValue({ status: "not_found", book: null });
    await expect(claimBookForRun(USER, "book_1")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("resetBookToDraft", () => {
  it("maps the reset book", async () => {
    mutation.mockResolvedValue({ status: "ok", book: bookDoc({ engineStatus: "draft" }) });
    const book = await resetBookToDraft(USER, "book_1");
    expect(book.status).toBe("draft");
  });

  it("throws NOT_FOUND when the book is missing", async () => {
    mutation.mockResolvedValue({ status: "not_found", book: null });
    await expect(resetBookToDraft(USER, "book_1")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("setBookStatus", () => {
  it("rejects an invalid status", async () => {
    await expect(setBookStatus(USER, "book_1", "bogus" as any)).rejects.toMatchObject({
      code: "VALIDATION",
    });
    expect(mutation).not.toHaveBeenCalled();
  });

  it("updates and maps a valid status", async () => {
    mutation.mockResolvedValue({ status: "ok", book: bookDoc({ engineStatus: "completed" }) });
    const book = await setBookStatus(USER, "book_1", "completed");
    expect(book.status).toBe("completed");
  });
});

describe("getAcceptedChapters", () => {
  it("maps chapter docs", async () => {
    query.mockResolvedValue([
      {
        _id: "ch_1",
        userId: USER,
        bookId: "book_1",
        index: 0,
        intent: "Open",
        content: "text",
        status: "accepted",
        attempts: 2,
        createdAt: 1,
        updatedAt: 2,
      },
    ]);
    const chapters = await getAcceptedChapters(USER, "book_1");
    expect(chapters[0]).toMatchObject({ id: "ch_1", bookId: "book_1", index: 0, status: "accepted" });
  });
});

describe("saveChapterRecord", () => {
  it("passes the upsert key and maps the doc", async () => {
    mutation.mockResolvedValue({
      _id: "ch_1",
      userId: USER,
      bookId: "book_1",
      index: 3,
      intent: "Mid",
      content: "body",
      status: "draft",
      attempts: 1,
      createdAt: 1,
      updatedAt: 2,
    });
    const chapter = await saveChapterRecord(USER, {
      bookId: "book_1",
      index: 3,
      intent: "Mid",
      content: "body",
      status: "draft",
    });
    expect(mutation).toHaveBeenCalledWith(
      "bookService:saveChapterRecord",
      expect.objectContaining({ userId: USER, bookId: "book_1", index: 3 })
    );
    expect(chapter).toMatchObject({ id: "ch_1", index: 3 });
  });
});

describe("recordChapterAttempt", () => {
  it("inserts and maps an attempt", async () => {
    mutation.mockResolvedValue({
      status: "ok",
      attempt: {
        _id: "att_1",
        userId: USER,
        bookId: "book_1",
        index: 0,
        attempt: 1,
        status: "accepted",
        gateIssues: [],
        createdAt: 1,
        updatedAt: 1,
      },
    });
    const attempt = await recordChapterAttempt(USER, {
      bookId: "book_1",
      index: 0,
      attempt: 1,
      status: "accepted",
      gateIssues: [],
    });
    expect(attempt).toMatchObject({ id: "att_1", attempt: 1, status: "accepted" });
  });

  it("enforces MAX_CHAPTER_ATTEMPTS in the service layer (no storage call)", async () => {
    await expect(
      recordChapterAttempt(USER, {
        bookId: "book_1",
        index: 0,
        attempt: MAX_CHAPTER_ATTEMPTS + 1,
        status: "failed",
        gateIssues: ["too many"],
      })
    ).rejects.toMatchObject({ code: "LIMIT_EXCEEDED" });
    expect(mutation).not.toHaveBeenCalled();
  });

  it("maps a server-side limit_exceeded result to LIMIT_EXCEEDED", async () => {
    // The mutation may reject even when the attempt number looks in-range, if
    // the server already has MAX_CHAPTER_ATTEMPTS recorded for that chapter.
    mutation.mockResolvedValue({ status: "limit_exceeded", attempt: null });
    await expect(
      recordChapterAttempt(USER, {
        bookId: "book_1",
        index: 0,
        attempt: MAX_CHAPTER_ATTEMPTS,
        status: "failed",
        gateIssues: [],
      })
    ).rejects.toMatchObject({ code: "LIMIT_EXCEEDED" });
    expect(mutation).toHaveBeenCalledTimes(1);
  });
});

describe("listChapterAttempts", () => {
  it("maps attempt docs", async () => {
    query.mockResolvedValue([
      {
        _id: "att_1",
        userId: USER,
        bookId: "book_1",
        index: 0,
        attempt: 1,
        status: "rejected",
        gateIssues: ["x"],
        createdAt: 1,
        updatedAt: 1,
      },
    ]);
    const attempts = await listChapterAttempts(USER, "book_1");
    expect(attempts[0]).toMatchObject({ id: "att_1", status: "rejected", gateIssues: ["x"] });
  });
});

describe("getChapterProgress", () => {
  it("derives progress from the plan and attempts", async () => {
    query.mockImplementation(async (path: string) => {
      if (path === "bookService:getBook") {
        return bookDoc({
          engineStatus: "running",
          plan: [
            { index: 0, intent: "Open", beats: [] },
            { index: 1, intent: "Middle", beats: [] },
          ],
        });
      }
      if (path === "bookService:listChapterAttempts") {
        return [
          { _id: "a1", userId: USER, bookId: "book_1", index: 0, attempt: 1, status: "rejected", gateIssues: ["r1"], createdAt: 1, updatedAt: 1 },
          { _id: "a2", userId: USER, bookId: "book_1", index: 0, attempt: 2, status: "accepted", gateIssues: [], createdAt: 2, updatedAt: 2 },
        ];
      }
      return [];
    });

    const progress = await getChapterProgress(USER, "book_1");
    expect(progress.bookId).toBe("book_1");
    expect(progress.status).toBe("running");
    expect(progress.totalPlanned).toBe(2);
    expect(progress.accepted).toBe(1);
    // index 0: latest attempt (attempt 2) is accepted, 2 attempts total
    expect(progress.items[0]).toMatchObject({ index: 0, status: "accepted", attempts: 2 });
    // index 1: no attempts yet
    expect(progress.items[1]).toMatchObject({ index: 1, status: "pending", attempts: 0 });
  });
});
