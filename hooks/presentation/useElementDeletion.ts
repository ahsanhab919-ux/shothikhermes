import { getElementFromIframe } from "@/lib/presentation/editing/editorUtils";
import { useAppDispatch } from "@/redux/hooks";
import { trackChange } from "@/redux/slices/slideEditSlice";
import { useCallback, useState } from "react";

/**
 * Options for element deletion behavior
 */
interface UseElementDeletionOptions {
  /** Optional callback when element is successfully deleted */
  onDelete?: (elementId: string) => void;
  /** Whether to show confirmation dialog before deletion (default: true) */
  requireConfirmation?: boolean;
}

/**
 * Hook for handling element deletion with undo support
 *
 * Features:
 * - Stores complete element data (outerHTML, position, parent) before deletion
 * - Tracks deletion in Redux history for undo/redo
 * - Supports confirmation dialog to prevent accidental deletions
 * - Multiple fallback strategies for element finding (path, ID, selected class)
 * - Handles edge cases (text nodes, non-element nodes, body/html protection)
 *
 * @param slideId - The unique identifier of the slide being edited
 * @param elementPath - CSS selector path to the element to delete
 * @param elementId - Unique identifier of the element
 * @param iframeRef - Reference to the iframe containing the slide content
 * @param options - Optional configuration for deletion behavior
 * @param options.onDelete - Callback when element is successfully deleted
 * @param options.requireConfirmation - Whether to show confirmation dialog (default: true)
 * @returns Object with deletion functions and state
 *
 * @example
 * ```tsx
 * const deletion = useElementDeletion(
 *   slideId,
 *   selectedElement.elementPath,
 *   selectedElement.id,
 *   iframeRef,
 *   { requireConfirmation: true }
 * );
 *
 * // Delete element
 * deletion.deleteElement();
 *
 * // Check if confirmation dialog is showing
 * if (deletion.showConfirmDialog) {
 *   // Show confirmation UI
 * }
 *
 * // Confirm deletion
 * deletion.confirmDelete();
 * ```
 */
export function useElementDeletion(
  slideId: string,
  elementPath: string,
  elementId: string,
  iframeRef: React.RefObject<HTMLIFrameElement>,
  options: UseElementDeletionOptions = {},
) {
  const dispatch = useAppDispatch();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const getIframeDoc = useCallback(() => {
    return (
      iframeRef.current?.contentDocument ||
      iframeRef.current?.contentWindow?.document ||
      null
    );
  }, [iframeRef]);

  const deleteElement = useCallback(() => {
    const doc = getIframeDoc();
    if (!doc) {
      console.error("useElementDeletion: Cannot access iframe document");
      return false;
    }


    // Try to find element by path
    let element = getElementFromIframe(iframeRef.current, elementPath);

    // If element not found by path, try to find by ID if available
    if (!element && elementId) {
      element = doc.getElementById(elementId);
    }

    // If still not found, try to find by class name with element-selected
    if (!element) {
      const selectedElements = doc.querySelectorAll(".element-selected");
      if (selectedElements.length === 1) {
        element = selectedElements[0] as HTMLElement;
      }
    }

    if (!element) {
      console.error("useElementDeletion: Element not found for path:", elementPath);
      return false;
    }

    // Prevent deleting body/html
    if (element === doc.body || element === doc.documentElement) {
      console.warn("Cannot delete body or html element");
      return false;
    }

    setIsDeleting(true);

    try {
      // Store element data for undo
      const parentElement = element.parentElement;

      // Find next sibling element (skip text nodes, comments, etc.)
      let nextSiblingElement: HTMLElement | null = null;
      let nextSibling = element.nextSibling;
      while (nextSibling && !nextSiblingElement) {
        if (
          nextSibling.nodeType === 1 && // ELEMENT_NODE
          nextSibling instanceof HTMLElement
        ) {
          nextSiblingElement = nextSibling;
        } else {
          nextSibling = nextSibling.nextSibling;
        }
      }

      const elementData = {
        outerHTML: element.outerHTML,
        parentPath: parentElement ? getElementPath(parentElement) : null,
        nextSiblingPath: nextSiblingElement
          ? getElementPath(nextSiblingElement)
          : null,
        elementPath,
      };

      // Remove selection class before deletion
      element.classList.remove("element-selected", "element-hovered");

      // Remove element from DOM
      const parent = element.parentElement;
      if (parent) {
        parent.removeChild(element);
      } else {
        console.warn("[debug info removed]");
        return false;
      }

      // Track change in Redux
      dispatch(
        trackChange({
          slideId,
          elementId,
          type: "delete",
          data: { deleted: true },
          previousData: elementData,
        }),
      );


      // Call onDelete callback
      options.onDelete?.(elementId);

      return true;
    } catch (error) {
      console.error("Error deleting element:", error);
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [
    slideId,
    elementId,
    elementPath,
    iframeRef,
    dispatch,
    options,
    getIframeDoc,
  ]);

  const handleDelete = useCallback(() => {
    if (options.requireConfirmation !== false) {
      setShowConfirmDialog(true);
    } else {
      deleteElement();
    }
  }, [options.requireConfirmation, deleteElement]);

  const confirmDelete = useCallback(() => {
    setShowConfirmDialog(false);
    deleteElement();
  }, [deleteElement]);

  const cancelDelete = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  return {
    isDeleting,
    showConfirmDialog,
    handleDelete,
    confirmDelete,
    cancelDelete,
    deleteElement, // Direct delete without confirmation
  };
}

/**
 * Get element path for storing reference
 */
function getElementPath(element: HTMLElement | null): string | null {
  if (!element) return null;

  const path: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current !== current.ownerDocument?.body) {
    // Skip non-element nodes (Text, Comment, etc.)
    if (!current.tagName || typeof current.tagName !== "string") {
      // If it's not an element, try to get the parent element
      const parent = current.parentElement;
      if (parent) {
        current = parent;
        continue;
      } else {
        break;
      }
    }

    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break; // ID is unique, stop here
    }

    if (current.className && typeof current.className === "string") {
      const classes = current.className
        .split(" ")
        .filter(
          (c) =>
            c &&
            c !== "element-selected" &&
            c !== "element-hovered" &&
            c !== "element-editing",
        )
        .slice(0, 3)
        .join(".");
      if (classes) {
        selector += `.${classes}`;
      }
    }

    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (child): child is HTMLElement =>
          child instanceof HTMLElement && child.tagName === current?.tagName,
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current);
        if (index >= 0) {
          selector += `:nth-of-type(${index + 1})`;
        }
      }
    }

    path.unshift(selector);
    current = parent;
  }

  return path.length > 0 ? path.join(" > ") : null;
}
