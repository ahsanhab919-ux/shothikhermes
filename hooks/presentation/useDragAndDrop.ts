import { getElementFromIframe } from "@/lib/presentation/editing/editorUtils";
import { useAppDispatch } from "@/redux/hooks";
import { trackChange } from "@/redux/slices/slideEditSlice";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Options for drag and drop behavior
 */
interface UseDragOptions {
  /** Grid size in pixels for snapping (default: 8px) */
  gridSize?: number;
  /** Whether to constrain element movement within slide boundaries (default: true) */
  constrainToSlide?: boolean;
}

/**
 * Internal state during drag operation
 */
interface DragState {
  /** Starting mouse X position in viewport coordinates */
  startClientX: number;
  /** Starting mouse Y position in viewport coordinates */
  startClientY: number;
  /** Starting element left position in iframe coordinates */
  startLeft: number;
  /** Starting element top position in iframe coordinates */
  startTop: number;
  /** Element width in iframe coordinates */
  width: number;
  /** Element height in iframe coordinates */
  height: number;
  /** Whether element had static position initially */
  isStaticPosition: boolean;
  /** Base transform string before drag */
  baseTransform: string;
  /** Current X delta in iframe coordinates */
  currentDx: number;
  /** Current Y delta in iframe coordinates */
  currentDy: number;
}

/**
 * Drag-and-drop hook for moving a selected element inside the iframe
 *
 * Features:
 * - Uses CSS transform for smooth live preview during drag
 * - Commits position to left/top styles on drop
 * - Handles iframe scale factor for coordinate conversion
 * - Supports grid snapping (8px default)
 * - Constrains element movement within slide boundaries
 * - Tracks position changes in Redux for undo/redo
 *
 * @param elementPath - CSS selector path to the element to drag
 * @param iframeRef - Reference to the iframe containing the slide content
 * @param _iframeScale - Scale factor of the iframe (unused, kept for API compatibility)
 * @param options - Optional configuration for drag behavior
 * @param options.gridSize - Grid size in pixels for snapping (default: 8)
 * @param options.constrainToSlide - Whether to constrain to slide boundaries (default: true)
 * @param options.slideId - The unique identifier of the slide being edited
 * @param options.elementId - Unique identifier of the element being dragged
 * @returns Object with enable/disable functions and drag state
 *
 * @example
 * ```tsx
 * const { enable, disable, isDragging } = useDragAndDrop(
 *   "div.my-element",
 *   iframeRef,
 *   0.5,
 *   { gridSize: 8, constrainToSlide: true, slideId: "slide-1", elementId: "element-123" }
 * );
 *
 * // Enable drag when element is selected
 * useEffect(() => {
 *   if (selectedElement) {
 *     enable();
 *     return () => disable();
 *   }
 * }, [selectedElement, enable, disable]);
 * ```
 */
export function useDragAndDrop(
  elementPath: string,
  iframeRef: React.RefObject<HTMLIFrameElement>,
  _iframeScale: number,
  {
    gridSize = 8,
    constrainToSlide = true,
    slideId,
    elementId,
  }: UseDragOptions & { slideId?: string; elementId?: string } = {},
) {
  const dispatch = useAppDispatch();
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<DragState | null>(null);
  const rafRef = useRef<number | null>(null);

  const getIframeDoc = useCallback(() => {
    return (
      iframeRef.current?.contentDocument ||
      iframeRef.current?.contentWindow?.document ||
      null
    );
  }, [iframeRef]);

  const getParentBounds = useCallback(
    (element: HTMLElement) => {
      const doc = getIframeDoc();
      if (!doc) {
        // Fallback to viewport if no iframe
        return {
          el: document.body,
          rect: document.body.getBoundingClientRect(),
          width: window.innerWidth,
          height: window.innerHeight,
          scrollLeft: 0,
          scrollTop: 0,
        };
      }

      // Always use iframe body for constraints (full slide area)
      // This ensures elements can be moved anywhere within the visible slide
      const parent = doc.body as HTMLElement;
      const rect = parent.getBoundingClientRect();
      // Use clientWidth/clientHeight for iframe coordinate space
      const width = parent.clientWidth || parent.scrollWidth || rect.width;
      const height = parent.clientHeight || parent.scrollHeight || rect.height;
      return {
        el: parent,
        rect,
        width,
        height,
        scrollLeft: parent.scrollLeft || 0,
        scrollTop: parent.scrollTop || 0,
      };
    },
    [getIframeDoc],
  );

  const applyTransform = (element: HTMLElement, x: number, y: number) => {
    element.style.willChange = "transform";
    element.style.transform = `translate(${x}px, ${y}px)`;
  };

  const clearTransform = (element: HTMLElement) => {
    element.style.transform = "";
    element.style.willChange = "";
  };

  const snap = (value: number) => {
    if (!gridSize || gridSize <= 1) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      const doc = getIframeDoc();
      if (!doc) return;

      const element = getElementFromIframe(iframeRef.current, elementPath);
      if (!element) return;

      const computed = (doc.defaultView || window).getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const position = computed.position;
      const isStaticPosition = position === "static";
      const parent = getParentBounds(element);
      const leftFromParent = rect.left - parent.rect.left + parent.scrollLeft;
      const topFromParent = rect.top - parent.rect.top + parent.scrollTop;
      const parsedLeft = parseFloat(computed.left);
      const parsedTop = parseFloat(computed.top);
      const startLeft = isNaN(parsedLeft) ? leftFromParent : parsedLeft;
      const startTop = isNaN(parsedTop) ? topFromParent : parsedTop;

      dragStateRef.current = {
        startClientX: e.clientX,
        startClientY: e.clientY,
        startLeft,
        startTop,
        width: rect.width,
        height: rect.height,
        isStaticPosition,
        baseTransform:
          computed.transform && computed.transform !== "none"
            ? computed.transform
            : "",
        currentDx: 0,
        currentDy: 0,
      };

      setIsDragging(true);
      try {
        (element as any).setPointerCapture?.((e as any).pointerId);
      } catch {
        // Pointer capture may fail in some browsers - safe to ignore
      }
      doc.addEventListener("pointermove", onPointerMove, { passive: true });
      doc.addEventListener("pointerup", onPointerUp, {
        passive: true,
        once: true,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [elementPath, iframeRef, getIframeDoc, getParentBounds],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragStateRef.current) return;
      const doc = getIframeDoc();
      if (!doc) return;
      const element = getElementFromIframe(iframeRef.current, elementPath);
      if (!element) return;

      const state = dragStateRef.current;
      const rawDeltaX = e.clientX - state.startClientX;
      const rawDeltaY = e.clientY - state.startClientY;

      // Compute dx,dy we will apply visually
      // Note: rawDeltaX/Y are in viewport coordinates, but we need to work in iframe coordinates
      let dx = rawDeltaX;
      let dy = rawDeltaY;

      if (constrainToSlide) {
        const parent = getParentBounds(element);
        const rect = element.getBoundingClientRect();

        // Calculate element position relative to parent in viewport coordinates
        const elementLeftInParent = rect.left - parent.rect.left;
        const elementTopInParent = rect.top - parent.rect.top;

        // Calculate target position (relative to parent, in viewport coords)
        let targetLeft = elementLeftInParent + dx;
        let targetTop = elementTopInParent + dy;
        let targetRight = targetLeft + rect.width;
        let targetBottom = targetTop + rect.height;

        // Parent bounds: use viewport rect dimensions for constraint calculation
        // This ensures we're working in the same coordinate space as the element rects
        const parentWidth = parent.rect.width;
        const parentHeight = parent.rect.height;
        const minLeft = 0;
        const minTop = 0;
        const maxRight = parentWidth;
        const maxBottom = parentHeight;

        // Clamp target rect within parent bounds (all in viewport coordinates)
        if (targetLeft < minLeft) {
          dx = minLeft - elementLeftInParent;
        }
        if (targetTop < minTop) {
          dy = minTop - elementTopInParent;
        }
        if (targetRight > maxRight) {
          dx = maxRight - elementLeftInParent - rect.width;
        }
        if (targetBottom > maxBottom) {
          dy = maxBottom - elementTopInParent - rect.height;
        }
      }

      // Live preview without snapping for cursor lock
      const snappedLeft = state.startLeft + dx;
      const snappedTop = state.startTop + dy;

      // Throttle via rAF
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const ddx = snappedLeft - state.startLeft;
        const ddy = snappedTop - state.startTop;
        state.currentDx = ddx;
        state.currentDy = ddy;
        const translate = ` translate(${ddx}px, ${ddy}px)`;
        element.style.willChange = "transform";
        element.style.transform = `${state.baseTransform}${translate}`.trim();
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [elementPath, iframeRef, getIframeDoc, getParentBounds],
  );

  const onPointerUp = useCallback(() => {
    const doc = getIframeDoc();
    const element = getElementFromIframe(iframeRef.current, elementPath);
    if (doc && element && dragStateRef.current) {
      const state = dragStateRef.current;
      // Use tracked deltas to avoid relying on computed transform
      const dx = state.currentDx || 0;
      const dy = state.currentDy || 0;

      // Store previous position for change tracking
      const previousLeft = state.startLeft;
      const previousTop = state.startTop;
      const previousPosition = element.style.position || "static";

      let finalLeft: number;
      let finalTop: number;

      if (state.isStaticPosition) {
        // Preserve layout: convert to relative offsets and clear transform
        if (!element.style.position || element.style.position === "static") {
          element.style.position = "relative";
        }
        const finalDx = snap(state.startLeft + dx) - state.startLeft;
        const finalDy = snap(state.startTop + dy) - state.startTop;
        // For relative positioning, store the offset values
        finalLeft = finalDx;
        finalTop = finalDy;
        element.style.left = `${finalDx}px`;
        element.style.top = `${finalDy}px`;
        clearTransform(element);
      } else {
        // Positioned elements: commit to left/top and clear transform
        finalLeft = snap(state.startLeft + dx);
        finalTop = snap(state.startTop + dy);
        element.style.left = `${finalLeft}px`;
        element.style.top = `${finalTop}px`;
        clearTransform(element);
      }

      // Track position change in Redux if position actually changed
      // Check if position changed (accounting for relative vs absolute positioning)
      const positionChanged = state.isStaticPosition
        ? Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5
        : Math.abs(finalLeft - previousLeft) > 0.5 ||
          Math.abs(finalTop - previousTop) > 0.5;

      if (slideId && elementId && positionChanged) {
        const computedStyle = (doc.defaultView || window).getComputedStyle(
          element,
        );
        dispatch(
          trackChange({
            slideId,
            elementId,
            type: "position",
            data: {
              left: finalLeft,
              top: finalTop,
              position: element.style.position || computedStyle.position,
            },
            previousData: {
              left: state.isStaticPosition ? 0 : previousLeft,
              top: state.isStaticPosition ? 0 : previousTop,
              position: previousPosition,
            },
          }),
        );
      }
    }

    dragStateRef.current = null;
    setIsDragging(false);
    if (doc) {
      doc.removeEventListener("pointermove", onPointerMove);
    }
  }, [
    elementPath,
    iframeRef,
    getIframeDoc,
    onPointerMove,
    snap,
    slideId,
    elementId,
    dispatch,
  ]);

  // Attach pointerdown to the target element when hook is active
  const enable = useCallback(() => {
    const doc = getIframeDoc();
    const element = getElementFromIframe(iframeRef.current, elementPath);
    if (!doc || !element) return () => {};
    element.style.touchAction = "none"; // prevent touch scrolling during drag
    element.addEventListener("pointerdown", onPointerDown);
    return () => {
      element.removeEventListener("pointerdown", onPointerDown);
      element.style.touchAction = "";
      const el = getElementFromIframe(iframeRef.current, elementPath);
      if (el) clearTransform(el);
      const d = getIframeDoc();
      if (d) d.removeEventListener("pointermove", onPointerMove);
    };
  }, [elementPath, iframeRef, getIframeDoc, onPointerDown, onPointerMove]);

  useEffect(() => {
    return () => {
      const cleanup = enable();
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isDragging, enable };
}
