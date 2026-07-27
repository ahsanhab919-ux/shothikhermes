import type { ElementData } from "@/redux/slices/slideEditSlice";
import { useCallback, useEffect, useRef } from "react";

/**
 * Hook for managing element selection in iframe
 * Handles communication between parent and iframe for element selection
 */
export function useElementSelection(
  iframeRef: React.RefObject<HTMLIFrameElement>,
  isEditMode: boolean,
  onElementSelected?: (element: ElementData) => void,
) {
  const selectionRef = useRef<ElementData | null>(null);

  /**
   * Get element from iframe by path
   */
  const getElementByPath = useCallback(
    (elementPath: string): HTMLElement | null => {
      const iframeDoc =
        iframeRef.current?.contentDocument ||
        iframeRef.current?.contentWindow?.document;

      if (!iframeDoc) return null;

      try {
        return iframeDoc.querySelector(elementPath) as HTMLElement;
      } catch (error) {
        console.error("Error selecting element by path:", error);
        return null;
      }
    },
    [iframeRef],
  );

  /**
   * Get current selected element from iframe
   */
  const getSelectedElement = useCallback((): ElementData | null => {
    return selectionRef.current;
  }, []);

  /**
   * Select element programmatically
   */
  const selectElementByPath = useCallback(
    (elementPath: string) => {
      const element = getElementByPath(elementPath);

      if (!element) {
        console.warn("Element not found for path:", elementPath);
        return null;
      }

      // Trigger selection in iframe
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          {
            type: "SELECT_ELEMENT",
            elementPath,
          },
          "*",
        );
      }

      return element;
    },
    [iframeRef, getElementByPath],
  );

  /**
   * Listen for element selection messages from iframe
   */
  useEffect(() => {
    if (!isEditMode) return;

    const handleMessage = (event: MessageEvent) => {
      // Security: Only accept messages from same origin
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === "ELEMENT_SELECTED") {
        const data = event.data.data;

        const elementData: ElementData = {
          id: data.element.id || `element-${Date.now()}`,
          tagName: data.element.tagName,
          className: data.element.className,
          textContent: data.textContent,
          elementPath: data.elementPath,
          boundingRect: data.boundingRect,
          computedStyles: data.computedStyles,
        };

        selectionRef.current = elementData;

        if (onElementSelected) {
          onElementSelected(elementData);
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [isEditMode, onElementSelected]);

  /**
   * Clear selection
   */
  const clearSelection = useCallback(() => {
    selectionRef.current = null;

    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "CLEAR_SELECTION",
        },
        "*",
      );
    }
  }, [iframeRef]);

  return {
    getElementByPath,
    getSelectedElement,
    selectElementByPath,
    clearSelection,
  };
}
