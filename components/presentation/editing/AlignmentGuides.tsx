"use client";

import { memo } from "react";

/**
 * Alignment guide data structure
 */
interface AlignmentGuide {
  /** Type of guide line (horizontal or vertical) */
  type: "horizontal" | "vertical";
  /** Position in viewport coordinates */
  position: number;
  /** IDs of elements that are aligned */
  elementIds: string[];
}

/**
 * Props for AlignmentGuides component
 */
interface AlignmentGuidesProps {
  /** Reference to the container element */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Reference to the iframe containing the slide content */
  iframeRef: React.RefObject<HTMLIFrameElement>;
  /** Array of alignment guides to display */
  guides: AlignmentGuide[];
  /** Whether alignment guides are enabled */
  enabled: boolean;
}

/**
 * Alignment Guides Component
 *
 * Displays visual guide lines (SVG) when elements align during drag operations.
 * Helps users align elements with other elements or slide boundaries.
 *
 * Features:
 * - Horizontal and vertical guide lines
 * - Automatically positioned relative to container
 * - Updates in real-time during drag
 * - Shows which elements are aligned
 *
 * @param props - AlignmentGuides component props
 * @returns The alignment guides SVG or null if disabled/no guides
 *
 * @example
 * ```tsx
 * <AlignmentGuides
 *   containerRef={containerRef}
 *   iframeRef={iframeRef}
 *   guides={alignmentGuides}
 *   enabled={true}
 * />
 * ```
 */
export const AlignmentGuides = memo(function AlignmentGuides({
  containerRef,
  iframeRef,
  guides,
  enabled,
}: AlignmentGuidesProps) {
  if (
    !enabled ||
    guides.length === 0 ||
    !containerRef.current ||
    !iframeRef.current
  ) {
    return null;
  }

  const containerRect = containerRef.current.getBoundingClientRect();
  const iframeRect = iframeRef.current.getBoundingClientRect();

  // Calculate offset from container
  const offsetLeft = iframeRect.left - containerRect.left;
  const offsetTop = iframeRect.top - containerRect.top;

  return (
    <svg
      className="pointer-events-none absolute z-30"
      style={{
        left: `${offsetLeft}px`,
        top: `${offsetTop}px`,
        width: `${iframeRect.width}px`,
        height: `${iframeRect.height}px`,
      }}
    >
      {guides.map((guide, index) => {
        if (guide.type === "horizontal") {
          const y = guide.position - iframeRect.top;
          return (
            <line
              key={`guide-h-${index}`}
              x1={0}
              y1={y}
              x2={iframeRect.width}
              y2={y}
              stroke="#07B37A"
              strokeWidth="2"
              strokeDasharray="4 4"
              opacity="0.8"
            />
          );
        } else {
          const x = guide.position - iframeRect.left;
          return (
            <line
              key={`guide-v-${index}`}
              x1={x}
              y1={0}
              x2={x}
              y2={iframeRect.height}
              stroke="#07B37A"
              strokeWidth="2"
              strokeDasharray="4 4"
              opacity="0.8"
            />
          );
        }
      })}
    </svg>
  );
});
