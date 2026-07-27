/**
 * book-service — the engine's book domain, ported from Mongoose onto
 * shothik-web's Convex tables.
 *
 * The PUBLIC API (function names, arguments, and return-type contract) is
 * preserved exactly. Only the storage underneath changed: Mongoose models are
 * replaced by internal Convex functions (`convex/bookService.ts`) reached
 * through a thin, mockable transport (`convex-book-client.ts`). Convex
 * documents are mapped back onto the engine's `IBook` / `IChapter` /
 * `IChapterAttempt` interfaces at this boundary so callers don't break.
 */
import { runBookQuery, runBookMutation } from "./convex-book-client";
import {
  BOOK_KINDS,
  SOURCE_KINDS,
  BOOK_STATUSES,
  MAX_TITLE_LEN,
  MAX_CHAPTER_ATTEMPTS,
  BookServiceError,
  type BookKind,
  type SourceKind,
  type BookStatus,
  type ChapterStatus,
  type CreateBookInput,
  type ChapterAttemptInput,
  type ChapterProgress,
  type ChapterProgressItem,
  type IBook,
  type IChapter,
  type IChapterAttempt,
  type PlanItem,
} from "./types";

export {
  BookServiceError,
  BOOK_KINDS,
  SOURCE_KINDS,
  BOOK_STATUSES,
  CHAPTER_STATUSES,
  ATTEMPT_STATUSES,
  MAX_TITLE_LEN,
  MAX_CHAPTER_ATTEMPTS,
} from "./types";
export type {
  IBook,
  IChapter,
  IChapterAttempt,
  CreateBookInput,
  ChapterAttemptInput,
  ChapterProgressItem,
  ChapterProgress,
  PlanItem,
  BookKind,
  SourceKind,
  BookStatus,
  ChapterStatus,
  AttemptStatus,
} from "./types";

// --- document mappers (Convex doc -> engine interface) ---

function mapBook(doc: any): IBook {
  return {
    id: String(doc._id),
    userId: doc.userId,
    title: doc.title,
    subtitle: doc.subtitle ?? undefined,
    author: doc.author ?? undefined,
    kind: (doc.kind ?? "fiction") as BookKind,
    sourceKind: (doc.sourceKind ?? "outline") as SourceKind,
    status: (doc.engineStatus ?? "draft") as BookStatus,
    plan: (doc.plan ?? []) as PlanItem[],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function mapChapter(doc: any): IChapter {
  return {
    id: String(doc._id),
    userId: doc.userId,
    bookId: String(doc.bookId),
    index: doc.index ?? 0,
    intent: doc.intent ?? "",
    content: doc.content ?? "",
    status: (doc.status ?? "draft") as ChapterStatus,
    attempts: doc.attempts ?? 1,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function mapAttempt(doc: any): IChapterAttempt {
  return {
    id: String(doc._id),
    userId: doc.userId,
    bookId: String(doc.bookId),
    index: doc.index,
    attempt: doc.attempt,
    status: doc.status,
    gateIssues: doc.gateIssues ?? [],
    tokensUsed: doc.tokensUsed ?? undefined,
    modelHandle: doc.modelHandle ?? undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

// --- pure input parsing (no storage) ---

export function parseCreateBook(body: any): CreateBookInput {
  if (!body || typeof body !== "object") {
    throw new BookServiceError("VALIDATION", "Request body is required");
  }
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    throw new BookServiceError("VALIDATION", "title is required");
  }
  if (title.length > MAX_TITLE_LEN) {
    throw new BookServiceError("VALIDATION", `title must be at most ${MAX_TITLE_LEN} characters`);
  }

  const kind: BookKind = body.kind ?? "fiction";
  if (!BOOK_KINDS.includes(kind)) {
    throw new BookServiceError("VALIDATION", `kind must be one of: ${BOOK_KINDS.join(", ")}`);
  }

  const sourceKind: SourceKind = body.sourceKind ?? "outline";
  if (!SOURCE_KINDS.includes(sourceKind)) {
    throw new BookServiceError("VALIDATION", `sourceKind must be one of: ${SOURCE_KINDS.join(", ")}`);
  }

  const rawPlan = Array.isArray(body.plan) ? body.plan : [];
  const plan: PlanItem[] = rawPlan.map((item: any, i: number) => {
    if (!item || typeof item !== "object") {
      throw new BookServiceError("VALIDATION", `plan[${i}] must be an object`);
    }
    return {
      index: typeof item.index === "number" ? item.index : i,
      intent: typeof item.intent === "string" ? item.intent : "",
      beats: Array.isArray(item.beats) ? item.beats.map((b: any) => String(b)) : [],
    };
  });

  return {
    title,
    subtitle: typeof body.subtitle === "string" ? body.subtitle : undefined,
    author: typeof body.author === "string" ? body.author : undefined,
    kind,
    sourceKind,
    plan,
  };
}

// --- book operations ---

export async function createBook(userId: string, body: any): Promise<IBook> {
  const input = parseCreateBook(body);
  const doc = await runBookMutation<any>("bookService:createBook", {
    userId,
    title: input.title,
    subtitle: input.subtitle,
    author: input.author,
    kind: input.kind,
    sourceKind: input.sourceKind,
    plan: input.plan,
  });
  return mapBook(doc);
}

export async function listBooks(userId: string): Promise<IBook[]> {
  const docs = await runBookQuery<any[]>("bookService:listBooks", { userId });
  return (docs ?? []).map(mapBook);
}

export async function getBook(userId: string, bookId: string): Promise<IBook> {
  const doc = await runBookQuery<any>("bookService:getBook", { userId, bookId });
  if (!doc) {
    throw new BookServiceError("NOT_FOUND", "Book not found");
  }
  return mapBook(doc);
}

export async function claimBookForRun(userId: string, bookId: string): Promise<IBook> {
  const result = await runBookMutation<any>("bookService:claimBookForRun", { userId, bookId });
  if (result.status === "not_found") {
    throw new BookServiceError("NOT_FOUND", "Book not found");
  }
  if (result.status === "conflict") {
    throw new BookServiceError("CONFLICT", "Book is not in draft status and cannot be claimed");
  }
  return mapBook(result.book);
}

export async function resetBookToDraft(userId: string, bookId: string): Promise<IBook> {
  const result = await runBookMutation<any>("bookService:resetBookToDraft", { userId, bookId });
  if (result.status === "not_found") {
    throw new BookServiceError("NOT_FOUND", "Book not found");
  }
  return mapBook(result.book);
}

export async function setBookStatus(
  userId: string,
  bookId: string,
  status: BookStatus
): Promise<IBook> {
  if (!BOOK_STATUSES.includes(status)) {
    throw new BookServiceError("VALIDATION", `status must be one of: ${BOOK_STATUSES.join(", ")}`);
  }
  const result = await runBookMutation<any>("bookService:setBookStatus", { userId, bookId, status });
  if (result.status === "not_found") {
    throw new BookServiceError("NOT_FOUND", "Book not found");
  }
  return mapBook(result.book);
}

// --- chapter operations ---

export async function getAcceptedChapters(userId: string, bookId: string): Promise<IChapter[]> {
  const docs = await runBookQuery<any[]>("bookService:getAcceptedChapters", { userId, bookId });
  return (docs ?? []).map(mapChapter);
}

export interface SaveChapterRecordInput {
  bookId: string;
  index: number;
  intent: string;
  content: string;
  status: ChapterStatus;
  attempts?: number;
}

export async function saveChapterRecord(
  userId: string,
  input: SaveChapterRecordInput
): Promise<IChapter> {
  const doc = await runBookMutation<any>("bookService:saveChapterRecord", {
    userId,
    bookId: input.bookId,
    index: input.index,
    intent: input.intent,
    content: input.content,
    status: input.status,
    attempts: input.attempts,
  });
  return mapChapter(doc);
}

export async function recordChapterAttempt(
  userId: string,
  input: ChapterAttemptInput
): Promise<IChapterAttempt> {
  if (input.attempt > MAX_CHAPTER_ATTEMPTS) {
    throw new BookServiceError(
      "LIMIT_EXCEEDED",
      `attempt ${input.attempt} exceeds MAX_CHAPTER_ATTEMPTS (${MAX_CHAPTER_ATTEMPTS})`
    );
  }
  const result = await runBookMutation<any>("bookService:recordChapterAttempt", {
    userId,
    bookId: input.bookId,
    index: input.index,
    attempt: input.attempt,
    status: input.status,
    gateIssues: input.gateIssues ?? [],
    tokensUsed: input.tokensUsed,
    modelHandle: input.modelHandle,
  });
  if (result?.status === "limit_exceeded") {
    throw new BookServiceError(
      "LIMIT_EXCEEDED",
      `chapter ${input.index} has reached MAX_CHAPTER_ATTEMPTS (${MAX_CHAPTER_ATTEMPTS})`
    );
  }
  return mapAttempt(result.attempt);
}

export async function listChapterAttempts(
  userId: string,
  bookId: string
): Promise<IChapterAttempt[]> {
  const docs = await runBookQuery<any[]>("bookService:listChapterAttempts", { userId, bookId });
  return (docs ?? []).map(mapAttempt);
}

export async function getChapterProgress(
  userId: string,
  bookId: string
): Promise<ChapterProgress> {
  const book = await getBook(userId, bookId);
  const attempts = await listChapterAttempts(userId, bookId);

  const byIndex = new Map<number, IChapterAttempt[]>();
  for (const att of attempts) {
    const list = byIndex.get(att.index) ?? [];
    list.push(att);
    byIndex.set(att.index, list);
  }

  const items: ChapterProgressItem[] = book.plan.map((p) => {
    const atts = (byIndex.get(p.index) ?? []).slice().sort((a, b) => b.attempt - a.attempt);
    const last = atts[0];
    let status: ChapterProgressItem["status"] = "pending";
    if (last) {
      status = last.status === "accepted" ? "accepted" : last.status === "rejected" ? "rejected" : "pending";
    }
    return {
      index: p.index,
      intent: p.intent,
      status,
      attempts: atts.length,
      lastGateIssues: last?.gateIssues ?? [],
    };
  });

  return {
    bookId: book.id,
    status: book.status,
    totalPlanned: book.plan.length,
    accepted: items.filter((i) => i.status === "accepted").length,
    items,
  };
}
