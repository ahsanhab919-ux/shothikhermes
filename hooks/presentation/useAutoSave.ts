import { debounce } from "@/lib/presentation/editing/editorUtils";
import { extractModifiedContent } from "@/lib/presentationEditScripts";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  markSaved,
  selectEditingSlide,
  setSaveStatus,
} from "@/redux/slices/slideEditSlice";
import { SlideEditService } from "@/services/presentation/slideEditService";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseAutoSaveOptions {
  enabled?: boolean;
  debounceMs?: number; // Default: 30000 (30s)
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
  onConflict?: (conflict: ConflictData) => void;
}

export interface ConflictData {
  slideId: string;
  localHtml: string;
  serverHtml: string | null;
  conflictedAt: Date;
  resolve: (choice: "local" | "server") => void;
}

/**
 * Auto-save hook for slide editing
 * - Debounced auto-save (30s default)
 * - Track save status (idle, saving, saved, error)
 * - Handle unsaved changes indicator
 * - Auto-save on window unload
 * - Manual save trigger
 * - Conflict resolution: on 409, exposes ConflictData with resolve() callback
 */
export function useAutoSave(
  slideId: string,
  presentationId: string,
  iframeRef: React.RefObject<HTMLIFrameElement>,
  options: UseAutoSaveOptions = {},
  slideIndex?: number,
) {
  const dispatch = useAppDispatch();
  const editingSlide = useAppSelector(selectEditingSlide(slideId));

  const [saveStatus, setLocalSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [conflictData, setConflictData] = useState<ConflictData | null>(null);

  const hasUnsavedChanges = editingSlide?.hasUnsavedChanges ?? false;
  const isSavingRef = useRef(false);

  const fetchServerHtml = useCallback(async (): Promise<string | null> => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL + "/slide";
      const res = await fetch(
        `${apiUrl}/slides/${presentationId}/${slideIndex ?? 0}`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );
      if (!res.ok) return null;
      const data = await res.json();
      return data?.htmlContent ?? null;
    } catch {
      return null;
    }
  }, [presentationId, slideIndex]);

  /**
   * Save slide changes to backend
   */
  const saveSlide = useCallback(async () => {
    if (!iframeRef.current || !iframeRef.current.contentDocument) {
      console.error("useAutoSave: Cannot access iframe document");
      return false;
    }

    if (isSavingRef.current) {
      return false;
    }

    isSavingRef.current = true;
    setLocalSaveStatus("saving");
    dispatch(setSaveStatus({ slideId, status: "saving" }));

    try {
      // Extract clean HTML from iframe
      const htmlContent = extractModifiedContent(iframeRef.current);

      if (!htmlContent) {
        throw new Error("Failed to extract modified content from iframe");
      }


      // Save to backend
      const result = await SlideEditService.saveSlide({
        slideId,
        presentationId,
        htmlContent,
        slideIndex,
        metadata: {
          lastEdited: new Date().toISOString(),
          editedBy: "user",
        },
      });

      if (result.success) {
        setLocalSaveStatus("saved");
        setLastSavedAt(new Date());
        setErrorMessage(null);
        setConflictData(null);
        dispatch(
          markSaved({
            slideId,
            savedAt: result.savedAt,
            version: result.version,
          }),
        );
        dispatch(setSaveStatus({ slideId, status: "saved" }));
        options.onSaveSuccess?.();
        return true;
      } else if (result.conflict) {
        setLocalSaveStatus("error");
        const conflictMsg =
          result.error || "Conflict: Slide was modified by another user";
        setErrorMessage(conflictMsg);
        dispatch(
          setSaveStatus({ slideId, status: "error", error: conflictMsg }),
        );

        const serverHtml = await fetchServerHtml();

        const resolveConflict = async (choice: "local" | "server") => {
          setConflictData(null);
          if (choice === "server") {
            setLocalSaveStatus("idle");
            setErrorMessage(null);
            dispatch(setSaveStatus({ slideId, status: "idle" }));
            return;
          }

          isSavingRef.current = true;
          setLocalSaveStatus("saving");
          dispatch(setSaveStatus({ slideId, status: "saving" }));

          try {
            const forceResult = await SlideEditService.saveSlide({
              slideId,
              presentationId,
              htmlContent,
              slideIndex,
              metadata: {
                lastEdited: new Date().toISOString(),
                editedBy: "user",
              },
            });

            if (forceResult.success) {
              setLocalSaveStatus("saved");
              setLastSavedAt(new Date());
              setErrorMessage(null);
              dispatch(
                markSaved({
                  slideId,
                  savedAt: forceResult.savedAt,
                  version: forceResult.version,
                }),
              );
              dispatch(setSaveStatus({ slideId, status: "saved" }));
              options.onSaveSuccess?.();
            } else {
              throw new Error(forceResult.error || "Force save failed");
            }
          } catch (err) {
            const msg =
              err instanceof Error ? err.message : "Failed to apply resolution";
            setLocalSaveStatus("error");
            setErrorMessage(msg);
            dispatch(setSaveStatus({ slideId, status: "error", error: msg }));
            options.onSaveError?.(err as Error);
          } finally {
            isSavingRef.current = false;
          }
        };

        const conflict: ConflictData = {
          slideId,
          localHtml: htmlContent,
          serverHtml,
          conflictedAt: new Date(),
          resolve: resolveConflict,
        };

        setConflictData(conflict);
        options.onConflict?.(conflict);

        return false;
      } else {
        throw new Error(result.error || "Save failed");
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Unknown error occurred";
      setLocalSaveStatus("error");
      setErrorMessage(errorMsg);
      dispatch(setSaveStatus({ slideId, status: "error", error: errorMsg }));
      console.error("useAutoSave: Save error:", error);
      options.onSaveError?.(error as Error);
      return false;
    } finally {
      isSavingRef.current = false;
    }
  }, [
    slideId,
    presentationId,
    iframeRef,
    dispatch,
    options,
    slideIndex,
    fetchServerHtml,
  ]);

  // Debounced auto-save function
  const debouncedSave = useRef(
    debounce(() => {
      if (hasUnsavedChanges && options.enabled !== false) {
        saveSlide();
      }
    }, options.debounceMs ?? 30000),
  );

  // Auto-save on changes
  useEffect(() => {
    if (options.enabled === false) {
      return;
    }

    if (hasUnsavedChanges) {
      debouncedSave.current();
    }
  }, [hasUnsavedChanges, options.enabled, debouncedSave]);

  // Auto-save on window unload
  useEffect(() => {
    if (options.enabled === false) {
      return;
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isSavingRef.current) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";

        // Attempt to save immediately
        saveSlide().catch((error) => {
          console.error("useAutoSave: Failed to save on unload:", error);
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges, options.enabled, saveSlide]);

  // Reset save status after showing "saved" for a bit
  useEffect(() => {
    if (saveStatus === "saved") {
      const timer = setTimeout(() => {
        setLocalSaveStatus("idle");
      }, 2000); // Show "saved" for 2 seconds

      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  // Reset error status after showing error for 2 seconds (skip if conflict is pending)
  useEffect(() => {
    if (saveStatus === "error" && !conflictData) {
      const timer = setTimeout(() => {
        setLocalSaveStatus("idle");
        setErrorMessage(null);
        dispatch(setSaveStatus({ slideId, status: "idle" }));
      }, 2000); // Show error for 2 seconds

      return () => clearTimeout(timer);
    }
  }, [saveStatus, slideId, dispatch, conflictData]);

  return {
    saveStatus,
    lastSavedAt,
    errorMessage,
    conflictData,
    saveSlide,
    isSaving: saveStatus === "saving",
    isSaved: saveStatus === "saved",
    hasError: saveStatus === "error",
    hasUnsavedChanges,
  };
}
