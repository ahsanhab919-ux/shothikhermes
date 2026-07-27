"use client";

/**
 * useUndoRedo Hook
 * 
 * Enhanced undo/redo functionality for slide editing
 * Wraps useChangeTracking with keyboard shortcuts and UI integration
 */

import { useCallback, useEffect } from 'react';
import { useChangeTracking } from './useChangeTracking';

interface UseUndoRedoOptions {
  slideId: string;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  onUndo?: () => void;
  onRedo?: () => void;
}

interface UseUndoRedoReturn {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  undoStackSize: number;
  redoStackSize: number;
}

export function useUndoRedo({
  slideId,
  iframeRef,
  onUndo,
  onRedo,
}: UseUndoRedoOptions): UseUndoRedoReturn {
  const {
    undoChange,
    redoChange,
    canUndo,
    canRedo,
    changeHistory,
    currentHistoryIndex,
  } = useChangeTracking(slideId, iframeRef);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Z = Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          undoChange();
          onUndo?.();
        }
      }

      // Ctrl/Cmd + Shift + Z = Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        if (canRedo) {
          redoChange();
          onRedo?.();
        }
      }

      // Ctrl/Cmd + Y = Redo (alternative)
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        if (canRedo) {
          redoChange();
          onRedo?.();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undoChange, redoChange, onUndo, onRedo]);

  const undo = useCallback(() => {
    if (canUndo) {
      undoChange();
      onUndo?.();
    }
  }, [canUndo, undoChange, onUndo]);

  const redo = useCallback(() => {
    if (canRedo) {
      redoChange();
      onRedo?.();
    }
  }, [canRedo, redoChange, onRedo]);

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    undoStackSize: currentHistoryIndex + 1,
    redoStackSize: changeHistory.length - currentHistoryIndex - 1,
  };
}

export default useUndoRedo;
