import {
  applyStylesToElement,
  debounce,
  getComputedStylesAsObject,
  getElementFromIframe,
} from "@/lib/presentation/editing/editorUtils";
import { useAppDispatch } from "@/redux/hooks";
import { trackChange } from "@/redux/slices/slideEditSlice";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Style editing hook
 * Manages style property updates with validation and change tracking
 */
export interface StyleProperties {
  // Text styles
  color?: string;
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  textDecoration?: string;
  lineHeight?: string;
  letterSpacing?: string;

  // Background styles
  backgroundColor?: string;
  backgroundImage?: string;

  // Spacing
  padding?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  margin?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;

  // Border
  border?: string;
  borderWidth?: string;
  borderStyle?: string;
  borderColor?: string;
  borderRadius?: string;

  // Layout
  width?: string;
  height?: string;
  display?: string;
  position?: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  zIndex?: string;

  // Flexbox
  flexDirection?: string;
  justifyContent?: string;
  alignItems?: string;
  gap?: string;

  // Effects
  boxShadow?: string;
  opacity?: string;
}

export interface StylePreset {
  id: string;
  name: string;
  styles: StyleProperties;
}

export function useStyleEditing(
  slideId: string,
  elementId: string,
  elementPath: string,
  iframeRef: React.RefObject<HTMLIFrameElement>,
) {
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [currentStyles, setCurrentStyles] = useState<StyleProperties>({});
  const [originalStyles, setOriginalStyles] = useState<StyleProperties>({});
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
   * Load current styles from element
   */
  const loadStyles = useCallback(() => {
    const element = getElement();
    if (!element) return;

    const computed = getComputedStylesAsObject(element);

    // Convert computed styles to StyleProperties format
    const styles: StyleProperties = {
      color: computed.color || undefined,
      fontSize: computed.fontSize || undefined,
      fontFamily: computed.fontFamily || undefined,
      fontWeight: computed.fontWeight || undefined,
      textAlign: computed.textAlign || undefined,
      backgroundColor: computed.backgroundColor || undefined,
      padding: element.style.padding || undefined,
      margin: element.style.margin || undefined,
      border: element.style.border || undefined,
      borderRadius: element.style.borderRadius || undefined,
      width: element.style.width || undefined,
      height: element.style.height || undefined,
    };

    setCurrentStyles(styles);
    if (!isEditing) {
      setOriginalStyles(styles);
    }
  }, [getElement, isEditing]);

  /**
   * Start editing mode
   */
  const startEditing = useCallback(() => {
    const element = getElement();
    if (!element) {
      console.warn("Element not found for style editing:", elementPath);
      return false;
    }

    loadStyles();
    setIsEditing(true);
    return true;
  }, [getElement, elementPath, loadStyles]);

  /**
   * Apply styles to element (debounced)
   */
  const debouncedApplyStyles = useRef(
    debounce((element: HTMLElement, styles: StyleProperties) => {
      // Convert StyleProperties to Record<string, string> for applyStylesToElement
      const stylesRecord: Record<string, string> = {};
      Object.entries(styles).forEach(([key, value]) => {
        if (value !== undefined) {
          stylesRecord[key] = value;
        }
      });
      applyStylesToElement(element, stylesRecord);
    }, 100),
  ).current;

  /**
   * Update style property
   */
  const updateStyle = useCallback(
    (property: keyof StyleProperties, value: string | undefined) => {
      const element = elementRef.current || getElement();
      if (!element) return;

      // Update local state
      const newStyles = {
        ...currentStyles,
        [property]: value || undefined,
      };
      setCurrentStyles(newStyles);

      // Apply to element immediately for live preview
      if (value) {
        element.style.setProperty(
          property,
          value,
          value.includes("!important") ? "important" : undefined,
        );
      } else {
        element.style.removeProperty(property);
      }

      // Debounced change tracking
      debouncedApplyStyles(element, newStyles);
    },
    [currentStyles, getElement, debouncedApplyStyles],
  );

  /**
   * Apply multiple styles at once
   */
  const applyStyles = useCallback(
    (styles: Partial<StyleProperties>) => {
      const element = elementRef.current || getElement();
      if (!element) return;

      const newStyles = {
        ...currentStyles,
        ...styles,
      };
      setCurrentStyles(newStyles);

      // Apply to element
      Object.entries(styles).forEach(([prop, value]) => {
        if (value) {
          element.style.setProperty(prop, value);
        } else {
          element.style.removeProperty(prop);
        }
      });

      debouncedApplyStyles(element, newStyles);
    },
    [currentStyles, getElement, debouncedApplyStyles],
  );

  /**
   * Apply style preset
   */
  const applyPreset = useCallback(
    (preset: StylePreset) => {
      applyStyles(preset.styles);
    },
    [applyStyles],
  );

  /**
   * Reset to original styles
   */
  const resetStyles = useCallback(() => {
    const element = elementRef.current || getElement();
    if (!element) return;

    // Remove all custom styles
    element.removeAttribute("style");

    // Reload styles
    loadStyles();
  }, [getElement, loadStyles]);

  /**
   * Stop editing and save changes
   */
  const stopEditing = useCallback(
    (save: boolean = true) => {
      const element = elementRef.current || getElement();
      if (!element) return;

      if (save) {
        // Track change if styles actually changed
        const currentElementStyles = getComputedStylesAsObject(element);
        const hasChanges =
          JSON.stringify(currentStyles) !== JSON.stringify(originalStyles);

        if (hasChanges) {
          dispatch(
            trackChange({
              slideId,
              elementId,
              type: "style",
              data: {
                styles: currentStyles,
              },
              previousData: {
                styles: originalStyles,
              },
            }),
          );
        }
      } else {
        // Restore original styles
        if (element) {
          element.removeAttribute("style");
          loadStyles();
        }
      }

      setIsEditing(false);
    },
    [
      getElement,
      currentStyles,
      originalStyles,
      slideId,
      elementId,
      dispatch,
      loadStyles,
    ],
  );

  /**
   * Load styles when element changes
   */
  useEffect(() => {
    if (elementPath) {
      loadStyles();
    }
  }, [elementPath, loadStyles]);

  return {
    // State
    isEditing,
    currentStyles,
    originalStyles,

    // Actions
    startEditing,
    stopEditing,
    updateStyle,
    applyStyles,
    applyPreset,
    resetStyles,
    loadStyles,
  };
}

/**
 * Common style presets
 */
export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "heading-primary",
    name: "Primary Heading",
    styles: {
      fontSize: "2rem",
      fontWeight: "700",
      color: "#1a1a1a",
      marginBottom: "1rem",
    },
  },
  {
    id: "heading-secondary",
    name: "Secondary Heading",
    styles: {
      fontSize: "1.5rem",
      fontWeight: "600",
      color: "#333333",
      marginBottom: "0.75rem",
    },
  },
  {
    id: "body-text",
    name: "Body Text",
    styles: {
      fontSize: "1rem",
      fontWeight: "400",
      color: "#666666",
      lineHeight: "1.6",
    },
  },
  {
    id: "highlight",
    name: "Highlight",
    styles: {
      backgroundColor: "#ffff00",
      padding: "0.25rem 0.5rem",
      borderRadius: "0.25rem",
    },
  },
  {
    id: "card",
    name: "Card",
    styles: {
      backgroundColor: "#ffffff",
      padding: "1.5rem",
      borderRadius: "0.5rem",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    } as StyleProperties,
  },
];
