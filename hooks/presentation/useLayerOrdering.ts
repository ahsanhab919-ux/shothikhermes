import { getElementFromIframe } from "@/lib/presentation/editing/editorUtils";
import { useAppDispatch } from "@/redux/hooks";
import { trackChange } from "@/redux/slices/slideEditSlice";
import { useCallback } from "react";

/**
 * Layer ordering hook for managing z-index of elements
 *
 * Features:
 * - Bring Forward: Increases z-index to be above next sibling
 * - Send Backward: Decreases z-index to be below previous sibling
 * - Bring to Front: Sets z-index to be above all siblings
 * - Send to Back: Sets z-index to be below all siblings (minimum 0)
 * - Tracks z-index changes in Redux for undo/redo
 * - Automatically calculates appropriate z-index values
 *
 * @param elementPath - CSS selector path to the element
 * @param slideId - The unique identifier of the slide being edited
 * @param elementId - Unique identifier of the element
 * @param iframeRef - Reference to the iframe containing the slide content
 * @returns Object with layer ordering functions
 *
 * @example
 * ```tsx
 * const { bringForward, sendBackward, bringToFront, sendToBack } =
 *   useLayerOrdering(
 *     selectedElement.elementPath,
 *     slideId,
 *     selectedElement.id,
 *     iframeRef
 *   );
 *
 * // Bring element forward
 * bringForward();
 *
 * // Bring element to front
 * bringToFront();
 * ```
 */
export function useLayerOrdering(
  elementPath: string,
  slideId: string,
  elementId: string,
  iframeRef: React.RefObject<HTMLIFrameElement>,
) {
  const dispatch = useAppDispatch();

  const getIframeDoc = useCallback(() => {
    return (
      iframeRef.current?.contentDocument ||
      iframeRef.current?.contentWindow?.document ||
      null
    );
  }, [iframeRef]);

  const getCurrentZIndex = useCallback(
    (element: HTMLElement): number => {
      const doc = getIframeDoc();
      if (!doc) return 0;
      const computed = (doc.defaultView || window).getComputedStyle(element);
      const zIndex = parseInt(computed.zIndex, 10);
      return isNaN(zIndex) ? 0 : zIndex;
    },
    [getIframeDoc],
  );

  const getAllSiblings = useCallback((element: HTMLElement): HTMLElement[] => {
    const parent = element.parentElement;
    if (!parent) return [];
    return Array.from(parent.children).filter(
      (child) => child !== element && child instanceof HTMLElement,
    ) as HTMLElement[];
  }, []);

  const bringForward = useCallback(() => {
    const doc = getIframeDoc();
    if (!doc) return false;

    const element = getElementFromIframe(iframeRef.current, elementPath);
    if (!element) return false;

    const currentZ = getCurrentZIndex(element);
    const siblings = getAllSiblings(element);

    // Find the next highest z-index among siblings
    let nextZ = currentZ + 1;
    for (const sibling of siblings) {
      const siblingZ = getCurrentZIndex(sibling);
      if (siblingZ >= nextZ) {
        nextZ = siblingZ + 1;
      }
    }

    // Apply new z-index
    element.style.zIndex = `${nextZ}`;

    // Track change
    dispatch(
      trackChange({
        slideId,
        elementId,
        type: "style",
        data: { zIndex: nextZ },
        previousData: { zIndex: currentZ },
      }),
    );

    return true;
  }, [
    elementPath,
    iframeRef,
    getIframeDoc,
    getCurrentZIndex,
    getAllSiblings,
    slideId,
    elementId,
    dispatch,
  ]);

  const sendBackward = useCallback(() => {
    const doc = getIframeDoc();
    if (!doc) return false;

    const element = getElementFromIframe(iframeRef.current, elementPath);
    if (!element) return false;

    const currentZ = getCurrentZIndex(element);
    const siblings = getAllSiblings(element);

    // Find the next lowest z-index among siblings
    let nextZ = currentZ - 1;
    for (const sibling of siblings) {
      const siblingZ = getCurrentZIndex(sibling);
      if (siblingZ < nextZ || (siblingZ === nextZ && nextZ > 0)) {
        nextZ = Math.min(siblingZ - 1, currentZ - 1);
      }
    }

    // Ensure z-index doesn't go below 0
    nextZ = Math.max(0, nextZ);

    // Apply new z-index
    element.style.zIndex = `${nextZ}`;

    // Track change
    dispatch(
      trackChange({
        slideId,
        elementId,
        type: "style",
        data: { zIndex: nextZ },
        previousData: { zIndex: currentZ },
      }),
    );

    return true;
  }, [
    elementPath,
    iframeRef,
    getIframeDoc,
    getCurrentZIndex,
    getAllSiblings,
    slideId,
    elementId,
    dispatch,
  ]);

  const bringToFront = useCallback(() => {
    const doc = getIframeDoc();
    if (!doc) return false;

    const element = getElementFromIframe(iframeRef.current, elementPath);
    if (!element) return false;

    const currentZ = getCurrentZIndex(element);
    const siblings = getAllSiblings(element);

    // Find the highest z-index and go above it
    let maxZ = currentZ;
    for (const sibling of siblings) {
      const siblingZ = getCurrentZIndex(sibling);
      if (siblingZ > maxZ) {
        maxZ = siblingZ;
      }
    }

    const newZ = maxZ + 1;

    // Apply new z-index
    element.style.zIndex = `${newZ}`;

    // Track change
    dispatch(
      trackChange({
        slideId,
        elementId,
        type: "style",
        data: { zIndex: newZ },
        previousData: { zIndex: currentZ },
      }),
    );

    return true;
  }, [
    elementPath,
    iframeRef,
    getIframeDoc,
    getCurrentZIndex,
    getAllSiblings,
    slideId,
    elementId,
    dispatch,
  ]);

  const sendToBack = useCallback(() => {
    const doc = getIframeDoc();
    if (!doc) return false;

    const element = getElementFromIframe(iframeRef.current, elementPath);
    if (!element) return false;

    const currentZ = getCurrentZIndex(element);
    const siblings = getAllSiblings(element);

    // Find the lowest z-index and go below it
    let minZ = currentZ;
    for (const sibling of siblings) {
      const siblingZ = getCurrentZIndex(sibling);
      if (siblingZ < minZ) {
        minZ = siblingZ;
      }
    }

    const newZ = Math.max(0, minZ - 1);

    // Apply new z-index
    element.style.zIndex = `${newZ}`;

    // Track change
    dispatch(
      trackChange({
        slideId,
        elementId,
        type: "style",
        data: { zIndex: newZ },
        previousData: { zIndex: currentZ },
      }),
    );

    return true;
  }, [
    elementPath,
    iframeRef,
    getIframeDoc,
    getCurrentZIndex,
    getAllSiblings,
    slideId,
    elementId,
    dispatch,
  ]);

  return {
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
  };
}
