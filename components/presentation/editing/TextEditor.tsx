"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSlideEditor } from "@/hooks/presentation/useSlideEditor";
import { useTextEditing } from "@/hooks/presentation/useTextEditing";
import type { ElementData } from "@/redux/slices/slideEditSlice";
import { Save, X } from "lucide-react";
import { useEffect, useRef } from "react";

interface TextEditorProps {
  slideId: string;
  element: ElementData;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  onClose: () => void;
}

/**
 * Text Editor Component
 * Provides inline text editing with validation and formatting
 */
export function TextEditor({
  slideId,
  element,
  iframeRef,
  onClose,
}: TextEditorProps) {
  const { setMode } = useSlideEditor(slideId, iframeRef);
  const textEditor = useTextEditing(
    slideId,
    element.id,
    element.elementPath,
    iframeRef,
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-start editing when component mounts
  useEffect(() => {
    if (textEditor.startEditing()) {
      setMode("text");
    }

    // Focus textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle save
  const handleSave = () => {
    textEditor.stopEditing(true);
    setMode(null);
    onClose();
  };

  // Handle cancel
  const handleCancel = () => {
    textEditor.stopEditing(false);
    setMode(null);
    onClose();
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        handleSave();
      }

      // Escape to cancel
      if (event.key === "Escape") {
        event.preventDefault();
        handleCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate character and word count
  const characterCount = textEditor.textContent.length;
  const wordCount = textEditor.textContent
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  return (
    <Card className="border-primary py-2 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Edit Text</CardTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleCancel}
            aria-label="Close editor"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Text Input */}
        <div className="space-y-2">
          <Label htmlFor="text-editor-input">Text Content</Label>
          <Textarea
            id="text-editor-input"
            ref={textareaRef}
            value={textEditor.textContent}
            onChange={(e) => textEditor.handleTextChange(e.target.value)}
            placeholder="Enter text..."
            className="min-h-[100px] resize-none font-mono text-sm"
            aria-label="Text editor input"
            aria-describedby="text-editor-help"
          />
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="bg-muted/50 rounded-md border p-3 text-sm">
            {textEditor.textContent || (
              <span className="text-muted-foreground italic">No text</span>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-2">
          {/* Keyboard shortcuts hint */}
          <span className="text-muted-foreground text-xs">
            <kbd className="bg-muted rounded border px-1.5 py-0.5 text-xs">
              Ctrl/Cmd + S
            </kbd>{" "}
            to save
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            aria-label="Cancel editing"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            aria-label="Save changes"
          >
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

/**
 * Inline Text Editor (for simpler use cases)
 * Provides a minimal inline editing experience
 */
export function InlineTextEditor({
  slideId,
  element,
  iframeRef,
  onClose,
}: TextEditorProps) {
  const { setMode } = useSlideEditor(slideId, iframeRef);
  const textEditor = useTextEditing(
    slideId,
    element.id,
    element.elementPath,
    iframeRef,
  );

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-start editing when component mounts
  useEffect(() => {
    if (textEditor.startEditing()) {
      setMode("text");
    }

    // Focus input
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle save
  const handleSave = () => {
    textEditor.stopEditing(true);
    setMode(null);
    onClose();
  };

  // Handle cancel
  const handleCancel = () => {
    textEditor.stopEditing(false);
    setMode(null);
    onClose();
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <div className="bg-background flex items-center gap-2 rounded-md border p-2 shadow-lg">
      <Input
        ref={inputRef}
        value={textEditor.textContent}
        onChange={(e) => textEditor.handleTextChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        className="flex-1"
        placeholder="Enter text..."
        aria-label="Inline text editor"
      />
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleCancel}
        aria-label="Cancel"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
