"use client";

import { cn } from "@/lib/utils";
import type { ElementData } from "@/redux/slices/slideEditSlice";
import { memo, useCallback, useEffect, useRef, useState } from "react";

/**
 * Props for ResizeHandles component
 */
interface ResizeHandlesProps {
  /** The currently selected element data */
  selectedElement: ElementData;
  /** Reference to the iframe containing the slide content */
  iframeRef: React.RefObject<HTMLIFrameElement>;
  /** Reference to the container element */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Scale factor of the iframe (for coordinate conversion) */
  iframeScale: number;
  /** Optional callback when resize completes (called on mouseup) */
  onResize?: (width: number, height: number) => void;
}

/**
 * Resize Handles Component
 *
 * Displays 8 resize handles (4 corners + 4 edges) around a selected element
 * and allows users to resize elements by dragging the handles.
 *
 * Features:
 * - Real-time visual feedback during resize
 * - Maintains minimum size constraints (20px)
 * - Supports all 8 directions (n, s, e, w, ne, nw, se, sw)
 * - Handles position updates for corner/edge resizing
 * - Uses iframe scale for accurate coordinate conversion
 *
 * @param props - ResizeHandles component props
 * @returns The resize handles overlay or null if element not found
 *
 * @example
 * ```tsx
 * <ResizeHandles
 *   selectedElement={selectedElement}
 *   iframeRef={iframeRef}
 *   containerRef={containerRef}
 *   iframeScale={0.5}
 *   onResize={(width, height) => {
 *     
 *   }}
 * />
 * ```
 */
export const ResizeHandles = memo(function ResizeHandles({
  selectedElement,
  iframeRef,
  containerRef,
  iframeScale,
  onResize,
}: ResizeHandlesProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [startDimensions, setStartDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const resizeRef = useRef<HTMLDivElement>(null);
  const [overlayRect, setOverlayRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  // Calculate position and size of handles overlay
  const getHandlePosition = useCallback(() => {
    if (!containerRef.current || !iframeRef.current) {
      return null;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const iframeRect = iframeRef.current.getBoundingClientRect();

    // Element position relative to iframe
    const elementRect = selectedElement.boundingRect;

    // Calculate position relative to container
    const left =
      iframeRect.left - containerRect.left + elementRect.left * iframeScale;
    const top =
      iframeRect.top - containerRect.top + elementRect.top * iframeScale;
    const width = elementRect.width * iframeScale;
    const height = elementRect.height * iframeScale;

    return { left, top, width, height };
  }, [selectedElement, iframeRef, containerRef, iframeScale]);

  // Live track overlay rect so handles follow element during drag
  useEffect(() => {
    let rafId: number;
    const tick = () => {
      const doc =
        iframeRef.current?.contentDocument ||
        iframeRef.current?.contentWindow?.document;
      if (doc && containerRef.current && iframeRef.current) {
        try {
          const el = doc.querySelector(
            selectedElement.elementPath,
          ) as HTMLElement | null;
          if (el) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const iframeRect = iframeRef.current.getBoundingClientRect();
            const rect = el.getBoundingClientRect();
            const left =
              iframeRect.left - containerRect.left + rect.left * iframeScale;
            const top =
              iframeRect.top - containerRect.top + rect.top * iframeScale;
            const width = rect.width * iframeScale;
            const height = rect.height * iframeScale;
            setOverlayRect({ left, top, width, height });
          }
        } catch {
          // Element may not exist during transitions - safe to ignore
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [iframeRef, containerRef, selectedElement.elementPath, iframeScale]);

  const handlePosition = overlayRect ?? getHandlePosition();

  // Handle resize start
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, handle: string) => {
      e.preventDefault();
      e.stopPropagation();

      setIsResizing(true);
      setResizeHandle(handle);

      const elementRect = selectedElement.boundingRect;
      setStartDimensions({
        width: elementRect.width,
        height: elementRect.height,
      });
      setStartPosition({
        x: e.clientX,
        y: e.clientY,
      });
    },
    [selectedElement],
  );

  // Handle resize
  useEffect(() => {
    if (!isResizing || !resizeHandle) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!iframeRef.current?.contentWindow) return;

      const deltaX = (e.clientX - startPosition.x) / iframeScale;
      const deltaY = (e.clientY - startPosition.y) / iframeScale;

      // Get element from iframe
      const iframeDoc =
        iframeRef.current.contentDocument ||
        iframeRef.current.contentWindow.document;
      if (!iframeDoc) return;

      const element = iframeDoc.querySelector(selectedElement.elementPath);
      if (!element || !(element instanceof HTMLElement)) return;

      const computedStyle = window.getComputedStyle(element);
      const currentLeft = parseFloat(computedStyle.left) || 0;
      const currentTop = parseFloat(computedStyle.top) || 0;

      let newWidth = startDimensions.width;
      let newHeight = startDimensions.height;
      let newLeft = currentLeft;
      let newTop = currentTop;

      // Calculate new dimensions and position based on handle
      switch (resizeHandle) {
        case "nw": // North-west
          newWidth = Math.max(20, startDimensions.width - deltaX);
          newHeight = Math.max(20, startDimensions.height - deltaY);
          newLeft = currentLeft + (startDimensions.width - newWidth);
          newTop = currentTop + (startDimensions.height - newHeight);
          break;
        case "n": // North
          newHeight = Math.max(20, startDimensions.height - deltaY);
          newTop = currentTop + (startDimensions.height - newHeight);
          break;
        case "ne": // North-east
          newWidth = Math.max(20, startDimensions.width + deltaX);
          newHeight = Math.max(20, startDimensions.height - deltaY);
          newTop = currentTop + (startDimensions.height - newHeight);
          break;
        case "e": // East
          newWidth = Math.max(20, startDimensions.width + deltaX);
          break;
        case "se": // South-east
          newWidth = Math.max(20, startDimensions.width + deltaX);
          newHeight = Math.max(20, startDimensions.height + deltaY);
          break;
        case "s": // South
          newHeight = Math.max(20, startDimensions.height + deltaY);
          break;
        case "sw": // South-west
          newWidth = Math.max(20, startDimensions.width - deltaX);
          newHeight = Math.max(20, startDimensions.height + deltaY);
          newLeft = currentLeft + (startDimensions.width - newWidth);
          break;
        case "w": // West
          newWidth = Math.max(20, startDimensions.width - deltaX);
          newLeft = currentLeft + (startDimensions.width - newWidth);
          break;
      }

      // Apply resize to element
      element.style.width = `${newWidth}px`;
      element.style.height = `${newHeight}px`;

      // Update position if needed (for corner/edge handles that affect position)
      if (resizeHandle.includes("n") || resizeHandle.includes("w")) {
        if (
          computedStyle.position === "absolute" ||
          computedStyle.position === "fixed"
        ) {
          element.style.left = `${newLeft}px`;
          element.style.top = `${newTop}px`;
        }
      }

      // Call onResize callback if provided
      if (onResize) {
        onResize(newWidth, newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeHandle(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isResizing,
    resizeHandle,
    startDimensions,
    startPosition,
    iframeScale,
    iframeRef,
    selectedElement,
    onResize,
  ]);

  if (!handlePosition) {
    return null;
  }

  const { left, top, width, height } = handlePosition;
  const handleSize = 8;
  const handleOffset = handleSize / 2;

  return (
    <div
      ref={resizeRef}
      className="pointer-events-none absolute z-50"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      {/* Resize handles */}
      {/* Corner handles */}
      <div
        className={cn(
          "bg-primary border-background pointer-events-auto absolute cursor-nwse-resize rounded-full border-2 shadow-md",
          "transition-transform hover:scale-125",
          isResizing && resizeHandle === "nw" && "scale-125",
        )}
        style={{
          left: `${-handleOffset}px`,
          top: `${-handleOffset}px`,
          width: `${handleSize}px`,
          height: `${handleSize}px`,
        }}
        onMouseDown={(e) => handleResizeStart(e, "nw")}
        aria-label="Resize northwest"
      />
      <div
        className={cn(
          "bg-primary border-background pointer-events-auto absolute cursor-nesw-resize rounded-full border-2 shadow-md",
          "transition-transform hover:scale-125",
          isResizing && resizeHandle === "ne" && "scale-125",
        )}
        style={{
          right: `${-handleOffset}px`,
          top: `${-handleOffset}px`,
          width: `${handleSize}px`,
          height: `${handleSize}px`,
        }}
        onMouseDown={(e) => handleResizeStart(e, "ne")}
        aria-label="Resize northeast"
      />
      <div
        className={cn(
          "bg-primary border-background pointer-events-auto absolute cursor-nwse-resize rounded-full border-2 shadow-md",
          "transition-transform hover:scale-125",
          isResizing && resizeHandle === "se" && "scale-125",
        )}
        style={{
          right: `${-handleOffset}px`,
          bottom: `${-handleOffset}px`,
          width: `${handleSize}px`,
          height: `${handleSize}px`,
        }}
        onMouseDown={(e) => handleResizeStart(e, "se")}
        aria-label="Resize southeast"
      />
      <div
        className={cn(
          "bg-primary border-background pointer-events-auto absolute cursor-nesw-resize rounded-full border-2 shadow-md",
          "transition-transform hover:scale-125",
          isResizing && resizeHandle === "sw" && "scale-125",
        )}
        style={{
          left: `${-handleOffset}px`,
          bottom: `${-handleOffset}px`,
          width: `${handleSize}px`,
          height: `${handleSize}px`,
        }}
        onMouseDown={(e) => handleResizeStart(e, "sw")}
        aria-label="Resize southwest"
      />

      {/* Edge handles */}
      <div
        className={cn(
          "bg-primary border-background pointer-events-auto absolute cursor-ns-resize rounded-full border-2 shadow-md",
          "transition-transform hover:scale-125",
          isResizing && resizeHandle === "n" && "scale-125",
        )}
        style={{
          left: "50%",
          top: `${-handleOffset}px`,
          transform: "translateX(-50%)",
          width: `${handleSize}px`,
          height: `${handleSize}px`,
        }}
        onMouseDown={(e) => handleResizeStart(e, "n")}
        aria-label="Resize north"
      />
      <div
        className={cn(
          "bg-primary border-background pointer-events-auto absolute cursor-ew-resize rounded-full border-2 shadow-md",
          "transition-transform hover:scale-125",
          isResizing && resizeHandle === "e" && "scale-125",
        )}
        style={{
          right: `${-handleOffset}px`,
          top: "50%",
          transform: "translateY(-50%)",
          width: `${handleSize}px`,
          height: `${handleSize}px`,
        }}
        onMouseDown={(e) => handleResizeStart(e, "e")}
        aria-label="Resize east"
      />
      <div
        className={cn(
          "bg-primary border-background pointer-events-auto absolute cursor-ns-resize rounded-full border-2 shadow-md",
          "transition-transform hover:scale-125",
          isResizing && resizeHandle === "s" && "scale-125",
        )}
        style={{
          left: "50%",
          bottom: `${-handleOffset}px`,
          transform: "translateX(-50%)",
          width: `${handleSize}px`,
          height: `${handleSize}px`,
        }}
        onMouseDown={(e) => handleResizeStart(e, "s")}
        aria-label="Resize south"
      />
      <div
        className={cn(
          "bg-primary border-background pointer-events-auto absolute cursor-ew-resize rounded-full border-2 shadow-md",
          "transition-transform hover:scale-125",
          isResizing && resizeHandle === "w" && "scale-125",
        )}
        style={{
          left: `${-handleOffset}px`,
          top: "50%",
          transform: "translateY(-50%)",
          width: `${handleSize}px`,
          height: `${handleSize}px`,
        }}
        onMouseDown={(e) => handleResizeStart(e, "w")}
        aria-label="Resize west"
      />
    </div>
  );
});
