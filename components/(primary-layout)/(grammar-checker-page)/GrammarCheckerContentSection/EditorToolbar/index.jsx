"use client";

import { cn } from "@/lib/utils";
import { Bold, Italic, List, Redo2, Underline, Undo2 } from "lucide-react";
import { useState, useEffect } from "react";

const EditorToolbar = ({ editor, onHistoryOperation }) => {
  const [isBulletListActive, setIsBulletListActive] = useState(false);
  const [isOrderedListActive, setIsOrderedListActive] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Update active states when editor state changes
  useEffect(() => {
    if (!editor) return;

    const updateActiveStates = () => {
      const bulletActive = editor.isActive("bulletList");
      const orderedActive = editor.isActive("orderedList");
      
      setIsBulletListActive(bulletActive);
      setIsOrderedListActive(orderedActive);
      
      // Update undo/redo states
      setCanUndo(editor.can().undo());
      setCanRedo(editor.can().redo());
    };

    // Update on selection change and content update
    editor.on("selectionUpdate", updateActiveStates);
    editor.on("update", updateActiveStates);
    editor.on("transaction", updateActiveStates);
    editor.on("create", updateActiveStates);
    
    // Initial update
    updateActiveStates();

    return () => {
      editor.off("selectionUpdate", updateActiveStates);
      editor.off("update", updateActiveStates);
      editor.off("transaction", updateActiveStates);
      editor.off("create", updateActiveStates);
    };
  }, [editor]);

  if (!editor) return null;

  const buttonClass =
    "flex items-center justify-center w-8 h-8 rounded cursor-pointer transition-colors hover:bg-accent hover:text-foreground";
  const activeClass = "bg-muted";

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleBold().run();
        }}
        className={cn(buttonClass, {
          [activeClass]: editor.isActive("bold"),
        })}
        title="Bold"
      >
        <Bold className="size-4" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus()?.toggleItalic()?.run();
        }}
        className={cn(buttonClass, {
          [activeClass]: editor.isActive("italic"),
        })}
        title="Italic"
      >
        <Italic className="size-4" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus()?.toggleUnderline()?.run();
        }}
        className={cn(buttonClass, {
          [activeClass]: editor.isActive("strike"),
        })}
        title="Strike"
      >
        <Underline className="size-4" />
      </button>

      <div className="bg-muted mx-1 h-6 w-px" />

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleBulletList().run();
          // Force immediate state update
          requestAnimationFrame(() => {
            setIsBulletListActive(editor.isActive("bulletList"));
            setIsOrderedListActive(editor.isActive("orderedList"));
          });
        }}
        className={cn(buttonClass, {
          [activeClass]: isBulletListActive,
        })}
        title="Bullet List"
      >
        <List className="size-4" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          editor.chain().focus().toggleOrderedList().run();
          // Force immediate state update
          requestAnimationFrame(() => {
            setIsBulletListActive(editor.isActive("bulletList"));
            setIsOrderedListActive(editor.isActive("orderedList"));
          });
        }}
        className={cn(buttonClass, {
          [activeClass]: isOrderedListActive,
        })}
        title="Numbered List"
      >
        <List className="size-4" />
      </button>

      <div className="bg-muted mx-1 h-6 w-px" />

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          
          if (!editor || !canUndo) {
            return;
          }
          
          // Set flag synchronously BEFORE executing to prevent Redux sync
          if (onHistoryOperation) {
            onHistoryOperation();
          }
          
          // Execute undo command - ensure editor is focused first
          try {
            const success = editor.chain().focus().undo().run();
            
            if (success) {
              // Force state update after undo to refresh redo availability
              setTimeout(() => {
                setCanRedo(editor.can().redo());
                setCanUndo(editor.can().undo());
              }, 0);
            }
          } catch (error) {
            console.error("[EditorToolbar] Undo error:", error);
          }
        }}
        disabled={!editor || !canUndo}
        className={cn(buttonClass, {
          "cursor-not-allowed opacity-50": !editor || !canUndo,
        })}
        title="Undo"
      >
        <Undo2 className="size-4" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          
          if (!editor || !canRedo) {
            return;
          }
          
          // Set flag synchronously BEFORE executing to prevent Redux sync
          // This is critical - must be set before any editor operation
          if (onHistoryOperation) {
            onHistoryOperation();
          }
          
          // Execute redo command - use chain() for proper command execution
          // The chain ensures the command is properly queued and executed
          try {
            // Execute redo - ensure editor is focused
            const success = editor.chain().focus().redo().run();
            
            if (success) {
              // Force state update after redo to refresh undo/redo availability
              setTimeout(() => {
                setCanRedo(editor.can().redo());
                setCanUndo(editor.can().undo());
              }, 0);
            } else {
              console.warn("[EditorToolbar] Redo command returned false");
            }
          } catch (error) {
            console.error("[EditorToolbar] Redo error:", error);
          }
        }}
        disabled={!editor || !canRedo}
        className={cn(buttonClass, {
          "cursor-not-allowed opacity-50": !editor || !canRedo,
        })}
        title="Redo"
      >
        <Redo2 className="size-4" />
      </button>
    </>
  );
};

export default EditorToolbar;
