const PRIMARY_GREEN = "#07B37A";

// Parse backend HTML to extract body content, styles, and meta tags
export function parseBackendHTML(fullHTML: string) {
  try {
    // Use DOMParser to parse the HTML string
    const parser = new DOMParser();
    const doc = parser.parseFromString(fullHTML, "text/html");

    // Extract body content
    const bodyContent = doc.body?.innerHTML || "";

    // Extract all styles from head
    const styles = Array.from(doc.head.querySelectorAll("style"))
      .map((style) => style.innerHTML)
      .join("\n");

    // Extract meta tags and title
    const metaTags = Array.from(doc.head.querySelectorAll("meta, title"))
      .map((tag) => tag.outerHTML)
      .join("\n");

    // Extract link tags (external stylesheets, fonts, etc.)
    const linkTags = Array.from(
      doc.head.querySelectorAll(
        'link[rel="stylesheet"], link[rel="preconnect"], link[rel="preload"]',
      ),
    )
      .map((link) => link.outerHTML)
      .join("\n");

    return {
      bodyContent,
      styles,
      metaTags,
      linkTags,
    };
  } catch (error) {
    console.error("Error parsing backend HTML:", error);
    // Fallback: return the full HTML as body content
    return {
      bodyContent: fullHTML,
      styles: "",
      metaTags: "",
      linkTags: "",
    };
  }
}

// Enhanced iframe content with selection handling
// Now accepts parsed components to properly inject backend styles
const createEnhancedIframeContent = (
  bodyContent: string,
  backendStyles?: string,
  backendMetaTags?: string,
  backendLinkTags?: string,
) => {
  return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${backendMetaTags || ""}
        ${backendLinkTags || ""}
        
        <!-- Backend styles (preserves all layout/design) -->
        ${backendStyles ? `<style id="backend-styles">${backendStyles}</style>` : ""}
        
        <!-- Editor styles (for selection/hover effects) -->
        <style id="editor-styles">
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          /* Hover and selection styles */
          .selection-enabled {
            user-select: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            cursor: pointer !important;
          }
          
          .selection-enabled * {
            user-select: none !important;
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            cursor: pointer !important;
          }
          
          /* Hover effect for elements */
          .element-hovered {
            outline: 2px dashed ${PRIMARY_GREEN} !important;
            outline-offset: 2px !important;
            background-color: ${PRIMARY_GREEN}20 !important;
            transition: all 0.2s ease !important;
          }
          
          /* Selected element style */
          .element-selected {
            outline: 3px solid ${PRIMARY_GREEN} !important;
            outline-offset: 2px !important;
            background-color: ${PRIMARY_GREEN}30 !important;
            box-shadow: 0 0 10px ${PRIMARY_GREEN}40 !important;
          }
          
          /* Editing mode style - visual feedback for inline editing */
          .element-editing {
            outline: 2px dashed ${PRIMARY_GREEN} !important;
            outline-offset: 2px !important;
            background-color: ${PRIMARY_GREEN}15 !important;
            box-shadow: 0 0 8px ${PRIMARY_GREEN}30 !important;
            cursor: text !important;
          }
          
          .element-editing:focus {
            outline: 2px solid ${PRIMARY_GREEN} !important;
            background-color: ${PRIMARY_GREEN}20 !important;
          }
        </style>
      </head>
      <body>
        ${bodyContent || ""}
        
        <script>
          let isEditMode = false;
          
          // Listen for messages from parent
          window.addEventListener('message', function(event) {
            if (event.data.type === 'TOGGLE_EDIT_MODE') {
              isEditMode = event.data.enabled;
              toggleEditMode(isEditMode);
            } else if (event.data.type === 'SELECT_ELEMENT') {
              // Handle programmatic element selection
              const elementPath = event.data.elementPath;
              if (elementPath) {
                const element = document.querySelector(elementPath);
                if (element) {
                  // CRITICAL FIX: Ensure element has an ID for reliable path generation
                  if (!element.id) {
                    const newId = 'element-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                    element.id = newId;
                  }
                  
                  clearAllHighlights();
                  element.classList.add('element-selected');
                  
                  // Send selection info to parent
                  const selectionInfo = getElementSelectionInfo(element);
                  window.parent.postMessage({
                    type: 'ELEMENT_SELECTED',
                    data: selectionInfo
                  }, '*');
                }
              }
            }
          });
          
          function toggleEditMode(enabled) {
            const body = document.body;
            
            if (enabled) {
              body.classList.add('selection-enabled');
              enableSelection();
            } else {
              body.classList.remove('selection-enabled');
              disableSelection();
            }
          }
          
          function enableSelection() {
            // Add hover and click event listeners
            document.addEventListener('mouseover', handleElementHover);
            document.addEventListener('mouseout', handleElementMouseOut);
            document.addEventListener('click', handleElementClick);
          }
          
          function disableSelection() {
            // Remove hover and click event listeners
            document.removeEventListener('mouseover', handleElementHover);
            document.removeEventListener('mouseout', handleElementMouseOut);
            document.removeEventListener('click', handleElementClick);
            
            // Clear any existing highlights
            clearAllHighlights();
            
            // Clean up all editing states (remove element-editing class)
            const editingElements = document.querySelectorAll('.element-editing');
            editingElements.forEach(el => {
              el.classList.remove('element-editing');
              el.contentEditable = 'false';
            });
          }
          
          let currentHoveredElement = null;
          
          function handleElementHover(event) {
            if (!isEditMode) return;
            
            event.stopPropagation();
            const element = event.target;
            
            // Don't highlight body or html elements
            if (element === document.body || element === document.documentElement) {
              return;
            }
            
            // Clear previous highlight
            if (currentHoveredElement && currentHoveredElement !== element) {
              currentHoveredElement.classList.remove('element-hovered');
            }
            
            // Add hover highlight
            element.classList.add('element-hovered');
            currentHoveredElement = element;
          }
          
          function handleElementMouseOut(event) {
            if (!isEditMode) return;
            
            const element = event.target;
            element.classList.remove('element-hovered');
            
            if (currentHoveredElement === element) {
              currentHoveredElement = null;
            }
          }
          
          function handleElementClick(event) {
            if (!isEditMode) return;
            
            event.preventDefault();
            event.stopPropagation();
            
            const element = event.target;
            
            // Don't select body or html elements
            if (element === document.body || element === document.documentElement) {
              return;
            }
            
            // CRITICAL FIX: Ensure element has an ID for reliable path generation
            // If no ID exists, generate one to ensure unique, reliable selectors
            if (!element.id) {
              const newId = 'element-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
              element.id = newId;
            }
            
            // Clear all previous selections
            clearAllHighlights();
            
            // Add selected highlight
            element.classList.add('element-selected');
            
            // Get element information
            const selectionInfo = getElementSelectionInfo(element);
            
            // Send selection data to parent
            window.parent.postMessage({
              type: 'ELEMENT_SELECTED',
              data: selectionInfo
            }, '*');
          }
          
          function clearAllHighlights() {
            // Remove all hover highlights
            const hoveredElements = document.querySelectorAll('.element-hovered');
            hoveredElements.forEach(el => el.classList.remove('element-hovered'));
            
            // Remove all selected highlights
            const selectedElements = document.querySelectorAll('.element-selected');
            selectedElements.forEach(el => el.classList.remove('element-selected'));
          }
          
          function getElementSelectionInfo(element) {
            // CRITICAL: Temporarily remove editor classes before generating path
            // This ensures clean paths that don't include editor classes
            const editorClasses = ['element-selected', 'element-hovered', 'element-editing'];
            const hadClasses = {};
            editorClasses.forEach(className => {
              hadClasses[className] = element.classList.contains(className);
              if (hadClasses[className]) {
                element.classList.remove(className);
              }
            });
            
            const elementInfo = getElementInfo(element);
            const elementPath = getElementPath(element);
            const boundingRect = element.getBoundingClientRect();
            
            // Restore editor classes
            editorClasses.forEach(className => {
              if (hadClasses[className]) {
                element.classList.add(className);
              }
            });
            
            return {
              element: elementInfo,
              elementPath: elementPath,
              innerHTML: element.innerHTML,
              outerHTML: element.outerHTML,
              textContent: element.textContent,
              boundingRect: {
                top: boundingRect.top,
                left: boundingRect.left,
                width: boundingRect.width,
                height: boundingRect.height,
                bottom: boundingRect.bottom,
                right: boundingRect.right
              },
              computedStyles: getComputedStylesForElement(element),
              timestamp: new Date().toISOString(),
              elementType: getElementType(element)
            };
          }
          
          function getComputedStylesForElement(element) {
            const computedStyle = window.getComputedStyle(element);
            return {
              display: computedStyle.display,
              position: computedStyle.position,
              width: computedStyle.width,
              height: computedStyle.height,
              margin: computedStyle.margin,
              padding: computedStyle.padding,
              backgroundColor: computedStyle.backgroundColor,
              color: computedStyle.color,
              fontSize: computedStyle.fontSize,
              fontFamily: computedStyle.fontFamily,
              fontWeight: computedStyle.fontWeight,
              textAlign: computedStyle.textAlign,
              border: computedStyle.border,
              borderRadius: computedStyle.borderRadius
            };
          }
          
          function getElementType(element) {
            const tagName = element.tagName.toLowerCase();
            
            if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
              return 'heading';
            } else if (['p', 'span', 'div'].includes(tagName)) {
              return 'text';
            } else if (['img', 'svg', 'canvas'].includes(tagName)) {
              return 'media';
            } else if (['a'].includes(tagName)) {
              return 'link';
            } else if (['button', 'input', 'select', 'textarea'].includes(tagName)) {
              return 'interactive';
            } else if (['ul', 'ol', 'li'].includes(tagName)) {
              return 'list';
            } else {
              return 'container';
            }
          }
          
          function getSelectionInfo(range, selectedText) {
            const startContainer = range.startContainer;
            const endContainer = range.endContainer;
            
            // Get the closest element containers
            const startElement = startContainer.nodeType === Node.TEXT_NODE 
              ? startContainer.parentElement 
              : startContainer;
            const endElement = endContainer.nodeType === Node.TEXT_NODE 
              ? endContainer.parentElement 
              : endContainer;
            
            // Get element paths for better identification
            const startPath = getElementPath(startElement);
            const endPath = getElementPath(endElement);
            
            // Get surrounding context
            const contextBefore = getContextText(range, 'before', 50);
            const contextAfter = getContextText(range, 'after', 50);
            
            // Get element attributes and properties
            const startElementInfo = getElementInfo(startElement);
            const endElementInfo = getElementInfo(endElement);
            
            return {
              selectedText,
              selectionLength: selectedText.length,
              startOffset: range.startOffset,
              endOffset: range.endOffset,
              startElement: startElementInfo,
              endElement: endElementInfo,
              startPath,
              endPath,
              contextBefore,
              contextAfter,
              htmlContent: range.cloneContents().textContent,
              timestamp: new Date().toISOString(),
              boundingRect: range.getBoundingClientRect()
            };
          }
          
          function getElementPath(element) {
            const path = [];
            let current = element;
            
            while (current && current !== document.body) {
              // Skip non-element nodes
              if (current.nodeType !== Node.ELEMENT_NODE || !(current instanceof HTMLElement)) {
                current = current.parentElement;
                continue;
              }
              
              let selector = current.tagName.toLowerCase();
              
              if (current.id) {
                // ID is unique, use it and stop
                selector += '#' + current.id;
                path.unshift(selector);
                break;
              }
              
              // Handle className - filter out editor classes more aggressively
              if (current.className) {
                let classes = '';
                
                if (typeof current.className === 'string') {
                  // Split and filter editor classes
                  const classList = current.className
                    .trim()
                    .split(/\s+/)
                    .filter(c => {
                      // Filter out empty strings and editor classes
                      if (!c || c.length === 0) return false;
                      // Filter out any class containing 'element-' prefix (editor classes)
                      if (c.startsWith('element-')) return false;
                      return true;
                    });
                  
                  if (classList.length > 0) {
                    // Join classes with dots (CSS selector format)
                    classes = classList.slice(0, 3).join('.');
                  }
                } else if (current.className instanceof DOMTokenList) {
                  // Handle DOMTokenList
                  const classList = Array.from(current.className)
                    .filter(c => {
                      if (!c || c.length === 0) return false;
                      if (c.startsWith('element-')) return false;
                      return true;
                    });
                  
                  if (classList.length > 0) {
                    classes = classList.slice(0, 3).join('.');
                  }
                }
                
                if (classes) {
                  selector += '.' + classes;
                }
              }
              
              // Add nth-of-type if needed for uniqueness (only if no ID)
              if (!current.id && current.parentNode) {
                const siblings = Array.from(current.parentNode.children).filter(
                  child => child.nodeType === Node.ELEMENT_NODE && child.tagName === current.tagName
                );
                if (siblings.length > 1) {
                  const index = siblings.indexOf(current) + 1;
                  selector += ':nth-of-type(' + index + ')';
                }
              }
              
              path.unshift(selector);
              current = current.parentElement;
            }
            
            return path.join(' > ');
          }
          
          function getElementInfo(element) {
            return {
              tagName: element.tagName.toLowerCase(),
              id: element.id || null,
              className: element.className || null,
              textContent: element.textContent.substring(0, 100),
              attributes: Array.from(element.attributes).reduce((acc, attr) => {
                acc[attr.name] = attr.value;
                return acc;
              }, {})
            };
          }
          
          function getContextText(range, direction, maxLength) {
            try {
              const container = direction === 'before' ? range.startContainer : range.endContainer;
              const offset = direction === 'before' ? range.startOffset : range.endOffset;
              
              let text = '';
              
              if (container.nodeType === Node.TEXT_NODE) {
                const fullText = container.textContent;
                if (direction === 'before') {
                  text = fullText.substring(Math.max(0, offset - maxLength), offset);
                } else {
                  text = fullText.substring(offset, Math.min(fullText.length, offset + maxLength));
                }
              }
              
              return text.trim();
            } catch (error) {
              return '';
            }
          }
          
          // Prevent default context menu in edit mode
          document.addEventListener('contextmenu', function(event) {
            if (isEditMode) {
              event.preventDefault();
            }
          });
        </script>
      </body>
      </html>
    `;
};

// Convenience function that accepts full HTML and parses it
export function createEnhancedIframeContentFromHTML(fullHTML: string) {
  const parsed = parseBackendHTML(fullHTML);
  return createEnhancedIframeContent(
    parsed.bodyContent,
    parsed.styles,
    parsed.metaTags,
    parsed.linkTags,
  );
}

// Extract modified content from iframe with styles preserved
export function extractModifiedContent(iframe: HTMLIFrameElement | null) {
  if (!iframe || !iframe.contentDocument) {
    return null;
  }

  const iframeDoc = iframe.contentDocument;

  try {
    // Get modified body content
    const bodyHTML = iframeDoc.body.innerHTML;

    // Clean up injected classes using DOM manipulation
    const parser = new DOMParser();
    const tempDoc = parser.parseFromString(
      `<body>${bodyHTML}</body>`,
      "text/html",
    );

    // Remove injected editor classes from all elements
    const injectedClasses = [
      "element-hovered",
      "element-selected",
      "selection-enabled",
    ];
    const allElements = tempDoc.body.querySelectorAll("*");

    allElements.forEach((node) => {
      if (node.className && typeof node.className === "string") {
        const classes = node.className
          .split(" ")
          .filter((c) => c && !injectedClasses.includes(c));
        if (classes.length > 0) {
          node.className = classes.join(" ");
        } else {
          node.removeAttribute("class");
        }
      }
    });

    // Also check body element itself
    if (tempDoc.body.className && typeof tempDoc.body.className === "string") {
      const bodyClasses = tempDoc.body.className
        .split(" ")
        .filter((c) => c && !injectedClasses.includes(c));
      if (bodyClasses.length > 0) {
        tempDoc.body.className = bodyClasses.join(" ");
      } else {
        tempDoc.body.removeAttribute("class");
      }
    }

    const cleanedBodyHTML = tempDoc.body.innerHTML;

    // Extract backend styles from iframe head (exclude editor styles)
    const backendStyles = Array.from(iframeDoc.head.querySelectorAll("style"))
      .filter((style) => {
        const styleId = style.id;
        const styleContent = style.innerHTML;
        // Exclude editor styles (identified by id or content)
        return (
          styleId !== "editor-styles" &&
          !styleContent.includes("selection-enabled") &&
          !styleContent.includes("element-hovered") &&
          !styleContent.includes("element-selected")
        );
      })
      .map((style) => style.innerHTML)
      .join("\n");

    // Get meta tags and link tags from iframe head
    const metaTags = Array.from(iframeDoc.head.querySelectorAll("meta, title"))
      .map((tag) => tag.outerHTML)
      .join("\n");

    const linkTags = Array.from(
      iframeDoc.head.querySelectorAll(
        'link[rel="stylesheet"], link[rel="preconnect"], link[rel="preload"]',
      ),
    )
      .map((link) => link.outerHTML)
      .join("\n");

    // Reconstruct full HTML document
    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    ${metaTags}
    ${linkTags}
    ${backendStyles ? `<style>${backendStyles}</style>` : ""}
</head>
<body>
    ${cleanedBodyHTML}
</body>
</html>`;

    return fullHTML;
  } catch (error) {
    console.error("Error extracting modified content:", error);
    return null;
  }
}

export default createEnhancedIframeContent;
