import {
  debounce,
  getElementFromIframe,
} from "@/lib/presentation/editing/editorUtils";
import { useAppDispatch } from "@/redux/hooks";
import { trackChange } from "@/redux/slices/slideEditSlice";
import DOMPurify from "dompurify";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hook for text editing functionality with contentEditable
 *
 * Features:
 * - Inline text editing with contentEditable
 * - HTML sanitization using DOMPurify to prevent XSS
 * - Preserves HTML structure (tags like <p>, <span>, <strong>, etc.)
 * - Auto-selects all text when editing starts
 * - Save on blur (when clicking outside)
 * - Keyboard shortcuts (Ctrl/Cmd+S to save, Esc to cancel)
 * - Paste handling (strips formatting, inserts plain text)
 * - Tracks text changes in Redux for undo/redo
 * - Visual feedback with `.element-editing` class
 *
 * @param slideId - The unique identifier of the slide being edited
 * @param elementId - Unique identifier of the element being edited
 * @param elementPath - CSS selector path to the element
 * @param iframeRef - Reference to the iframe containing the slide content
 * @returns Object with editing functions and state
 *
 * @example
 * ```tsx
 * const textEditing = useTextEditing(
 *   slideId,
 *   selectedElement.id,
 *   selectedElement.elementPath,
 *   iframeRef
 * );
 *
 * // Start editing
 * textEditing.startEditing();
 *
 * // Check if currently editing
 * if (textEditing.isEditing) {
 *   // Show editing UI
 * }
 *
 * // Stop editing and save
 * textEditing.stopEditing(true);
 *
 * // Cancel editing (discard changes)
 * textEditing.stopEditing(false);
 * ```
 */
export function useTextEditing(
  slideId: string,
  elementId: string,
  elementPath: string,
  iframeRef: React.RefObject<HTMLIFrameElement>,
) {
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [originalText, setOriginalText] = useState("");
  const elementRef = useRef<HTMLElement | null>(null);

  /**
   * Get the target element from iframe
   */
  const getElement = useCallback((): HTMLElement | null => {
    if (!iframeRef.current) return null;

    const element = getElementFromIframe(iframeRef.current, elementPath);
    elementRef.current = element;
    return element;
  }, [iframeRef, elementPath]);

  /**
   * Start editing mode - inline editing with visual feedback
   */
  const startEditing = useCallback(() => {
    const element = getElement();
    if (!element) {
      console.warn("Element not found for text editing:", elementPath);
      return false;
    }

    // Store original HTML (preserve structure)
    const original = element.innerHTML || "";
    setOriginalText(original);
    setTextContent(element.textContent || "");
    setIsEditing(true);

    // Make element contentEditable (must be done in iframe context)
    const iframeDoc =
      iframeRef.current?.contentDocument ||
      iframeRef.current?.contentWindow?.document;

    if (iframeDoc) {
      // Add visual feedback class
      element.classList.add("element-editing");

      element.contentEditable = "true";
      element.focus();

      // Select all text for easy editing (use iframe's selection API)
      try {
        const iframeWindow = iframeRef.current?.contentWindow;
        if (iframeWindow) {
          const range = iframeDoc.createRange();
          range.selectNodeContents(element);
          const selection = iframeWindow.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      } catch (error) {
        console.warn("Could not select text in iframe:", error);
      }
    }

    return true;
  }, [getElement, elementPath, iframeRef]);

  /**
   * Stop editing mode and save changes
   * Preserves HTML structure by sanitizing innerHTML instead of replacing with textContent
   */
  const stopEditing = useCallback(
    (save: boolean = true) => {
      const element = elementRef.current || getElement();
      if (!element) return;

      // Remove visual feedback class
      element.classList.remove("element-editing");

      if (save) {
        // Get current HTML content (preserves structure)
        const currentHTML = element.innerHTML || "";

        // Sanitize HTML to prevent XSS while preserving structure
        const sanitizedHTML = sanitizeHTML(currentHTML);

        // Update element with sanitized HTML (preserves children structure)
        element.innerHTML = sanitizedHTML;

        // Track change if content actually changed
        if (sanitizedHTML !== originalText) {
          dispatch(
            trackChange({
              slideId,
              elementId,
              type: "text",
              data: {
                html: sanitizedHTML,
                text: element.textContent || "",
              },
              previousData: {
                html: originalText,
                text: element.textContent || "",
              },
            }),
          );
        }
      } else {
        // Restore original HTML
        element.innerHTML = originalText;
      }

      // Remove contentEditable
      element.contentEditable = "false";
      setIsEditing(false);
    },
    [getElement, originalText, slideId, elementId, dispatch],
  );

  /**
   * Update text content (debounced)
   */
  const updateText = useCallback(
    (newText: string) => {
      setTextContent(newText);

      // Update element in real-time (for preview)
      const element = elementRef.current || getElement();
      if (element && isEditing) {
        element.textContent = newText;
      }
    },
    [getElement, isEditing],
  );

  // Debounced version for change tracking
  const debouncedTrackChange = useRef(
    debounce((newText: string) => {
      if (newText !== originalText && isEditing) {
        // Text will be tracked when stopEditing is called
      }
    }, 300),
  ).current;

  /**
   * Handle text change
   */
  const handleTextChange = useCallback(
    (newText: string) => {
      updateText(newText);
      debouncedTrackChange(newText);
    },
    [updateText, debouncedTrackChange],
  );

  /**
   * Handle paste event - strip formatting
   */
  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      event.preventDefault();

      const pastedText = event.clipboardData?.getData("text/plain") || "";
      // Create a text node with the pasted text (will be sanitized on save)
      const sanitizedText = pastedText;

      // Get iframe window and document
      const iframeWindow = iframeRef.current?.contentWindow;
      const iframeDoc =
        iframeRef.current?.contentDocument ||
        iframeRef.current?.contentWindow?.document;

      if (!iframeWindow || !iframeDoc) return;

      // Insert text at cursor position (use iframe's selection API)
      const selection = iframeWindow.getSelection();
      if (selection?.rangeCount) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = iframeDoc.createTextNode(sanitizedText);
        range.insertNode(textNode);

        // Move cursor after inserted text
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);

        // Update text content
        const element = elementRef.current || getElement();
        if (element) {
          const newText = element.textContent || "";
          handleTextChange(newText);
        }
      }
    },
    [getElement, handleTextChange, iframeRef],
  );

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isEditing) return;

      // Ctrl/Cmd + S to save
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        stopEditing(true);
        return;
      }

      // Escape to cancel
      if (event.key === "Escape") {
        event.preventDefault();
        stopEditing(false);
        return;
      }

      // Prevent Tab from leaving the element (or handle it gracefully)
      if (event.key === "Tab") {
        event.preventDefault();
        // You could implement tab navigation here if needed
      }
    },
    [isEditing, stopEditing],
  );

  /**
   * Handle blur event - save on blur
   */
  const handleBlur = useCallback(
    (event: FocusEvent) => {
      if (!isEditing) return;

      // Small delay to allow other click handlers to run first
      // (e.g., clicking save button)
      setTimeout(() => {
        const element = elementRef.current || getElement();
        if (element && element.contentEditable === "true") {
          stopEditing(true);
        }
      }, 150);
    },
    [isEditing, getElement, stopEditing],
  );

  /**
   * Set up event listeners when editing
   */
  useEffect(() => {
    if (!isEditing) return;

    const element = elementRef.current || getElement();
    if (!element) return;

    // Add paste handler
    element.addEventListener("paste", handlePaste);
    // Add keyboard handler
    document.addEventListener("keydown", handleKeyDown);
    // Add blur handler (save on blur)
    element.addEventListener("blur", handleBlur);

    // Cleanup
    return () => {
      element.removeEventListener("paste", handlePaste);
      document.removeEventListener("keydown", handleKeyDown);
      element.removeEventListener("blur", handleBlur);
    };
  }, [isEditing, getElement, handlePaste, handleKeyDown, handleBlur]);

  /**
   * Cleanup on unmount or when element changes
   */
  useEffect(() => {
    return () => {
      const element = elementRef.current;
      if (element) {
        // Clean up editing state
        element.classList.remove("element-editing");
        element.contentEditable = "false";
      }
    };
  }, [elementPath]); // Re-run when element path changes

  /**
   * Cleanup when editing mode is disabled (stopEditMode called)
   * This ensures cleanup when exiting edit mode via Exit button
   */
  useEffect(() => {
    const element = elementRef.current || getElement();
    if (element && !isEditing) {
      // Ensure cleanup when editing stops
      element.classList.remove("element-editing");
      if (element.contentEditable === "true") {
        element.contentEditable = "false";
      }
    }
  }, [isEditing, getElement]);

  return {
    // State
    isEditing,
    textContent,
    originalText,

    // Actions
    startEditing,
    stopEditing,
    handleTextChange,
  };
}

/**
 * Sanitize HTML content to prevent XSS while preserving structure
 *
 * Uses DOMPurify to sanitize HTML, allowing safe tags like <p>, <span>, <strong>
 * while removing dangerous scripts and attributes.
 *
 * @param html - The HTML string to sanitize
 * @returns The sanitized HTML string
 *
 * @example
 * ```tsx
 * const safeHTML = sanitizeHTML("<p>Hello <script>alert('xss')</script></p>");
 * // Returns: "<p>Hello </p>" (script removed)
 * ```
 */
function sanitizeHTML(html: string): string {
  // Use DOMPurify to sanitize HTML (allows safe HTML tags)
  // This preserves structure like <p>, <span>, <strong>, etc. but removes dangerous scripts
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "span",
      "div",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "strong",
      "em",
      "b",
      "i",
      "u",
      "br",
      "a",
      "ul",
      "ol",
      "li",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class", "style"],
    ALLOW_DATA_ATTR: false,
  });

  return sanitized;
}

/**
 * Validate text content for safety and size limits
 *
 * Checks for:
 * - HTML tag injection
 * - Excessive length (prevents memory issues)
 *
 * @param text - The text string to validate
 * @returns Validation result with valid flag and optional error message
 *
 * @example
 * ```tsx
 * const result = validateText("Hello World");
 * if (result.valid) {
 *   // Text is safe to use
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateText(text: string): {
  valid: boolean;
  error?: string;
} {
  if (!text || text.trim().length === 0) {
    return { valid: true }; // Empty text is valid
  }

  // Check for potential HTML injection
  if (/<[^>]+>/g.test(text)) {
    return {
      valid: false,
      error: "Text contains HTML tags which are not allowed",
    };
  }

  // Check for extremely long text (prevent memory issues)
  if (text.length > 10000) {
    return {
      valid: false,
      error: "Text is too long (maximum 10,000 characters)",
    };
  }

  return { valid: true };
}
