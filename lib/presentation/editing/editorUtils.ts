/**
 * Utility functions for slide editing
 */

/**
 * Get element from iframe by path
 */
export function getElementFromIframe(
  iframe: HTMLIFrameElement | null,
  elementPath: string,
): HTMLElement | null {
  if (!iframe) return null;

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

  if (!iframeDoc) return null;

  try {
    return iframeDoc.querySelector(elementPath) as HTMLElement;
  } catch (error) {
    console.error("Error selecting element by path:", error);
    return null;
  }
}

/**
 * Get all elements in iframe
 */
export function getAllElementsFromIframe(
  iframe: HTMLIFrameElement | null,
): HTMLElement[] {
  if (!iframe) return [];

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

  if (!iframeDoc) return [];

  try {
    return Array.from(iframeDoc.querySelectorAll("*")) as HTMLElement[];
  } catch (error) {
    console.error("Error getting all elements:", error);
    return [];
  }
}

/**
 * Get element's computed styles as object
 */
export function getComputedStylesAsObject(
  element: HTMLElement,
): Record<string, string> {
  const computed = window.getComputedStyle(element);
  const styles: Record<string, string> = {};

  // Get common style properties
  const properties = [
    "color",
    "backgroundColor",
    "fontSize",
    "fontFamily",
    "fontWeight",
    "textAlign",
    "padding",
    "margin",
    "border",
    "borderRadius",
    "width",
    "height",
    "position",
    "top",
    "left",
    "right",
    "bottom",
    "display",
    "flexDirection",
    "justifyContent",
    "alignItems",
  ];

  properties.forEach((prop) => {
    styles[prop] = computed.getPropertyValue(prop);
  });

  return styles;
}

/**
 * Apply styles to element
 */
export function applyStylesToElement(
  element: HTMLElement,
  styles: Record<string, string>,
): void {
  Object.entries(styles).forEach(([prop, value]) => {
    element.style.setProperty(prop, value);
  });
}

/**
 * Remove styles from element
 */
export function removeStylesFromElement(
  element: HTMLElement,
  properties: string[],
): void {
  properties.forEach((prop) => {
    element.style.removeProperty(prop);
  });
}

/**
 * Get element's bounding rectangle relative to iframe
 */
export function getElementBoundingRect(element: HTMLElement): {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
} {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    bottom: rect.bottom,
    right: rect.right,
  };
}

/**
 * Check if element is within bounds
 */
export function isElementWithinBounds(
  element: HTMLElement,
  bounds: { width: number; height: number },
): boolean {
  const rect = getElementBoundingRect(element);
  return (
    rect.left >= 0 &&
    rect.top >= 0 &&
    rect.right <= bounds.width &&
    rect.bottom <= bounds.height
  );
}

/**
 * Constrain element position within bounds
 */
export function constrainElementPosition(
  element: HTMLElement,
  bounds: { width: number; height: number },
): { top: number; left: number } {
  const rect = getElementBoundingRect(element);
  let top = rect.top;
  let left = rect.left;

  // Constrain to bounds
  if (left < 0) left = 0;
  if (top < 0) top = 0;
  if (left + rect.width > bounds.width) {
    left = bounds.width - rect.width;
  }
  if (top + rect.height > bounds.height) {
    top = bounds.height - rect.height;
  }

  return { top, left };
}

/**
 * Snap position to grid
 */
export function snapToGrid(
  position: { x: number; y: number },
  gridSize: number = 10,
): { x: number; y: number } {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  };
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Generate unique ID
 */
export function generateId(prefix: string = "element"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
