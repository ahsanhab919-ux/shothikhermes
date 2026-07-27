import "./plagiarism-editor.css";

import { Extension } from "@tiptap/core";
import Placeholder from "@tiptap/extension-placeholder";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useMemo, useRef } from "react";

import ExcludedRegionHighlightExtension, {
  ExcludedDecorationRegion,
} from "./extensions/excludedRegionHighlight";
import PlagiarismHighlightExtension, {
  PlagiarismDecoration,
} from "./extensions/plagiarismHighlight";

type HighlightRange = {
  start: number;
  end: number;
  similarity: number;
  isExact?: boolean;
  matchId?: string;
};

interface PlagiarismInputEditorProps {
  value: string;
  onChange: (nextValue: string) => void;
  highlights?: HighlightRange[];
  excludedRegions?: ExcludedDecorationRegion[];
  placeholder?: string;
  disabled?: boolean;
  onHighlightClick?: (matchId: string) => void;
}

const PlainTextOnly = Extension.create({
  name: "plainTextOnly",
  addKeyboardShortcuts() {
    return {
      "Mod-b": () => true,
      "Mod-i": () => true,
      "Mod-u": () => true,
      "Mod-Shift-x": () => true,
    };
  },
});

/**
 * Calculate similarity between two strings (0-1)
 * Uses word-based comparison for better handling of paraphrased content
 */
const calculateTextSimilarity = (str1: string, str2: string): number => {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;

  // Normalize strings
  const normalize = (text: string) => text.trim().toLowerCase().replace(/\s+/g, ' ');
  const norm1 = normalize(str1);
  const norm2 = normalize(str2);
  
  if (norm1 === norm2) return 1;

  // Word-based similarity
  const words1 = norm1.split(/\s+/).filter(w => w.length > 0);
  const words2 = norm2.split(/\s+/).filter(w => w.length > 0);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const commonWords = words1.filter(w => words2.includes(w));
  const totalWords = Math.max(words1.length, words2.length);
  
  return commonWords.length / totalWords;
};

/**
 * Find where a snippet text appears in the input text
 * Uses multiple strategies: exact match, API position verification, fuzzy matching
 */
const findSnippetInText = (
  snippet: string,
  inputText: string,
  apiStart?: number | null,
  apiEnd?: number | null,
): { start: number; end: number } | null => {
  if (!snippet || !inputText) return null;

  // Normalize texts for comparison
  const normalize = (text: string) => text.trim().replace(/\s+/g, ' ');
  const normalizedSnippet = normalize(snippet);
  const normalizedInput = normalize(inputText);

  // Strategy 1: Verify API-provided positions first (most reliable if correct)
  if (
    typeof apiStart === 'number' &&
    typeof apiEnd === 'number' &&
    apiStart >= 0 &&
    apiEnd > apiStart &&
    apiEnd <= inputText.length
  ) {
    const apiText = inputText.substring(apiStart, apiEnd);
    const similarity = calculateTextSimilarity(apiText, snippet);
    // If similarity is reasonable (at least 60%), use API positions
    if (similarity >= 0.6) {
      return { start: apiStart, end: apiEnd };
    }
  }

  // Strategy 2: Try exact match (case-insensitive, normalized)
  const snippetLower = normalizedSnippet.toLowerCase();
  const inputLower = normalizedInput.toLowerCase();
  const exactIndex = inputLower.indexOf(snippetLower);
  
  if (exactIndex !== -1) {
    // Convert normalized position back to original text position
    // This is approximate but works for most cases
    const beforeMatch = normalizedInput.substring(0, exactIndex);
    let originalPos = 0;
    let normalizedPos = 0;
    
    // Find position in original text by counting characters
    for (let i = 0; i < inputText.length && normalizedPos < exactIndex; i++) {
      if (inputText[i].match(/\s/)) {
        // Skip whitespace in normalized version
        if (normalizedPos < exactIndex) {
          originalPos = i + 1;
        }
      } else {
        normalizedPos++;
        if (normalizedPos <= exactIndex) {
          originalPos = i + 1;
        }
      }
    }
    
    const end = Math.min(inputText.length, originalPos + snippet.length);
    return { start: originalPos, end };
  }

  // Strategy 3: Fuzzy matching - find best substring match
  if (normalizedSnippet.length > 0 && normalizedInput.length >= normalizedSnippet.length) {
    let bestMatch: { start: number; end: number; similarity: number } | null = null;
    const snippetWords = normalizedSnippet.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    
    if (snippetWords.length > 0) {
      // Try sliding window approach
      const windowSize = Math.min(normalizedSnippet.length * 2, normalizedInput.length);
      
      for (let i = 0; i <= normalizedInput.length - snippetWords[0].length; i++) {
        const end = Math.min(i + windowSize, normalizedInput.length);
        const candidate = normalizedInput.substring(i, end);
        const similarity = calculateTextSimilarity(normalizedSnippet, candidate);
        
        if (!bestMatch || similarity > bestMatch.similarity) {
          // Convert normalized position to original text position
          let originalStart = 0;
          let normalizedCount = 0;
          
          for (let j = 0; j < inputText.length && normalizedCount < i; j++) {
            if (!inputText[j].match(/\s/)) {
              normalizedCount++;
            }
            if (normalizedCount <= i) {
              originalStart = j + 1;
            }
          }
          
          const originalEnd = Math.min(inputText.length, originalStart + snippet.length);
          
          bestMatch = {
            start: originalStart,
            end: originalEnd,
            similarity,
          };
        }
      }
    }
    
    if (bestMatch && bestMatch.similarity >= 0.7) {
      return { start: bestMatch.start, end: bestMatch.end };
    }
  }

  return null;
};

const computeDocDecorations = (
  doc: ProseMirrorNode,
  text: string,
  ranges: HighlightRange[] = [],
): PlagiarismDecoration[] => {
  if (!doc || !text || !ranges.length) return [];

  const charToPos: number[] = [];
  doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      for (let i = 0; i < node.text.length; i += 1) {
        charToPos.push(pos + i);
      }
    }
  });

  if (!charToPos.length) return [];

  const newlinePrefix = new Array<number>(text.length + 1).fill(0);
  for (let i = 0; i < text.length; i += 1) {
    newlinePrefix[i + 1] = newlinePrefix[i] + (text[i] === "\n" ? 1 : 0);
  }

  const adjustIndex = (index: number) => {
    const adjusted = index - newlinePrefix[index];
    return Math.max(0, Math.min(adjusted, charToPos.length));
  };

  return ranges
    .map((range) => {
      if (
        typeof range?.start !== "number" ||
        typeof range?.end !== "number" ||
        range.end <= range.start
      ) {
        return null;
      }

      const startIndex = adjustIndex(range.start);
      const endIndex = adjustIndex(range.end);

      if (startIndex >= endIndex) {
        return null;
      }

      const fromPos = charToPos[startIndex];
      const toPos = charToPos[endIndex - 1] + 1;

      if (typeof fromPos !== "number" || typeof toPos !== "number") {
        return null;
      }

      return {
        from: fromPos,
        to: toPos,
        similarity: range.similarity ?? 0,
        isExact: range.isExact,
        matchId: range.matchId,
      };
    })
    .filter(Boolean) as PlagiarismDecoration[];
};

const createHighlightsSignature = (highlights: HighlightRange[] = []) =>
  JSON.stringify(
    highlights
      .map((range) => [
        range?.start ?? null,
        range?.end ?? null,
        range?.similarity ?? null,
        range?.isExact ?? null,
        range?.matchId ?? null,
      ])
      .sort(),
  );

const PlagiarismInputEditor = ({
  value,
  onChange,
  highlights = [],
  excludedRegions = [],
  placeholder = "Enter your text here...",
  disabled = false,
  onHighlightClick,
}: PlagiarismInputEditorProps) => {
  const previousValueRef = useRef<string>(value);
  const highlightsSignature = useMemo(
    () => createHighlightsSignature(highlights),
    [highlights],
  );
  
  // Track mouse events to distinguish scrolling from text selection
  const mouseDownRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isScrollingRef = useRef(false);
  const isWheelingRef = useRef(false);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          bold: false,
          italic: false,
          strike: false,
          code: false,
          heading: false,
          blockquote: false,
          bulletList: false,
          orderedList: false,
        }),
        PlainTextOnly,
        Placeholder.configure({ 
          placeholder,
          emptyEditorClass: "is-editor-empty",
        }),
        PlagiarismHighlightExtension,
        ExcludedRegionHighlightExtension,
      ],
      editorProps: {
        attributes: {
          class:
            "tiptap w-full h-full focus:outline-none whitespace-pre-wrap text-sm leading-6 p-4 cursor-text",
          "data-placeholder": placeholder,
          role: "textbox",
          "aria-label": "Plagiarism checker text input",
          "aria-multiline": "true",
        },
        handleClick: (view, pos, event) => {
          // Ensure editor is focused on click
          if (view.dom) {
            view.dom.focus();
          }
          return false; // Let TipTap handle the click normally
        },
      },
      content: value,
      immediatelyRender: false,
      onUpdate({ editor: instance }) {
        if (disabled) return;
        const nextValue = instance.getText({ blockSeparator: "\n" });
        previousValueRef.current = nextValue;
        onChange(nextValue);
      },
    },
    [placeholder, disabled],
  );

  useEffect(() => {
    if (!editor) return;
    if (disabled) {
      editor.setEditable(false);
    } else {
      editor.setEditable(true);
    }
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor) return;
    const current = editor.getText({ blockSeparator: "\n" });
    if (current !== value) {
      editor.commands.setContent(value || "", { emitUpdate: false });
      previousValueRef.current = value;
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor) return;
    
    // Wait for editor to be ready and content to be set
    const updateHighlights = () => {
      try {
        const doc = editor.state.doc;
        const decorations = computeDocDecorations(doc, value, highlights);
        
        // Set highlights
        editor.commands.setPlagiarismHighlights(decorations);
        
        // Force a view update to ensure decorations are rendered
        requestAnimationFrame(() => {
          editor.view.dispatch(editor.state.tr);
          
          // Verify decorations are applied
        });
      } catch (error) {
        console.error("[Plagiarism Editor] Error updating highlights:", error);
      }
    };
    
    // Use a small delay to ensure editor content is synced
    const timeoutId = setTimeout(updateHighlights, 100);
    
    return () => clearTimeout(timeoutId);
  }, [editor, value, highlightsSignature, highlights]);

  useEffect(() => {
    if (!editor) return;

    const updateExcluded = () => {
      try {
        const doc = editor.state.doc;
        const validRegions = excludedRegions.filter(
          (r) =>
            r.from >= 0 &&
            r.to <= doc.content.size &&
            r.to > r.from
        );
        editor.commands.setExcludedRegions(validRegions);
      } catch {
        // Non-fatal: excluded region visualization is cosmetic
      }
    };

    const timeoutId = setTimeout(updateExcluded, 120);
    return () => clearTimeout(timeoutId);
  }, [editor, excludedRegions, value]);
  
  useEffect(() => {
    if (!editor || !onHighlightClick) return;

    let editorDom: HTMLElement | null = null;
    try {
      editorDom = editor.view.dom;
    } catch {
      return;
    }
    if (!editorDom) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const highlight = target.closest('[data-match-id]') as HTMLElement | null;
      if (highlight) {
        const matchId = highlight.getAttribute('data-match-id');
        if (matchId) {
          onHighlightClick(matchId);
        }
      }
    };

    editorDom.addEventListener('click', handleClick);
    return () => {
      editorDom?.removeEventListener('click', handleClick);
    };
  }, [editor, onHighlightClick]);

  useEffect(() => {
    if (!editor || disabled) return;
    
    let scrollTimeout: NodeJS.Timeout | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;
    let editorContainer: HTMLElement | null = null;
    let scrollContainer: HTMLElement | null = null;
    let isScrolling = false;
    let handleScroll: (() => void) | null = null;
    let editorDom: HTMLElement | null = null;
    let isSetup = false;
    
    // Wait for editor view to be available
    const setupScrollHandlers = () => {
      if (!editor || isSetup) return;
      
      // Safely check if editor view and DOM are available using try-catch
      // TipTap throws an error if view or view.dom is accessed before the view is mounted
      let dom: HTMLElement | null = null;
      try {
        // Directly access view.dom - TipTap getter will throw if not ready
        // Don't check editor.view first as that can also throw
        dom = editor.view.dom;
      } catch (error) {
        // Editor view not ready yet, retry after delay
        if (retryTimeout) clearTimeout(retryTimeout);
        retryTimeout = setTimeout(setupScrollHandlers, 100);
        return;
      }
      
      if (!dom) {
        // Retry after a short delay if view is not ready
        if (retryTimeout) clearTimeout(retryTimeout);
        retryTimeout = setTimeout(setupScrollHandlers, 100);
        return;
      }
      
      editorDom = dom;
      editorContainer = editorDom.closest('.plagiarism-editor') as HTMLElement;
      if (!editorContainer) {
        if (retryTimeout) clearTimeout(retryTimeout);
        retryTimeout = setTimeout(setupScrollHandlers, 100);
        return;
      }
      
      isSetup = true;
      
      // Find the parent scroll container (the one with overflow-y-auto)
      scrollContainer = editorContainer.parentElement;
      while (scrollContainer && !scrollContainer.classList.contains('overflow-y-auto') && scrollContainer !== document.body) {
        scrollContainer = scrollContainer.parentElement;
      }
      
      const handleScrollStart = () => {
        if (isScrolling || !editorContainer || !editorDom) return;
        isScrolling = true;
        
        // Add scrolling class to prevent text selection
        editorContainer.classList.add('scrolling');
        
        // Prevent text selection via inline styles as backup
        editorDom.style.userSelect = 'none';
        editorContainer.style.userSelect = 'none';
        
        // Clear any existing selection immediately
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
          selection.removeAllRanges();
        }
      };
      
      handleScroll = () => {
        handleScrollStart();
        
        // Clear timeout and reset after scroll stops
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }
        scrollTimeout = setTimeout(() => {
          isScrolling = false;
          if (editorContainer && editorDom) {
            editorContainer.classList.remove('scrolling');
            editorDom.style.userSelect = '';
            editorContainer.style.userSelect = '';
          }
          isWheelingRef.current = false;
        }, 150); // Re-enable selection 150ms after scroll stops
      };
      
      // Attach to both editor container and parent scroll container
      editorContainer.addEventListener('scroll', handleScroll, { passive: true });
      if (scrollContainer && scrollContainer !== editorContainer && scrollContainer !== document.body) {
        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      }
    };
    
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      setupScrollHandlers();
    });
    
    // Cleanup function
    return () => {
      isSetup = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
      }
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
        scrollTimeout = null;
      }
      if (handleScroll && editorContainer) {
        editorContainer.removeEventListener('scroll', handleScroll);
      }
      if (handleScroll && scrollContainer && scrollContainer !== editorContainer && scrollContainer !== document.body) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
      if (editorContainer) {
        editorContainer.classList.remove('scrolling');
      }
    };
  }, [editor, disabled]);

  // Handle mouse events to prevent text selection during scrolling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || !editor) return;
    
    // Don't interfere with clicks on the editor content - let TipTap handle them
    // Check if click is on the editor content area
    const target = e.target as HTMLElement;
    const isEditorContent = target.closest('.tiptap') || target.closest('.ProseMirror');
    
    // If clicking directly on editor content, don't track - let TipTap handle it
    if (isEditorContent) {
      // Reset any scroll tracking to allow normal editor interaction
      mouseDownRef.current = null;
      isScrollingRef.current = false;
      
      // Ensure userSelect is enabled for normal text input
      try {
        if (editor.view && editor.view.dom) {
          const editorDom = editor.view.dom;
          const container = editorDom.closest('.plagiarism-editor') as HTMLElement;
          if (container) {
            container.classList.remove('scrolling');
            editorDom.style.userSelect = '';
            container.style.userSelect = '';
          }
        }
      } catch {
        // Ignore errors
      }
      return;
    }
    
    // Only track mouse position for scroll detection on container, not editor content
    if (isWheelingRef.current) {
      return;
    }
    
    mouseDownRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
    isScrollingRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (disabled || !mouseDownRef.current || !editor) return;
    
    // Don't interfere if user is interacting with editor content
    const target = e.target as HTMLElement;
    const isEditorContent = target.closest('.tiptap') || target.closest('.ProseMirror');
    
    // If moving mouse over editor content, don't treat as scrolling
    // This allows normal text selection and cursor movement
    if (isEditorContent) {
      // Reset scroll tracking to allow normal editor interaction
      isScrollingRef.current = false;
      try {
        if (editor.view && editor.view.dom) {
          const editorDom = editor.view.dom;
          const container = editorDom.closest('.plagiarism-editor') as HTMLElement;
          if (container) {
            container.classList.remove('scrolling');
            editorDom.style.userSelect = '';
            container.style.userSelect = '';
          }
        }
      } catch {
        // Ignore errors
      }
      return;
    }
    
    const deltaX = Math.abs(e.clientX - mouseDownRef.current.x);
    const deltaY = Math.abs(e.clientY - mouseDownRef.current.y);
    
    // Only treat as scrolling if mouse moved significantly (especially vertically)
    // Use a higher threshold to avoid interfering with normal text selection
    // Vertical movement > 5px indicates scrolling (increased from 3px)
    if (deltaY > 5 || deltaX > 15) {
      isScrollingRef.current = true;
      // Prevent text selection during scroll, but only temporarily
      try {
        if (!editor.isDestroyed && editor.view && editor.view.dom) {
          const editorDom = editor.view.dom;
          const container = editorDom.closest('.plagiarism-editor') as HTMLElement;
          
          // Only set userSelect: none if we're actually scrolling
          // Use a timeout to ensure it's cleared even if mouseUp doesn't fire
          if (container) {
            container.classList.add('scrolling');
            editorDom.style.userSelect = 'none';
            container.style.userSelect = 'none';
            
            // Auto-clear after a short time to prevent stuck state
            setTimeout(() => {
              try {
                if (editor && !editor.isDestroyed && editor.view && editor.view.dom) {
                  container.classList.remove('scrolling');
                  editor.view.dom.style.userSelect = '';
                  container.style.userSelect = '';
                }
              } catch {
                // Ignore errors
              }
            }, 500);
          }
        }
      } catch {
        // View not ready, ignore
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (disabled || !editor) {
      mouseDownRef.current = null;
      isScrollingRef.current = false;
      return;
    }
    
    // If we were scrolling, clear any selection that might have been created
    // But only if we actually detected scrolling (not just a click)
    if (isScrollingRef.current) {
      try {
        if (!editor.isDestroyed && editor.view && editor.view.dom) {
          // Clear any text selection that might have been created during scroll
          const selection = window.getSelection();
          if (selection && selection.toString().length > 0) {
            selection.removeAllRanges();
          }
          
          // Re-enable text selection immediately
          const editorDom = editor.view.dom;
          const container = editorDom.closest('.plagiarism-editor') as HTMLElement;
          if (container) {
            container.classList.remove('scrolling');
            editorDom.style.userSelect = '';
            container.style.userSelect = '';
          }
        }
      } catch {
        // View not ready, ignore
      }
    }
    
    // Always reset tracking state
    mouseDownRef.current = null;
    isScrollingRef.current = false;
  };

  const handleMouseLeave = () => {
    // Reset on mouse leave to prevent stuck states
    try {
      if (editor && !editor.isDestroyed && editor.view && editor.view.dom) {
        const editorDom = editor.view.dom;
        editorDom.style.userSelect = '';
        const container = editorDom.closest('.plagiarism-editor');
        if (container) {
          (container as HTMLElement).style.userSelect = '';
        }
      }
    } catch {
      // View not ready, ignore
    }
    mouseDownRef.current = null;
    isScrollingRef.current = false;
  };
  
  // Handle wheel events to prevent selection during scroll
  const handleWheel = () => {
    if (disabled || !editor || editor.isDestroyed) return;
    
    // Safely check if view is available
    let editorDom: HTMLElement | null = null;
    try {
      if (!editor.view || !editor.view.dom) return;
      editorDom = editor.view.dom;
    } catch {
      return;
    }
    
    if (!editorDom) return;
    
    isWheelingRef.current = true;
    
    // Immediately prevent text selection during wheel scroll
    const container = editorDom.closest('.plagiarism-editor') as HTMLElement;
    if (container) {
      container.classList.add('scrolling');
      editorDom.style.userSelect = 'none';
      container.style.userSelect = 'none';
    }
    
    // Clear any selection that might have been created
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
    
    // Re-enable selection after wheel stops
    setTimeout(() => {
      try {
        if (editor && !editor.isDestroyed && editor.view && editor.view.dom && container) {
          container.classList.remove('scrolling');
          editor.view.dom.style.userSelect = '';
          container.style.userSelect = '';
          isWheelingRef.current = false;
        }
      } catch {
        // View not ready, ignore
        isWheelingRef.current = false;
      }
    }, 200);
  };

  // Handle click on editor container to focus editor
  const handleContainerClick = (e: React.MouseEvent) => {
    if (disabled || !editor) return;
    
    const target = e.target as HTMLElement;
    const isEditorContent = target.closest('.tiptap') || target.closest('.ProseMirror');
    const isButton = target.closest('button') || target.closest('[role="button"]');
    
    // Don't interfere with button clicks
    if (isButton) return;
    
    // If clicking on the container (not editor content), focus the editor
    if (!isEditorContent) {
      // Click was on container, focus the editor
      try {
        if (editor.view && editor.view.dom) {
          // Use setTimeout to ensure the click event completes first
          setTimeout(() => {
            try {
              if (editor && editor.view && editor.view.dom) {
                editor.view.dom.focus();
                // Position cursor at the end if editor has content, or at start if empty
                const { state } = editor;
                const { doc } = state;
                const pos = doc.content.size > 0 ? doc.content.size : 0;
                editor.commands.setTextSelection(pos);
              }
            } catch {
              // Ignore errors
            }
          }, 0);
        }
      } catch {
        // Ignore errors
      }
    } else {
      // Click was on editor content, ensure it's focused
      try {
        if (editor.view && editor.view.dom) {
          // TipTap should handle this, but ensure focus
          setTimeout(() => {
            try {
              if (editor && editor.view && editor.view.dom && document.activeElement !== editor.view.dom) {
                editor.view.dom.focus();
              }
            } catch {
              // Ignore errors
            }
          }, 0);
        }
      } catch {
        // Ignore errors
      }
    }
  };

  return (
    <div 
      className={`plagiarism-editor relative h-full cursor-text ${disabled ? "opacity-70 pointer-events-none" : ""}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      onClick={handleContainerClick}
    >
      <EditorContent editor={editor} />
    </div>
  );
};

export default PlagiarismInputEditor;
