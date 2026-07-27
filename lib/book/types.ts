/**
 * Types, enums, and constants for the engine's book-service.
 *
 * These preserve the engine's public contract. The service maps Convex
 * documents onto the `IBook` / `IChapter` / `IChapterAttempt` interfaces so
 * existing callers (e.g. `app/api/book/*`, ported later) see the same shapes
 * they did under Mongoose.
 */

export const BOOK_KINDS = ["fiction", "nonfiction"] as const;
export type BookKind = (typeof BOOK_KINDS)[number];

export const SOURCE_KINDS = ["outline", "manuscript"] as const;
export type SourceKind = (typeof SOURCE_KINDS)[number];

export const BOOK_STATUSES = ["draft", "running", "completed", "failed"] as const;
export type BookStatus = (typeof BOOK_STATUSES)[number];

export const CHAPTER_STATUSES = ["draft", "accepted", "rejected"] as const;
export type ChapterStatus = (typeof CHAPTER_STATUSES)[number];

export const ATTEMPT_STATUSES = ["accepted", "rejected", "failed"] as const;
export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number];

export const MAX_TITLE_LEN = 200;
export const MAX_CHAPTER_ATTEMPTS = 3;

export interface PlanItem {
  index: number;
  intent: string;
  beats: string[];
}

export interface IBook {
  id: string;
  userId: string;
  title: string;
  subtitle?: string;
  author?: string;
  kind: BookKind;
  sourceKind: SourceKind;
  status: BookStatus;
  plan: PlanItem[];
  createdAt: number;
  updatedAt: number;
}

export interface IChapter {
  id: string;
  userId: string;
  bookId: string;
  index: number;
  intent: string;
  content: string;
  status: ChapterStatus;
  attempts: number;
  createdAt: number;
  updatedAt: number;
}

export interface IChapterAttempt {
  id: string;
  userId: string;
  bookId: string;
  index: number;
  attempt: number;
  status: AttemptStatus;
  gateIssues: string[];
  tokensUsed?: number;
  modelHandle?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateBookInput {
  title: string;
  subtitle?: string;
  author?: string;
  kind: BookKind;
  sourceKind: SourceKind;
  plan: PlanItem[];
}

export interface ChapterAttemptInput {
  bookId: string;
  index: number;
  attempt: number;
  status: AttemptStatus;
  gateIssues: string[];
  tokensUsed?: number;
  modelHandle?: string;
}

export interface ChapterProgressItem {
  index: number;
  intent: string;
  status: ChapterStatus | "pending";
  attempts: number;
  lastGateIssues: string[];
}

export interface ChapterProgress {
  bookId: string;
  status: BookStatus;
  totalPlanned: number;
  accepted: number;
  items: ChapterProgressItem[];
}

export type BookServiceErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "CONFLICT"
  | "LIMIT_EXCEEDED";

export class BookServiceError extends Error {
  code: BookServiceErrorCode;
  constructor(code: BookServiceErrorCode, message: string) {
    super(message);
    this.name = "BookServiceError";
    this.code = code;
  }
}
