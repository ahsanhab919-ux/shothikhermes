import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import type { Change, ElementData } from "@/redux/slices/slideEditSlice";
import {
  redo,
  selectCanRedo,
  selectCanUndo,
  selectChangeHistory,
  selectCurrentHistoryIndex,
  selectEditingSlide,
  setSelectedElement,
  trackChange,
  trackPerformance,
  undo,
} from "@/redux/slices/slideEditSlice";
import { useCallback, useEffect, useMemo } from "react";
import { toast } from "react-toastify";

/**
 * Hook for tracking and managing change history
 * Provides undo/redo functionality with DOM manipulation
 *
 * @param slideId - The unique identifier of the slide being edited
 * @param iframeRef - Reference to the iframe element containing the slide content
 * @returns Object containing undo/redo functions and state
 * @returns {Function} undoChange - Function to undo the last change
 * @returns {Function} redoChange - Function to redo the last undone change
 * @returns {boolean} canUndo - Whether undo is available
 * @returns {boolean} canRedo - Whether redo is available
 *
 * @example
 * ```tsx
 * const { undoChange, redoChange, canUndo, canRedo } = useChangeTracking(slideId, iframeRef);
 *
 * // Undo last change
 * if (canUndo) {
 *   undoChange();
 * }
 *
 * // Redo last undone change
 * if (canRedo) {
 *   redoChange();
 * }
 * ```
 */
export function useChangeTracking(
  slideId: string,
  iframeRef: React.RefObject<HTMLIFrameElement>,
) {
  const dispatch = useAppDispatch();

  const changeHistory = useAppSelector(selectChangeHistory(slideId));
  const canUndo = useAppSelector(selectCanUndo(slideId));
  const canRedo = useAppSelector(selectCanRedo(slideId));
  const currentHistoryIndex = useAppSelector(
    selectCurrentHistoryIndex(slideId),
  );
  const editingSlide = useAppSelector(selectEditingSlide(slideId));

  /**
   * Get the iframe's document object
   * @returns The iframe document or null if not available
   */
  const getIframeDoc = useCallback((): Document | null => {
    return (
      iframeRef.current?.contentDocument ||
      iframeRef.current?.contentWindow?.document ||
      null
    );
  }, [iframeRef]);

  /**
   * Enhanced element finder with multiple fallback strategies
   * Tries to find element by path, ID, or selected class
   *
   * @param elementPath - CSS selector path to the element
   * @param elementId - Optional element ID as fallback
   * @returns The found HTMLElement or null if not found
   */
  const findElement = useCallback(
    (
      elementPath: string | undefined,
      elementId?: string,
    ): HTMLElement | null => {
      const doc = getIframeDoc();
      if (!doc) return null;

      // Strategy 1: Try elementPath if provided (most reliable)
      if (elementPath) {
        try {
          const element = doc.querySelector(elementPath) as HTMLElement;
          if (element) return element;
        } catch (error) {
          console.warn("Failed to query element by path:", error);
        }
      }

      // Strategy 2: Try elementId as ID selector
      if (elementId) {
        try {
          const element = doc.getElementById(elementId);
          if (element) return element as HTMLElement;
        } catch (error) {
          console.warn("Failed to query element by ID:", error);
        }
      }

      // Strategy 3: Try selected class (fallback)
      try {
        const element = doc.querySelector(".element-selected") as HTMLElement;
        if (element) return element;
      } catch (error) {
        console.warn("Failed to query element by selected class:", error);
      }

      return null;
    },
    [getIframeDoc],
  );

  /**
   * Extract element path from change data
   * Handles different change types (delete, duplicate, etc.)
   *
   * @param change - The change object to extract path from
   * @param isUndo - Whether this is an undo operation (affects path extraction for duplicate)
   * @returns The element path or undefined if not available
   */
  const getElementPathFromChange = useCallback(
    (change: Change, isUndo: boolean = false): string | undefined => {
      // For delete changes, elementPath is in previousData
      if (change.type === "delete" && change.previousData?.elementPath) {
        return change.previousData.elementPath as string;
      }

      // For duplicate changes
      if (change.type === "duplicate") {
        if (isUndo) {
          // For undo, we need the cloned element (use elementId from change)
          return change.elementId ? `#${change.elementId}` : undefined;
        } else {
          // For redo, we need the original element path
          return change.data.originalElementPath as string | undefined;
        }
      }

      // For other changes, try to construct path from elementId
      if (change.elementId) {
        return `#${change.elementId}`;
      }

      return undefined;
    },
    [],
  );

  /**
   * Create ElementData from HTMLElement
   */
  const createElementData = useCallback(
    (element: HTMLElement, elementPath: string): ElementData => {
      const doc = getIframeDoc();
      const win = doc?.defaultView || window;
      const rect = element.getBoundingClientRect();
      const computed = win.getComputedStyle(element);

      return {
        id: element.id || "",
        tagName: element.tagName.toLowerCase(),
        className: element.className || null,
        textContent: element.textContent?.substring(0, 100) || "",
        elementPath,
        boundingRect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
        computedStyles: {
          display: computed.display,
          position: computed.position,
          width: computed.width,
          height: computed.height,
          color: computed.color,
          fontSize: computed.fontSize,
          fontFamily: computed.fontFamily,
          fontWeight: computed.fontWeight,
          textAlign: computed.textAlign,
          backgroundColor: computed.backgroundColor,
          margin: computed.margin,
          padding: computed.padding,
          border: computed.border,
          borderRadius: computed.borderRadius,
          zIndex: computed.zIndex,
        },
      };
    },
    [getIframeDoc],
  );

  /**
   * Generate element path from element (helper for selection sync)
   */
  const generateElementPath = useCallback((element: HTMLElement): string => {
    // If element has ID, use it
    if (element.id) {
      return `#${element.id}`;
    }

    // Otherwise, generate a simple path
    // This is a simplified version - in production you might want the full path
    const tag = element.tagName.toLowerCase();
    const classes = element.className
      ? `.${element.className
          .split(" ")
          .filter((c) => !c.startsWith("element-"))
          .join(".")}`
      : "";
    return `${tag}${classes}`;
  }, []);

  /**
   * Sync selection after undo/redo
   */
  const syncSelectionAfterUndoRedo = useCallback(
    (change: Change, isUndo: boolean): void => {
      let elementPath: string | undefined;
      let elementId: string | undefined = change.elementId;

      // Special handling for duplicate changes
      if (change.type === "duplicate") {
        if (isUndo) {
          // Undo: Select the original element (was duplicated)
          elementPath = change.data.originalElementPath as string | undefined;
          elementId = change.data.originalElementId as string | undefined;
        } else {
          // Redo: Select the cloned element (was just created)
          elementPath = `#${change.elementId}`;
          elementId = change.elementId;
        }
      } else {
        // For other changes, use standard path resolution
        elementPath = getElementPathFromChange(change, isUndo);
      }

      const element = findElement(elementPath, elementId);

      if (element) {
        // Element exists, select it
        const actualPath = elementPath || generateElementPath(element);
        const elementData = createElementData(element, actualPath);
        dispatch(setSelectedElement({ slideId, element: elementData }));

        // Send selection message to iframe
        iframeRef.current?.contentWindow?.postMessage(
          {
            type: "SELECT_ELEMENT",
            elementPath: actualPath,
          },
          "*",
        );
      } else {
        // Element doesn't exist, clear selection
        dispatch(setSelectedElement({ slideId, element: null }));
      }
    },
    [
      findElement,
      createElementData,
      dispatch,
      slideId,
      iframeRef,
      getElementPathFromChange,
      generateElementPath,
    ],
  );

  /**
   * Revert text change
   */
  const revertTextChange = useCallback(
    (change: Change): boolean => {
      const elementPath = getElementPathFromChange(change, true);
      const element = findElement(elementPath, change.elementId);
      if (!element) {
        console.error("Cannot revert text: Element not found", change);
        toast.error("Cannot undo: Element not found");
        return false;
      }

      const previousHtml = change.previousData?.html as string | undefined;
      if (!previousHtml) {
        console.error("Cannot revert text: No previous HTML", change);
        toast.error("Cannot undo: Invalid change data");
        return false;
      }

      element.innerHTML = previousHtml;
      return true;
    },
    [findElement, getElementPathFromChange],
  );

  /**
   * Reapply text change
   */
  const reapplyTextChange = useCallback(
    (change: Change): boolean => {
      const elementPath = getElementPathFromChange(change, false);
      const element = findElement(elementPath, change.elementId);
      if (!element) {
        console.error("Cannot reapply text: Element not found", change);
        toast.error("Cannot redo: Element not found");
        return false;
      }

      const html = change.data.html as string | undefined;
      if (!html) {
        console.error("Cannot reapply text: No HTML data", change);
        toast.error("Cannot redo: Invalid change data");
        return false;
      }

      element.innerHTML = html;
      return true;
    },
    [findElement, getElementPathFromChange],
  );

  /**
   * Revert position change
   */
  const revertPositionChange = useCallback(
    (change: Change): boolean => {
      const elementPath = getElementPathFromChange(change, true);
      const element = findElement(elementPath, change.elementId);
      if (!element) {
        console.error("Cannot revert position: Element not found", change);
        toast.error("Cannot undo: Element not found");
        return false;
      }

      const previousLeft = change.previousData?.left as number | undefined;
      const previousTop = change.previousData?.top as number | undefined;

      if (previousLeft === undefined || previousTop === undefined) {
        console.error("Cannot revert position: Invalid previous data", change);
        toast.error("Cannot undo: Invalid change data");
        return false;
      }

      // Clear transform if present
      element.style.transform = "";
      element.style.willChange = "";

      // Set position
      element.style.left = `${previousLeft}px`;
      element.style.top = `${previousTop}px`;

      return true;
    },
    [findElement, getElementPathFromChange],
  );

  /**
   * Reapply position change
   */
  const reapplyPositionChange = useCallback(
    (change: Change): boolean => {
      const elementPath = getElementPathFromChange(change, false);
      const element = findElement(elementPath, change.elementId);
      if (!element) {
        console.error("Cannot reapply position: Element not found", change);
        toast.error("Cannot redo: Element not found");
        return false;
      }

      const left = change.data.left as number | undefined;
      const top = change.data.top as number | undefined;

      if (left === undefined || top === undefined) {
        console.error("Cannot reapply position: Invalid data", change);
        toast.error("Cannot redo: Invalid change data");
        return false;
      }

      // Clear transform if present
      element.style.transform = "";
      element.style.willChange = "";

      // Set position
      element.style.left = `${left}px`;
      element.style.top = `${top}px`;

      return true;
    },
    [findElement, getElementPathFromChange],
  );

  /**
   * Revert style change (z-index)
   */
  const revertStyleChange = useCallback(
    (change: Change): boolean => {
      const elementPath = getElementPathFromChange(change, true);
      const element = findElement(elementPath, change.elementId);
      if (!element) {
        console.error("Cannot revert style: Element not found", change);
        toast.error("Cannot undo: Element not found");
        return false;
      }

      const previousZIndex = change.previousData?.zIndex;

      if (previousZIndex === null || previousZIndex === undefined) {
        // Remove z-index
        element.style.zIndex = "";
      } else {
        element.style.zIndex = String(previousZIndex);
      }

      return true;
    },
    [findElement, getElementPathFromChange],
  );

  /**
   * Reapply style change (z-index)
   */
  const reapplyStyleChange = useCallback(
    (change: Change): boolean => {
      const elementPath = getElementPathFromChange(change, false);
      const element = findElement(elementPath, change.elementId);
      if (!element) {
        console.error("Cannot reapply style: Element not found", change);
        toast.error("Cannot redo: Element not found");
        return false;
      }

      const zIndex = change.data.zIndex;

      if (zIndex === null || zIndex === undefined) {
        element.style.zIndex = "";
      } else {
        element.style.zIndex = String(zIndex);
      }

      return true;
    },
    [findElement],
  );

  /**
   * Revert delete change (restore element)
   */
  const revertDeleteChange = useCallback(
    (change: Change): boolean => {
      const doc = getIframeDoc();
      if (!doc) {
        console.error("Cannot revert delete: Iframe not ready");
        toast.error("Cannot undo: Editor not ready");
        return false;
      }

      const previousData = change.previousData;
      if (!previousData) {
        console.error("Cannot revert delete: No previous data", change);
        toast.error("Cannot undo: Invalid change data");
        return false;
      }

      const outerHTML = previousData.outerHTML as string | undefined;
      const parentPath = previousData.parentPath as string | null | undefined;
      const nextSiblingPath = previousData.nextSiblingPath as
        | string
        | null
        | undefined;

      if (!outerHTML) {
        console.error("Cannot revert delete: No outerHTML", change);
        toast.error("Cannot undo: Invalid change data");
        return false;
      }

      // Find parent element
      let parent: HTMLElement | null = null;
      if (parentPath) {
        parent = doc.querySelector(parentPath) as HTMLElement;
      }
      if (!parent) {
        parent = doc.body;
      }

      // Parse and create element from outerHTML
      const tempDiv = doc.createElement("div");
      tempDiv.innerHTML = outerHTML;
      const restoredElement = tempDiv.firstElementChild as HTMLElement;

      if (!restoredElement) {
        console.error("Cannot revert delete: Failed to parse HTML", change);
        toast.error("Cannot undo: Failed to restore element");
        return false;
      }

      // Find insertion point
      let nextSibling: HTMLElement | null = null;
      if (nextSiblingPath) {
        nextSibling = doc.querySelector(nextSiblingPath) as HTMLElement;
      }

      // Insert element
      if (nextSibling && nextSibling.parentNode === parent) {
        parent.insertBefore(restoredElement, nextSibling);
      } else {
        parent.appendChild(restoredElement);
      }

      return true;
    },
    [getIframeDoc],
  );

  /**
   * Reapply delete change (delete element)
   */
  const reapplyDeleteChange = useCallback(
    (change: Change): boolean => {
      const elementPath = getElementPathFromChange(change, false);
      const element = findElement(elementPath, change.elementId);
      if (!element) {
        console.error("Cannot reapply delete: Element not found", change);
        toast.error("Cannot redo: Element not found");
        return false;
      }

      const parent = element.parentElement;
      if (!parent) {
        console.error("Cannot reapply delete: Element has no parent", change);
        toast.error("Cannot redo: Element has no parent");
        return false;
      }

      parent.removeChild(element);
      return true;
    },
    [findElement, getElementPathFromChange],
  );

  /**
   * Revert duplicate change (remove clone)
   */
  const revertDuplicateChange = useCallback(
    (change: Change): boolean => {
      // The cloned element has the elementId from the change
      // For undo, we need to find the cloned element (use elementId as ID selector)
      const clonedElement = findElement(
        `#${change.elementId}`,
        change.elementId,
      );
      if (!clonedElement) {
        console.error("Cannot revert duplicate: Clone not found", change);
        toast.error("Cannot undo: Cloned element not found");
        return false;
      }

      const parent = clonedElement.parentElement;
      if (!parent) {
        console.error("Cannot revert duplicate: Clone has no parent", change);
        toast.error("Cannot undo: Cloned element has no parent");
        return false;
      }

      // Remove selection class
      clonedElement.classList.remove("element-selected", "element-hovered");

      // Remove element
      parent.removeChild(clonedElement);
      return true;
    },
    [findElement],
  );

  /**
   * Reapply duplicate change (restore clone)
   */
  const reapplyDuplicateChange = useCallback(
    (change: Change): boolean => {
      const doc = getIframeDoc();
      if (!doc) {
        console.error("Cannot reapply duplicate: Iframe not ready");
        toast.error("Cannot redo: Editor not ready");
        return false;
      }

      const clonedElementHTML = change.previousData?.clonedElementHTML as
        | string
        | undefined;
      const originalElementPath = change.data.originalElementPath as
        | string
        | undefined;

      if (!clonedElementHTML || !originalElementPath) {
        console.error("Cannot reapply duplicate: Invalid data", change);
        toast.error("Cannot redo: Invalid change data");
        return false;
      }

      // Find original element
      const originalElement = findElement(originalElementPath);
      if (!originalElement) {
        console.error(
          "Cannot reapply duplicate: Original element not found",
          change,
        );
        toast.error("Cannot redo: Original element not found");
        return false;
      }

      // Parse and create cloned element
      const tempDiv = doc.createElement("div");
      tempDiv.innerHTML = clonedElementHTML;
      const clonedElement = tempDiv.firstElementChild as HTMLElement;

      if (!clonedElement) {
        console.error("Cannot reapply duplicate: Failed to parse HTML", change);
        toast.error("Cannot redo: Failed to restore cloned element");
        return false;
      }

      // Insert clone after original
      const parent = originalElement.parentElement;
      if (!parent) {
        console.error(
          "Cannot reapply duplicate: Original has no parent",
          change,
        );
        toast.error("Cannot redo: Original element has no parent");
        return false;
      }

      // Insert after original
      if (originalElement.nextSibling) {
        parent.insertBefore(clonedElement, originalElement.nextSibling);
      } else {
        parent.appendChild(clonedElement);
      }

      // Apply offset relative to original element
      const offsetX = (change.data.offsetX as number) || 10;
      const offsetY = (change.data.offsetY as number) || 10;

      // Get original element's computed position
      const win = doc.defaultView || window;
      const originalRect = originalElement.getBoundingClientRect();
      const originalStyle = win.getComputedStyle(originalElement);
      const originalLeft = parseFloat(originalStyle.left) || originalRect.left;
      const originalTop = parseFloat(originalStyle.top) || originalRect.top;

      // Apply offset to cloned element
      clonedElement.style.position = originalStyle.position || "relative";
      clonedElement.style.left = `${originalLeft + offsetX}px`;
      clonedElement.style.top = `${originalTop + offsetY}px`;

      return true;
    },
    [getIframeDoc, findElement, getElementPathFromChange],
  );

  /**
   * Main router function to apply/revert changes
   */
  const applyChange = useCallback(
    (change: Change, isUndo: boolean): boolean => {
      let success = false;

      switch (change.type) {
        case "text":
          success = isUndo
            ? revertTextChange(change)
            : reapplyTextChange(change);
          break;

        case "position":
          success = isUndo
            ? revertPositionChange(change)
            : reapplyPositionChange(change);
          break;

        case "style":
          success = isUndo
            ? revertStyleChange(change)
            : reapplyStyleChange(change);
          break;

        case "delete":
          success = isUndo
            ? revertDeleteChange(change)
            : reapplyDeleteChange(change);
          break;

        case "duplicate":
          success = isUndo
            ? revertDuplicateChange(change)
            : reapplyDuplicateChange(change);
          break;

        default:
          console.error("Unknown change type:", change.type);
          toast.error(
            `Cannot ${isUndo ? "undo" : "redo"}: Unknown change type`,
          );
          return false;
      }

      if (success) {
        // Sync selection after successful operation
        syncSelectionAfterUndoRedo(change, isUndo);
      }

      return success;
    },
    [
      revertTextChange,
      reapplyTextChange,
      revertPositionChange,
      reapplyPositionChange,
      revertStyleChange,
      reapplyStyleChange,
      revertDeleteChange,
      reapplyDeleteChange,
      revertDuplicateChange,
      reapplyDuplicateChange,
      syncSelectionAfterUndoRedo,
    ],
  );

  /**
   * Track a new change
   */
  const trackNewChange = useCallback(
    (
      elementId: string,
      type: Change["type"],
      data: Record<string, unknown>,
      previousData?: Record<string, unknown>,
    ) => {
      const startTime = performance.now();

      dispatch(
        trackChange({
          slideId,
          elementId,
          type,
          data,
          previousData,
        }),
      );

      // Track performance
      const endTime = performance.now();
      dispatch(trackPerformance({ operationTime: endTime - startTime }));
    },
    [dispatch, slideId],
  );

  /**
   * Undo the last change in the history
   *
   * @returns {boolean} True if undo was successful, false otherwise
   *
   * @example
   * ```tsx
   * if (canUndo) {
   *   const success = undoChange();
   *   if (success) {
   *     
   *   }
   * }
   * ```
   */
  const undoChange = useCallback(() => {
    if (!canUndo || !editingSlide) return false;

    // Get change at current index
    const change = editingSlide.changeHistory[currentHistoryIndex];
    if (!change) {
      console.error(
        "Cannot undo: Change not found at index",
        currentHistoryIndex,
      );
      toast.error("Cannot undo: Change not found");
      return false;
    }

    // Apply revert logic
    const success = applyChange(change, true);

    if (success) {
      // Update Redux index
      dispatch(undo({ slideId }));
    }

    return success;
  }, [
    canUndo,
    editingSlide,
    currentHistoryIndex,
    applyChange,
    dispatch,
    slideId,
  ]);

  /**
   * Redo the last undone change in the history
   *
   * @returns {boolean} True if redo was successful, false otherwise
   *
   * @example
   * ```tsx
   * if (canRedo) {
   *   const success = redoChange();
   *   if (success) {
   *     
   *   }
   * }
   * ```
   */
  const redoChange = useCallback(() => {
    if (!canRedo || !editingSlide) return false;

    // Get next change (after current index)
    const nextIndex = currentHistoryIndex + 1;
    const change = editingSlide.changeHistory[nextIndex];
    if (!change) {
      console.error("Cannot redo: Change not found at index", nextIndex);
      toast.error("Cannot redo: Change not found");
      return false;
    }

    // Apply reapply logic
    const success = applyChange(change, false);

    if (success) {
      // Update Redux index
      dispatch(redo({ slideId }));
    }

    return success;
  }, [
    canRedo,
    editingSlide,
    currentHistoryIndex,
    applyChange,
    dispatch,
    slideId,
  ]);

  /**
   * Keyboard shortcuts for undo/redo
   */
  useEffect(() => {
    // Only enable when editing mode is active
    if (!editingSlide?.isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input/textarea/contentEditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return; // Don't intercept if typing
      }

      // Check for Ctrl/Cmd + Z (undo)
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undoChange();
      }

      // Check for Ctrl/Cmd + Shift + Z (redo)
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redoChange();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editingSlide?.isEditing, undoChange, redoChange]);

  /**
   * Get current change (for undo/redo)
   */
  const getCurrentChange = useCallback((): Change | null => {
    if (changeHistory.length === 0 || currentHistoryIndex < 0) return null;
    return changeHistory[currentHistoryIndex] || null;
  }, [changeHistory, currentHistoryIndex]);

  /**
   * Get change by index
   */
  const getChangeByIndex = useCallback(
    (index: number): Change | null => {
      if (index < 0 || index >= changeHistory.length) return null;
      return changeHistory[index] || null;
    },
    [changeHistory],
  );

  /**
   * Get changes for a specific element
   */
  const getElementChanges = useCallback(
    (elementId: string): Change[] => {
      return changeHistory.filter((change) => change.elementId === elementId);
    },
    [changeHistory],
  );

  /**
   * Get changes by type
   */
  const getChangesByType = useCallback(
    (type: Change["type"]): Change[] => {
      return changeHistory.filter((change) => change.type === type);
    },
    [changeHistory],
  );

  // Memoized statistics
  const statistics = useMemo(
    () => ({
      totalChanges: changeHistory.length,
      textChanges: changeHistory.filter((c) => c.type === "text").length,
      styleChanges: changeHistory.filter((c) => c.type === "style").length,
      positionChanges: changeHistory.filter((c) => c.type === "position")
        .length,
      deleteChanges: changeHistory.filter((c) => c.type === "delete").length,
      duplicateChanges: changeHistory.filter((c) => c.type === "duplicate")
        .length,
    }),
    [changeHistory],
  );

  return {
    // State
    changeHistory,
    canUndo,
    canRedo,
    currentHistoryIndex,
    statistics,

    // Actions
    trackNewChange,
    undoChange,
    redoChange,

    // Getters
    getCurrentChange,
    getChangeByIndex,
    getElementChanges,
    getChangesByType,
  };
}
