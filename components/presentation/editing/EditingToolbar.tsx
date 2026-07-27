"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAlignmentGuides } from "@/hooks/presentation/useAlignmentGuides";
import { useChangeTracking } from "@/hooks/presentation/useChangeTracking";
import { useDragAndDrop } from "@/hooks/presentation/useDragAndDrop";
import { useElementDeletion } from "@/hooks/presentation/useElementDeletion";
import { useElementDuplication } from "@/hooks/presentation/useElementDuplication";
import { useKeyboardNavigation } from "@/hooks/presentation/useKeyboardNavigation";
import { useLayerOrdering } from "@/hooks/presentation/useLayerOrdering";
import { useSlideEditor } from "@/hooks/presentation/useSlideEditor";
import { useTextEditing } from "@/hooks/presentation/useTextEditing";
import type { ElementData } from "@/redux/slices/slideEditSlice";
import {
  ArrowDown,
  Copy,
  Grid3x3,
  Layers,
  Move,
  Redo2,
  Save,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
import { memo, useEffect, useState } from "react";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
// import { useState } from "react";
// import { StyleEditor } from "./StyleEditor";

/**
 * Props for EditingToolbar component
 */
interface EditingToolbarProps {
  /** The unique identifier of the slide being edited */
  slideId: string;
  /** The currently selected element data or null if no element selected */
  selectedElement: ElementData | null;
  /** Reference to the iframe containing the slide content */
  iframeRef: React.RefObject<HTMLIFrameElement>;
  /** Scale factor of the iframe (default: 1) */
  iframeScale?: number;
  /** Optional callback when element is deleted */
  onElementDelete?: () => void;
  /** Optional callback when element is duplicated */
  onElementDuplicate?: () => void;
  /** Optional callback when save is triggered */
  onSave?: () => void;
  /** Optional callback when grid toggle state changes */
  onGridToggle?: (enabled: boolean) => void;
  /** Optional callback when alignment guides change */
  onAlignmentGuidesChange?: (guides: any[]) => void;
}

/**
 * Editing Toolbar Component
 *
 * Provides a comprehensive set of editing controls for selected slide elements.
 * Includes buttons for undo/redo, text editing, drag mode, layer ordering,
 * deletion, duplication, and grid toggle.
 *
 * Features:
 * - Undo/Redo functionality with keyboard shortcuts
 * - Text editing mode toggle
 * - Drag & drop mode toggle
 * - Layer ordering (bring forward/send backward)
 * - Element deletion with confirmation
 * - Element duplication
 * - Grid overlay toggle
 * - Alignment guides integration
 *
 * @param props - EditingToolbar component props
 * @returns The editing toolbar UI
 *
 * @example
 * ```tsx
 * <EditingToolbar
 *   slideId="slide-1"
 *   selectedElement={selectedElement}
 *   iframeRef={iframeRef}
 *   iframeScale={0.5}
 *   onGridToggle={(enabled) => setGridEnabled(enabled)}
 * />
 * ```
 */
export const EditingToolbar = memo(function EditingToolbar({
  slideId,
  selectedElement,
  iframeRef,
  iframeScale = 1,
  onElementDelete,
  onElementDuplicate,
  onSave,
  onGridToggle,
  onAlignmentGuidesChange,
}: EditingToolbarProps) {
  const { setMode, editingMode, clearSelection } = useSlideEditor(
    slideId,
    iframeRef,
  );
  const { undoChange, redoChange, canUndo, canRedo } = useChangeTracking(
    slideId,
    iframeRef,
  );
  const [gridEnabled, setGridEnabled] = useState(false);

  // Style editing - commented out for now
  // const [showStyleEditor, setShowStyleEditor] = useState(false);

  // Text editing hook for inline editing
  const textEditing = useTextEditing(
    slideId,
    selectedElement?.id || "",
    selectedElement?.elementPath || "",
    iframeRef,
  );

  // Drag & drop when in position mode
  const drag = useDragAndDrop(
    selectedElement?.elementPath || "",
    iframeRef,
    iframeScale,
    {
      gridSize: 8,
      constrainToSlide: true,
      slideId,
      elementId: selectedElement?.id || "",
    },
  );

  // Keyboard navigation when in position mode
  const keyboardNav = useKeyboardNavigation(
    selectedElement?.elementPath || "",
    slideId,
    selectedElement?.id || "",
    iframeRef,
    iframeScale,
    editingMode === "position" && !!selectedElement,
    { gridSize: 8, constrainToSlide: true },
  );

  // Layer ordering
  const layerOrdering = useLayerOrdering(
    selectedElement?.elementPath || "",
    slideId,
    selectedElement?.id || "",
    iframeRef,
  );

  // Element deletion
  const elementDeletion = useElementDeletion(
    slideId,
    selectedElement?.elementPath || "",
    selectedElement?.id || "",
    iframeRef,
    {
      requireConfirmation: true,
      onDelete: () => {
        clearSelection(); // Clear selection after deletion
      },
    },
  );

  // Element duplication
  const elementDuplication = useElementDuplication(
    slideId,
    selectedElement?.elementPath || "",
    selectedElement?.id || "",
    iframeRef,
    {
      offsetX: 10,
      offsetY: 10,
      selectAfterClone: true, // Auto-select cloned element so user can immediately delete/edit it
    },
  );

  // Alignment guides when dragging
  const alignmentGuides = useAlignmentGuides(
    selectedElement?.elementPath || "",
    iframeRef,
    iframeScale,
    drag.isDragging,
    { threshold: 5, enabled: editingMode === "position" },
  );

  // Notify parent of alignment guides changes
  useEffect(() => {
    if (onAlignmentGuidesChange) {
      onAlignmentGuidesChange(alignmentGuides.guides);
    }
  }, [alignmentGuides.guides, onAlignmentGuidesChange]);

  useEffect(() => {
    if (!selectedElement) return;
    if (editingMode === "position") {
      const cleanup = drag.enable();
      return cleanup;
    }
  }, [editingMode, selectedElement]);

  // Handle grid toggle
  const handleGridToggle = () => {
    const newState = !gridEnabled;
    setGridEnabled(newState);
    if (onGridToggle) {
      onGridToggle(newState);
    }
  };

  // Handle text editing - start inline editing
  const handleTextEdit = () => {
    if (selectedElement && textEditing.startEditing()) {
      setMode("text");
    }
  };

  // Handle save text editing
  const handleSaveText = () => {
    textEditing.stopEditing(true);
    setMode(null);
  };

  // Handle cancel text editing
  const handleCancelText = () => {
    textEditing.stopEditing(false);
    setMode(null);
  };

  // Handle style editing - commented out for now
  // const handleStyleEdit = () => {
  //   if (selectedElement) {
  //     setMode("style");
  //     setShowStyleEditor(true);
  //   }
  // };

  // Handle close style editor - commented out for now
  // const handleCloseStyleEditor = () => {
  //   setShowStyleEditor(false);
  //   setMode(null);
  // };

  // Handle position editing
  const handlePositionEdit = () => {
    setMode("position");
  };

  // Handle delete - uses hook
  const handleDelete = () => {
    elementDeletion.handleDelete();
  };

  // Handle duplicate - uses hook
  const handleDuplicate = () => {
    elementDuplication.duplicateElement();
  };

  if (!selectedElement) {
    return null;
  }

  // Style editor - commented out for now
  // if (showStyleEditor && selectedElement) {
  //   return (
  //     <div className="absolute top-4 right-4 z-50">
  //       <StyleEditor
  //         slideId={slideId}
  //         element={selectedElement}
  //         iframeRef={iframeRef}
  //         onClose={handleCloseStyleEditor}
  //       />
  //     </div>
  //   );
  // }

  return (
    <TooltipProvider>
      <div className="bg-background absolute bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border p-2 shadow-lg">
        {/* Undo/Redo */}
        <div className="flex items-center gap-1 border-r pr-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={undoChange}
                disabled={!canUndo}
                aria-label="Undo"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={redoChange}
                disabled={!canRedo}
                aria-label="Redo"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
          </Tooltip>
        </div>

        {/* Editing Actions */}
        <div className="flex items-center gap-1 border-r pr-2">
          {editingMode === "text" ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    size="icon-sm"
                    onClick={handleSaveText}
                    aria-label="Save text"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save (Ctrl/Cmd+S)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleCancelText}
                    aria-label="Cancel editing"
                  >
                    ×
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Cancel (Esc)</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleTextEdit}
                  aria-label="Edit text"
                >
                  <Type className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit Text</TooltipContent>
            </Tooltip>
          )}

          {/* Style editing - commented out for now */}
          {/* <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={editingMode === "style" ? "default" : "ghost"}
                size="icon-sm"
                onClick={handleStyleEdit}
                aria-label="Edit styles"
              >
                <Palette className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit Styles</TooltipContent>
          </Tooltip> */}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={editingMode === "position" ? "default" : "ghost"}
                size="icon-sm"
                onClick={handlePositionEdit}
                aria-label="Move element"
              >
                <Move className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Move Element</TooltipContent>
          </Tooltip>

          {/* Grid Toggle - only show in position mode */}
          {editingMode === "position" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={gridEnabled ? "default" : "ghost"}
                  size="icon-sm"
                  onClick={handleGridToggle}
                  aria-label="Toggle grid"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Grid (8px)</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Layer Ordering - only show in position mode */}
        {editingMode === "position" && (
          <div className="flex items-center gap-1 border-r pr-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={layerOrdering.bringForward}
                  aria-label="Bring forward"
                >
                  <Layers className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bring Forward</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={layerOrdering.sendBackward}
                  aria-label="Send backward"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send Backward</TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Element Actions */}
        <div className="flex items-center gap-1 border-r pr-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleDuplicate}
                aria-label="Duplicate element"
                disabled={elementDuplication.isDuplicating}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Duplicate Element</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleDelete}
                aria-label="Delete element"
                disabled={elementDeletion.isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete Element</TooltipContent>
          </Tooltip>
        </div>

        {/* Save */}
        {onSave && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="icon-sm"
                onClick={onSave}
                aria-label="Save changes"
              >
                <Save className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save Changes</TooltipContent>
          </Tooltip>
        )}

        {/* Close */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={clearSelection}
              aria-label="Close toolbar"
            >
              ×
            </Button>
          </TooltipTrigger>
          <TooltipContent>Close</TooltipContent>
        </Tooltip>
      </div>

      {/* Delete Confirmation Dialog */}
      {selectedElement && (
        <DeleteConfirmDialog
          open={elementDeletion.showConfirmDialog}
          elementTag={selectedElement.tagName}
          elementText={selectedElement.textContent || ""}
          onConfirm={elementDeletion.confirmDelete}
          onCancel={elementDeletion.cancelDelete}
        />
      )}
    </TooltipProvider>
  );
});
