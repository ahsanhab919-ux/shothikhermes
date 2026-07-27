import {
  generateId,
  getElementFromIframe,
} from "@/lib/presentation/editing/editorUtils";
import { useAppDispatch } from "@/redux/hooks";
import { trackChange } from "@/redux/slices/slideEditSlice";
import { useCallback, useState } from "react";

/**
 * Options for element duplication behavior
 */
interface UseElementDuplicationOptions {
  /** Horizontal offset for cloned element in pixels (default: 10px) */
  offsetX?: number;
  /** Vertical offset for cloned element in pixels (default: 10px) */
  offsetY?: number;
  /** Whether to auto-select the cloned element (default: false) */
  selectAfterClone?: boolean;
}

/**
 * Hook for duplicating elements with smart positioning
 *
 * Features:
 * - Deep clone with all attributes, styles, and children
 * - Generates unique IDs for cloned elements (prevents conflicts)
 * - Smart offset positioning (10px default) relative to original
 * - Tracks duplication in Redux history for undo/redo
 * - Auto-selects cloned element if configured
 * - Ensures original element also has ID (prevents path ambiguity)
 * - Multiple fallback strategies for element finding
 *
 * @param slideId - The unique identifier of the slide being edited
 * @param elementPath - CSS selector path to the element to duplicate
 * @param elementId - Unique identifier of the element
 * @param iframeRef - Reference to the iframe containing the slide content
 * @param options - Optional configuration for duplication behavior
 * @param options.offsetX - Horizontal offset in pixels (default: 10)
 * @param options.offsetY - Vertical offset in pixels (default: 10)
 * @param options.selectAfterClone - Auto-select cloned element (default: false)
 * @returns Object with duplication function and state
 *
 * @example
 * ```tsx
 * const duplication = useElementDuplication(
 *   slideId,
 *   selectedElement.elementPath,
 *   selectedElement.id,
 *   iframeRef,
 *   { offsetX: 20, offsetY: 20, selectAfterClone: true }
 * );
 *
 * // Duplicate element
 * duplication.duplicateElement();
 * ```
 */
export function useElementDuplication(
  slideId: string,
  elementPath: string,
  elementId: string,
  iframeRef: React.RefObject<HTMLIFrameElement>,
  options: UseElementDuplicationOptions = {},
) {
  const dispatch = useAppDispatch();
  const [isDuplicating, setIsDuplicating] = useState(false);

  const getIframeDoc = useCallback(() => {
    return (
      iframeRef.current?.contentDocument ||
      iframeRef.current?.contentWindow?.document ||
      null
    );
  }, [iframeRef]);

  const duplicateElement = useCallback(() => {
    const doc = getIframeDoc();
    if (!doc) {
      console.error("useElementDuplication: Cannot access iframe document");
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
      console.error("useElementDuplication: Element not found for path:", elementPath);
      return false;
    }

    setIsDuplicating(true);

    try {
      // Clone element (deep clone)
      const cloned = element.cloneNode(true) as HTMLElement;

      if (!cloned) {
        console.error("useElementDuplication: Failed to clone element");
        return false;
      }

      // Generate new ID for cloned element
      const newId = generateId("element");
      if (cloned.id) {
        cloned.id = `${cloned.id}-copy-${newId}`;
      } else {
        cloned.id = newId;
      }


      // CRITICAL FIX: Ensure original element also has an ID if it doesn't have one
      // This prevents path ambiguity when using querySelector
      if (!element.id) {
        const originalId = generateId("element");
        element.id = originalId;
      }

      // Remove selection classes from clone
      cloned.classList.remove("element-selected", "element-hovered");

      // Calculate offset position
      const computed = (doc.defaultView || window).getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const parentRect = element.parentElement?.getBoundingClientRect();

      // Get current position in iframe coordinates
      const currentLeft = parseFloat(computed.left) || 0;
      const currentTop = parseFloat(computed.top) || 0;

      // If element has no explicit position, calculate from bounding rect
      const leftFromParent = parentRect
        ? rect.left - parentRect.left
        : currentLeft;
      const topFromParent = parentRect ? rect.top - parentRect.top : currentTop;

      const offsetX = options.offsetX ?? 10;
      const offsetY = options.offsetY ?? 10;

      // Apply position to cloned element
      if (computed.position === "static") {
        cloned.style.position = "relative";
        cloned.style.left = `${offsetX}px`;
        cloned.style.top = `${offsetY}px`;
      } else {
        // For positioned elements, add offset to current position
        cloned.style.position = computed.position;
        cloned.style.left = `${leftFromParent + offsetX}px`;
        cloned.style.top = `${topFromParent + offsetY}px`;
      }

      // Ensure cloned element has same other positioning properties
      if (computed.right !== "auto") {
        cloned.style.right = computed.right;
      }
      if (computed.bottom !== "auto") {
        cloned.style.bottom = computed.bottom;
      }

      // Insert after original element
      const parent = element.parentElement;
      if (!parent) {
        console.error("useElementDuplication: Element has no parent");
        return false;
      }

      // Find the next sibling element (skip text nodes)
      let nextSibling: Node | null = element.nextSibling;
      while (nextSibling && nextSibling.nodeType !== 1) {
        // Not an element node, skip
        nextSibling = nextSibling.nextSibling;
      }

      // Insert the cloned element
      parent.insertBefore(cloned, nextSibling);

      // Clear selection from original element BEFORE selecting the clone
      // This prevents confusion where the original element still appears selected
      element.classList.remove("element-selected", "element-hovered");

      // Track change in Redux
      dispatch(
        trackChange({
          slideId,
          elementId: newId,
          type: "duplicate",
          data: {
            originalElementId: elementId,
            originalElementPath: elementPath,
            offsetX,
            offsetY,
          },
          previousData: {
            clonedElementHTML: cloned.outerHTML,
            originalElementHTML: element.outerHTML,
          },
        }),
      );


      // Always select the cloned element after duplication
      // This ensures the user can immediately interact with it
      if (iframeRef.current?.contentWindow) {
        // Use ID-based selector for reliable selection
        const clonedPath = cloned.id ? `#${cloned.id}` : getElementPath(cloned);


        // First, add selection class directly to the element
        cloned.classList.add("element-selected");

        // Then send selection message to update parent
        setTimeout(() => {
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              {
                type: "SELECT_ELEMENT",
                elementPath: clonedPath,
              },
              "*"
            );
          }
        }, 50); // Increased timeout to ensure DOM is ready
      }

      return true;
    } catch (error) {
      console.error("Error duplicating element:", error);
      return false;
    } finally {
      setIsDuplicating(false);
    }
  }, [
    slideId,
    elementId,
    elementPath,
    iframeRef,
    options,
    dispatch,
    getIframeDoc,
  ]);

  return {
    isDuplicating,
    duplicateElement,
  };
}

/**
 * Get element path for selection
 */
function getElementPath(element: HTMLElement): string {
  const path: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current !== current.ownerDocument?.body) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break;
    }

    if (current.className && typeof current.className === "string") {
      const classes = current.className
        .split(" ")
        .filter((c) => c && c !== "element-selected" && c !== "element-hovered")
        .slice(0, 3)
        .join(".");
      if (classes) {
        selector += `.${classes}`;
      }
    }

    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (child) => child.tagName === current?.tagName,
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current);
        selector += `:nth-of-type(${index + 1})`;
      }
    }

    path.unshift(selector);
    current = parent;
  }

  return path.join(" > ");
}
