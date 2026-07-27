"use client";

import { memo, useEffect, useState } from "react";

/**
 * Props for GridOverlay component
 */
interface GridOverlayProps {
  /** Reference to the container element */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Reference to the iframe containing the slide content */
  iframeRef: React.RefObject<HTMLIFrameElement>;
  /** Scale factor of the iframe (for coordinate conversion) */
  iframeScale: number;
  /** Whether the grid overlay is enabled */
  enabled: boolean;
  /** Grid size in pixels (default: 8px) */
  gridSize?: number;
}

/**
 * Grid Overlay Component
 *
 * Displays a visual grid overlay on top of the slide content when enabled.
 * The grid helps users align elements and matches the drag snap grid.
 *
 * Features:
 * - SVG-based grid lines for performance
 * - Automatically adjusts to iframe size and position
 * - Updates on window resize
 * - Can be toggled on/off
 *
 * @param props - GridOverlay component props
 * @returns The grid overlay SVG or null if disabled
 *
 * @example
 * ```tsx
 * <GridOverlay
 *   containerRef={containerRef}
 *   iframeRef={iframeRef}
 *   iframeScale={0.5}
 *   enabled={gridEnabled}
 *   gridSize={8}
 * />
 * ```
 */
export const GridOverlay = memo(function GridOverlay({
  containerRef,
  iframeRef,
  iframeScale,
  enabled,
  gridSize = 8,
}: GridOverlayProps) {
  const [overlayPosition, setOverlayPosition] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current || !iframeRef.current) {
      setOverlayPosition(null);
      return;
    }

    const updateOverlay = () => {
      const containerRect = containerRef.current?.getBoundingClientRect();
      const iframeRect = iframeRef.current?.getBoundingClientRect();

      if (!containerRect || !iframeRect) {
        setOverlayPosition(null);
        return;
      }

      // Calculate overlay position relative to container
      const left = iframeRect.left - containerRect.left;
      const top = iframeRect.top - containerRect.top;
      const width = iframeRect.width;
      const height = iframeRect.height;

      setOverlayPosition({ left, top, width, height });
    };

    updateOverlay();

    // Update on window resize
    window.addEventListener("resize", updateOverlay);
    return () => window.removeEventListener("resize", updateOverlay);
  }, [enabled, containerRef, iframeRef, iframeScale]);

  if (!enabled || !overlayPosition) {
    return null;
  }

  // Calculate grid size in viewport coordinates (scaled)
  const viewportGridSize = gridSize * iframeScale;

  // Generate grid lines
  const verticalLines = [];
  const horizontalLines = [];

  for (let x = 0; x < overlayPosition.width; x += viewportGridSize) {
    verticalLines.push(x);
  }

  for (let y = 0; y < overlayPosition.height; y += viewportGridSize) {
    horizontalLines.push(y);
  }

  return (
    <div
      className="pointer-events-none absolute z-10"
      style={{
        left: `${overlayPosition.left}px`,
        top: `${overlayPosition.top}px`,
        width: `${overlayPosition.width}px`,
        height: `${overlayPosition.height}px`,
      }}
    >
      {/* Vertical grid lines */}
      <svg
        className="absolute inset-0"
        style={{ width: "100%", height: "100%" }}
      >
        {verticalLines.map((x, index) => (
          <line
            key={`v-${index}`}
            x1={x}
            y1={0}
            x2={x}
            y2={overlayPosition.height}
            stroke="rgba(7, 179, 122, 0.2)" // Primary green with opacity
            strokeWidth="1"
          />
        ))}
        {/* Horizontal grid lines */}
        {horizontalLines.map((y, index) => (
          <line
            key={`h-${index}`}
            x1={0}
            y1={y}
            x2={overlayPosition.width}
            y2={y}
            stroke="rgba(7, 179, 122, 0.2)"
            strokeWidth="1"
          />
        ))}
      </svg>
    </div>
  );
});
