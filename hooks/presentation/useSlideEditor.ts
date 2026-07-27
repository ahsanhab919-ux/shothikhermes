import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import type { ElementData } from "@/redux/slices/slideEditSlice";
import {
  selectActiveOperation,
  selectEditingSlide,
  setEditingMode,
  setSelectedElement,
  startEditing,
  stopEditing,
} from "@/redux/slices/slideEditSlice";
import { useCallback, useEffect } from "react";

/**
 * Main orchestrator hook for slide editing
 * Manages edit mode, element selection, and coordinates editing operations
 */
export function useSlideEditor(
  slideId: string,
  iframeRef: React.RefObject<HTMLIFrameElement>,
) {
  const dispatch = useAppDispatch();
  const editingSlide = useAppSelector(selectEditingSlide(slideId));
  const activeOperation = useAppSelector(selectActiveOperation(slideId));

  // Track if edit mode is active
  const isEditing = editingSlide?.isEditing ?? false;
  const hasUnsavedChanges = editingSlide?.hasUnsavedChanges ?? false;

  // Track selected element
  const selectedElement = activeOperation?.selectedElement ?? null;
  const editingMode = activeOperation?.editingMode ?? null;

  /**
   * Start editing mode
   */
  const startEditMode = useCallback(() => {
    dispatch(startEditing({ slideId }));

    // Enable edit mode in iframe
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "TOGGLE_EDIT_MODE",
          enabled: true,
        },
        "*",
      );
    }
  }, [dispatch, slideId, iframeRef]);

  /**
   * Stop editing mode
   */
  const stopEditMode = useCallback(() => {
    dispatch(stopEditing({ slideId }));

    // Disable edit mode in iframe
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "TOGGLE_EDIT_MODE",
          enabled: false,
        },
        "*",
      );
    }
  }, [dispatch, slideId, iframeRef]);

  /**
   * Select an element for editing
   */
  const selectElement = useCallback(
    (element: ElementData | null) => {
      dispatch(setSelectedElement({ slideId, element }));
    },
    [dispatch, slideId],
  );

  /**
   * Set the current editing mode
   */
  const setMode = useCallback(
    (mode: "text" | "style" | "position" | null) => {
      dispatch(setEditingMode({ slideId, mode }));
    },
    [dispatch, slideId],
  );

  /**
   * Clear selection
   */
  const clearSelection = useCallback(() => {
    dispatch(setSelectedElement({ slideId, element: null }));
    dispatch(setEditingMode({ slideId, mode: null }));
  }, [dispatch, slideId]);

  /**
   * Handle element selection from iframe
   */
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "ELEMENT_SELECTED" && isEditing) {
        const elementData: ElementData = {
          id: event.data.data.element.id || `element-${Date.now()}`,
          tagName: event.data.data.element.tagName,
          className: event.data.data.element.className,
          textContent: event.data.data.textContent,
          elementPath: event.data.data.elementPath,
          boundingRect: event.data.data.boundingRect,
          computedStyles: event.data.data.computedStyles,
        };

        selectElement(elementData);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [isEditing, selectElement]);

  return {
    // State
    isEditing,
    hasUnsavedChanges,
    selectedElement,
    editingMode,

    // Actions
    startEditMode,
    stopEditMode,
    selectElement,
    setMode,
    clearSelection,
  };
}
