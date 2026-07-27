"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useAdminReview() {
  const [actionLoading, setActionLoading] = useState(null);
  const [actionError, setActionError] = useState(null);

  const startReviewMut = useMutation(api.admin.startReview);
  const approveBookMut = useMutation(api.admin.approveBook);
  const rejectBookMut = useMutation(api.admin.rejectBook);
  const markPublishedMut = useMutation(api.admin.markAsPublished);

  const startReview = useCallback(async (bookId, reviewerName) => {
    setActionLoading(bookId);
    setActionError(null);
    try {
      await startReviewMut({ bookId, reviewerName });
    } catch (err) {
      setActionError(err.message);
      throw err;
    } finally {
      setActionLoading(null);
    }
  }, [startReviewMut]);

  const approveBook = useCallback(async (bookId, { reviewNotes, isbn } = {}) => {
    setActionLoading(bookId);
    setActionError(null);
    try {
      await approveBookMut({ bookId, reviewNotes, isbn });
    } catch (err) {
      setActionError(err.message);
      throw err;
    } finally {
      setActionLoading(null);
    }
  }, [approveBookMut]);

  const rejectBook = useCallback(async (bookId, { rejectionReason, rejectionCategory, reviewNotes } = {}) => {
    setActionLoading(bookId);
    setActionError(null);
    try {
      await rejectBookMut({
        bookId,
        rejectionReason,
        rejectionCategory,
        reviewNotes,
      });
    } catch (err) {
      setActionError(err.message);
      throw err;
    } finally {
      setActionLoading(null);
    }
  }, [rejectBookMut]);

  const markPublished = useCallback(async (bookId, { googlePlayUrl, isbn } = {}) => {
    setActionLoading(bookId);
    setActionError(null);
    try {
      await markPublishedMut({ bookId, googlePlayUrl, isbn });
    } catch (err) {
      setActionError(err.message);
      throw err;
    } finally {
      setActionLoading(null);
    }
  }, [markPublishedMut]);

  return {
    startReview,
    approveBook,
    rejectBook,
    markPublished,
    actionLoading,
    actionError,
  };
}

export function useAdminBooks(status) {
  const books = useQuery(api.admin.listByStatus, { status: status || undefined });
  return {
    books: books || [],
    isLoading: books === undefined,
  };
}

export function useAdminStats() {
  const stats = useQuery(api.admin.getStats, {});
  return {
    stats: stats || { submitted: 0, inReview: 0, approved: 0, published: 0, rejected: 0, total: 0 },
    isLoading: stats === undefined,
  };
}

export function useAdminBookDetail(bookId) {
  const book = useQuery(
    api.admin.getBookForReview,
    bookId ? { bookId } : "skip"
  );
  return {
    book: book || null,
    isLoading: book === undefined,
  };
}
