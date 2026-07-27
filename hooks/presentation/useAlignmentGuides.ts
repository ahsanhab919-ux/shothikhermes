import {
  getAllElementsFromIframe,
  getElementFromIframe,
} from "@/lib/presentation/editing/editorUtils";
import { useCallback, useEffect, useRef, useState } from "react";

interface AlignmentGuide {
  type: "horizontal" | "vertical";
  position: number; // Position in viewport coordinates
  elementIds: string[]; // Elements that align at this position
}

interface UseAlignmentGuidesOptions {
  threshold?: number; // Distance threshold for snapping (default: 5px)
  enabled?: boolean;
}

/**
 * Alignment guides hook
 * Detects when elements align and provides visual guides
 */
export function useAlignmentGuides(
  elementPath: string,
  iframeRef: React.RefObject<HTMLIFrameElement>,
  iframeScale: number,
  isDragging: boolean,
  { threshold = 5, enabled = true }: UseAlignmentGuidesOptions = {},
) {
  const [guides, setGuides] = useState<AlignmentGuide[]>([]);
  const rafRef = useRef<number | null>(null);

  const getIframeDoc = useCallback(() => {
    return (
      iframeRef.current?.contentDocument ||
      iframeRef.current?.contentWindow?.document ||
      null
    );
  }, [iframeRef]);

  const detectAlignment = useCallback(() => {
    if (!enabled || !isDragging) {
      setGuides([]);
      return;
    }

    const doc = getIframeDoc();
    if (!doc) {
      setGuides([]);
      return;
    }

    const targetElement = getElementFromIframe(iframeRef.current, elementPath);
    if (!targetElement) {
      setGuides([]);
      return;
    }

    const targetRect = targetElement.getBoundingClientRect();
    const allElements = getAllElementsFromIframe(iframeRef.current);
    const detectedGuides: AlignmentGuide[] = [];

    // Check alignment with other elements
    for (const element of allElements) {
      if (element === targetElement) continue;

      const elementRect = element.getBoundingClientRect();
      const elementId = element.id || element.tagName + element.className;

      // Check horizontal alignment (top, center, bottom)
      const targetTop = targetRect.top;
      const targetCenter = targetRect.top + targetRect.height / 2;
      const targetBottom = targetRect.bottom;

      const elementTop = elementRect.top;
      const elementCenter = elementRect.top + elementRect.height / 2;
      const elementBottom = elementRect.bottom;

      // Top alignment
      if (Math.abs(targetTop - elementTop) < threshold) {
        detectedGuides.push({
          type: "horizontal",
          position: targetTop,
          elementIds: [elementId],
        });
      }
      // Center alignment
      if (Math.abs(targetCenter - elementCenter) < threshold) {
        detectedGuides.push({
          type: "horizontal",
          position: targetCenter,
          elementIds: [elementId],
        });
      }
      // Bottom alignment
      if (Math.abs(targetBottom - elementBottom) < threshold) {
        detectedGuides.push({
          type: "horizontal",
          position: targetBottom,
          elementIds: [elementId],
        });
      }

      // Check vertical alignment (left, center, right)
      const targetLeft = targetRect.left;
      const targetCenterX = targetRect.left + targetRect.width / 2;
      const targetRight = targetRect.right;

      const elementLeft = elementRect.left;
      const elementCenterX = elementRect.left + elementRect.width / 2;
      const elementRight = elementRect.right;

      // Left alignment
      if (Math.abs(targetLeft - elementLeft) < threshold) {
        detectedGuides.push({
          type: "vertical",
          position: targetLeft,
          elementIds: [elementId],
        });
      }
      // Center alignment
      if (Math.abs(targetCenterX - elementCenterX) < threshold) {
        detectedGuides.push({
          type: "vertical",
          position: targetCenterX,
          elementIds: [elementId],
        });
      }
      // Right alignment
      if (Math.abs(targetRight - elementRight) < threshold) {
        detectedGuides.push({
          type: "vertical",
          position: targetRight,
          elementIds: [elementId],
        });
      }
    }

    // Merge guides at the same position
    const mergedGuides: AlignmentGuide[] = [];
    for (const guide of detectedGuides) {
      const existing = mergedGuides.find(
        (g) =>
          g.type === guide.type &&
          Math.abs(g.position - guide.position) < threshold,
      );
      if (existing) {
        existing.elementIds.push(...guide.elementIds);
      } else {
        mergedGuides.push(guide);
      }
    }

    setGuides(mergedGuides);
  }, [
    elementPath,
    iframeRef,
    iframeScale,
    isDragging,
    enabled,
    threshold,
    getIframeDoc,
  ]);

  useEffect(() => {
    if (!enabled || !isDragging) {
      setGuides([]);
      return;
    }

    // Update guides on every frame while dragging
    const updateGuides = () => {
      detectAlignment();
      if (isDragging) {
        rafRef.current = requestAnimationFrame(updateGuides);
      }
    };

    rafRef.current = requestAnimationFrame(updateGuides);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [enabled, isDragging, detectAlignment]);

  return { guides };
}
