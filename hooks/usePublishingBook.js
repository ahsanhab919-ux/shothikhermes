"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function usePublishingBook({ bookId: existingBookId, initialTitle = "" }) {
  const [bookId, setBookId] = useState(existingBookId || null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const saveTimeoutRef = useRef(null);

  const createDraft = useMutation(api.books.createDraft);
  const updateDraft = useMutation(api.books.updateDraft);
  const saveManuscriptFile = useMutation(api.books.saveManuscriptFile);
  const saveCoverFile = useMutation(api.books.saveCoverFile);
  const generateUploadUrl = useMutation(api.books.generateUploadUrl);
  const submitForReview = useMutation(api.books.submitForReview);
  const resubmitForReviewMut = useMutation(api.books.resubmitForReview);

  const book = useQuery(api.books.get, bookId ? { id: bookId } : "skip");

  const ensureBookDraft = useCallback(async () => {
    if (bookId) return bookId;
    const newId = await createDraft({
      title: initialTitle || "Untitled Book",
    });
    setBookId(newId);
    return newId;
  }, [bookId, initialTitle, createDraft]);

  const saveDraft = useCallback(
    async (updates) => {
      setSaveError(null);
      setIsSaving(true);
      try {
        const id = await ensureBookDraft();
        await updateDraft({ id, ...updates });
      } catch (err) {
        setSaveError(err.message || "Failed to save draft");
        console.error("Save draft error:", err);
      } finally {
        setIsSaving(false);
      }
    },
    [ensureBookDraft, updateDraft]
  );

  const debouncedSave = useCallback(
    (updates) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => saveDraft(updates), 800);
    },
    [saveDraft]
  );

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const uploadManuscript = useCallback(
    async (file) => {
      setIsSaving(true);
      setSaveError(null);
      try {
        const id = await ensureBookDraft();
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!result.ok) throw new Error("Upload failed");
        const { storageId } = await result.json();
        const format = file.name.toLowerCase().endsWith(".epub") ? "EPUB" : "PDF";
        await saveManuscriptFile({
          bookId: id,
          storageId,
          fileName: file.name,
          fileSize: file.size,
          format,
        });
        return { storageId, fileName: file.name, fileSize: file.size, format };
      } catch (err) {
        setSaveError(err.message || "Failed to upload manuscript");
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [ensureBookDraft, generateUploadUrl, saveManuscriptFile]
  );

  const uploadCover = useCallback(
    async (file, dimensions) => {
      setIsSaving(true);
      setSaveError(null);
      try {
        const id = await ensureBookDraft();
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!result.ok) throw new Error("Upload failed");
        const { storageId } = await result.json();
        await saveCoverFile({
          bookId: id,
          storageId,
          dimensions,
        });
        return { storageId };
      } catch (err) {
        setSaveError(err.message || "Failed to upload cover");
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [ensureBookDraft, generateUploadUrl, saveCoverFile]
  );

  const submit = useCallback(async () => {
    if (!bookId) throw new Error("No book to submit");
    setSaveError(null);
    try {
      await submitForReview({ bookId });
      return true;
    } catch (err) {
      setSaveError(err.message || "Submission failed");
      throw err;
    }
  }, [bookId, submitForReview]);

  const resubmit = useCallback(async () => {
    if (!bookId) throw new Error("No book to resubmit");
    setSaveError(null);
    try {
      await resubmitForReviewMut({ bookId });
      return true;
    } catch (err) {
      setSaveError(err.message || "Resubmission failed");
      throw err;
    }
  }, [bookId, resubmitForReviewMut]);

  return {
    bookId,
    book,
    isSaving,
    saveError,
    saveDraft,
    debouncedSave,
    uploadManuscript,
    uploadCover,
    submit,
    resubmit,
    ensureBookDraft,
  };
}

export function useAuthorBooks() {
  const books = useQuery(api.books.listByUser, {});
  return {
    books: books || [],
    isLoading: books === undefined,
  };
}
