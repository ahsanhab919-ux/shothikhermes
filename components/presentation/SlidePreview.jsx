// components/SlidePreview.jsx
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAutoSave } from "@/hooks/presentation/useAutoSave";
import { useSlideEditor } from "@/hooks/presentation/useSlideEditor";
import { createEnhancedIframeContentFromHTML } from "@/lib/presentationEditScripts";
import { sanitizeHtml } from "@/lib/sanitize";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";
import { Check, Copy } from "lucide-react";
import dynamic from "next/dynamic";
import React, { useEffect, useRef, useState } from "react";
import { AlignmentGuidesSkeleton } from "./editing/AlignmentGuidesSkeleton";
import { EditingErrorBoundary } from "./editing/EditingErrorBoundary";
import { EditingToolbarSkeleton } from "./editing/EditingToolbarSkeleton";
import { GridOverlaySkeleton } from "./editing/GridOverlaySkeleton";
import { ResizeHandlesSkeleton } from "./editing/ResizeHandlesSkeleton";
import { SaveStatusIndicator } from "./editing/SaveStatusIndicator";

// Lazy load editing components for code splitting
const AlignmentGuides = dynamic(
  () =>
    import("./editing/AlignmentGuides").then((mod) => ({
      default: mod.AlignmentGuides,
    })),
  {
    loading: () => <AlignmentGuidesSkeleton />,
    ssr: false,
  },
);

const EditingToolbar = dynamic(
  () =>
    import("./editing/EditingToolbar").then((mod) => ({
      default: mod.EditingToolbar,
    })),
  {
    loading: () => <EditingToolbarSkeleton />,
    ssr: false,
  },
);

const GridOverlay = dynamic(
  () =>
    import("./editing/GridOverlay").then((mod) => ({
      default: mod.GridOverlay,
    })),
  {
    loading: () => <GridOverlaySkeleton />,
    ssr: false,
  },
);

const ResizeHandles = dynamic(
  () =>
    import("./editing/ResizeHandles").then((mod) => ({
      default: mod.ResizeHandles,
    })),
  {
    loading: () => <ResizeHandlesSkeleton />,
    ssr: false,
  },
);

// Original slide dimensions
const SLIDE_WIDTH = 1280;
const SLIDE_HEIGHT = 720;
const SLIDE_ASPECT_RATIO = SLIDE_WIDTH / SLIDE_HEIGHT;

export default function SlidePreview({
  slide,
  index,
  activeTab,
  onTabChange,
  totalSlides,
  presentationId,
}) {
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
    scale: 1,
  });
  const [copied, setCopied] = useState(false);
  const [showSelectionAlert, setShowSelectionAlert] = useState(false);
  const [gridEnabled, setGridEnabled] = useState(false);
  const [alignmentGuides, setAlignmentGuides] = useState([]);

  const containerRef = useRef(null);
  const iframeRef = useRef(null);

  // Get slide ID for editing
  const slideId =
    slide?.id || slide?.slideNumber?.toString() || `slide-${index}`;

  // Use the editing hook for state management
  const {
    isEditing: isEditMode,
    selectedElement,
    startEditMode,
    stopEditMode,
  } = useSlideEditor(slideId, iframeRef);

  // Auto-save hook
  const autoSave = useAutoSave(
    slideId,
    presentationId,
    iframeRef,
    {
      enabled: isEditMode, // Only auto-save when in edit mode
      debounceMs: 10000, // 10 seconds
    },
    index,
  );

  // 

  // Copy to clipboard function
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        slide.body || slide.html_content || slide.htmlContent,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const htmlContent = slide?.body || slide?.html_content || slide?.htmlContent;
  const hasHtml =
    typeof htmlContent === "string" && htmlContent.trim().length > 0;

  // EDIT LOGIC STARTS
  const handleEditSlide = () => {
    if (isEditMode) {
      stopEditMode();
    } else {
      startEditMode();
      setShowSelectionAlert(true);
    }
  };

  function captureElementAsImageFromIframe(elementPath) {
    const iframeDoc =
      iframeRef.current?.contentDocument ||
      iframeRef.current?.contentWindow?.document;
    if (!iframeDoc) return;

    const targetElement = iframeDoc.querySelector(elementPath);
    if (!targetElement) {
      console.warn("Element not found in iframe for path:", elementPath);
      return;
    }

    html2canvas(targetElement).then((canvas) => {
      const imageData = canvas.toDataURL("image/jpeg"); // or "image/png"
      // Optionally do something with the image, like saving, copying, previewing
    });
  }

  // Note: Element selection messages are now handled by useSlideEditor hook
  // The hook automatically processes ELEMENT_SELECTED messages and updates Redux state

  // Update iframe pointer events based on edit mode
  const iframeStyle = {
    width: `${SLIDE_WIDTH}px`,
    height: `${SLIDE_HEIGHT}px`,
    transform: `scale(${dimensions.scale})`,
    transformOrigin: "center center",
    border: isEditMode ? "2px solid hsl(var(--primary))" : "none",
    display: "block",
    pointerEvents: isEditMode ? "auto" : "none",
    transition: "transform 0.2s ease-in-out, border 0.2s ease-in-out",
    flexShrink: 0,
    margin: 0,
    padding: 0,
  };
  // EDIT LOGIC ENDS

  // Calculate scale factor to fit the iframe within the container
  const calculateScale = (containerWidth) => {
    const viewportWidth = window.innerWidth;

    // For mobile devices, use a more aggressive scaling
    if (viewportWidth < 768) {
      // Ensure minimum scale for readability on mobile
      const minScale = 0.25;
      const calculatedScale = containerWidth / SLIDE_WIDTH;
      return Math.max(calculatedScale, minScale);
    }

    // For larger screens, use the container width
    return containerWidth / SLIDE_WIDTH;
  };

  // Calculate the container height based on the scaled iframe
  const calculateContainerHeight = (scale) => {
    const scaledHeight = SLIDE_HEIGHT * scale;
    const viewportHeight = window.innerHeight;

    // Set reasonable min/max heights
    const minHeight = 150;
    const maxHeight = Math.min(600, viewportHeight * 0.6);

    return Math.min(Math.max(scaledHeight, minHeight), maxHeight);
  };

  // Update dimensions when container resizes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const scale = calculateScale(rect.width);
        const height = calculateContainerHeight(scale);

        setDimensions({
          width: rect.width,
          height: height,
          scale: scale,
        });
      }
    };

    // Use timeout to ensure container is fully rendered
    const timeoutId = setTimeout(updateDimensions, 100);

    // Create ResizeObserver for more accurate resize detection
    const resizeObserver = new ResizeObserver(() => {
      // Debounce resize events
      clearTimeout(timeoutId);
      setTimeout(updateDimensions, 50);
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Listen to window resize for viewport changes
    window.addEventListener("resize", updateDimensions);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, [activeTab]); // Re-run when tab changes

  // Load Prism.js for syntax highlighting
  useEffect(() => {
    if (activeTab === "code") {
      // Load Prism CSS
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css";
      document.head.appendChild(link);

      // Load Prism JS
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js";
      script.onload = () => {
        // Load HTML language support
        const htmlScript = document.createElement("script");
        htmlScript.src =
          "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-markup.min.js";
        htmlScript.onload = () => {
          // Load CSS language support
          const cssScript = document.createElement("script");
          cssScript.src =
            "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-css.min.js";
          cssScript.onload = () => {
            // Load JavaScript language support
            const jsScript = document.createElement("script");
            jsScript.src =
              "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js";
            jsScript.onload = () => {
              // Highlight all code blocks
              if (window.Prism) {
                window.Prism.highlightAll();
              }
            };
            document.head.appendChild(jsScript);
          };
          document.head.appendChild(cssScript);
        };
        document.head.appendChild(htmlScript);
      };
      document.head.appendChild(script);
    }
  }, [activeTab]);

  return (
    <Card className="overflow-hidden rounded-lg py-0 shadow-md">
      <CardContent className="p-0">
        <Tabs
          value={activeTab}
          onValueChange={(newValue) => onTabChange(index, newValue)}
          className="gap-0"
        >
          <div className="border-border bg-card flex flex-row items-center justify-between overflow-hidden border-b px-2 py-2">
            <TabsList className="h-auto bg-transparent p-0">
              <TabsTrigger
                value="preview"
                className="data-[state=active]:text-primary text-xs sm:text-sm"
              >
                Preview
              </TabsTrigger>
              <TabsTrigger
                value="thinking"
                className="data-[state=active]:text-primary text-xs sm:text-sm"
              >
                Thinking
              </TabsTrigger>
              <TabsTrigger
                value="code"
                className="data-[state=active]:text-primary text-xs sm:text-sm"
              >
                Code
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-row items-center gap-1 md:gap-2 lg:gap-3 xl:gap-4">
              {/* Save Status Indicator - only show in edit mode */}
              {isEditMode && (
                <SaveStatusIndicator
                  saveStatus={autoSave.saveStatus}
                  lastSavedAt={autoSave.lastSavedAt}
                  errorMessage={autoSave.errorMessage}
                  onManualSave={autoSave.saveSlide}
                  hasUnsavedChanges={autoSave.hasUnsavedChanges}
                />
              )}

              {/* When edit mode will be on then we will need this. So don't remove it */}
              <Button
                variant={isEditMode ? "default" : "outline"}
                size="sm"
                className="px-2 py-0.5 text-xs"
                onClick={handleEditSlide}
              >
                {isEditMode ? "Exit" : "Edit"}
              </Button>
              {/* Slide number indicator */}
              <span className="text-muted-foreground text-xs font-medium">
                {slide?.slideNumber !== undefined
                  ? slide.slideNumber
                  : index + 1}
                /{totalSlides}
              </span>
            </div>
          </div>

          <TabsContent value="preview" className="m-0 p-0">
            <div
              ref={containerRef}
              style={{ height: `${dimensions.height}px` }}
              className={cn(
                "relative m-0 flex w-full items-center justify-center overflow-hidden p-0",
                "transition-all duration-300",
                isEditMode ? "bg-accent/20" : "bg-muted/30",
              )}
            >
              {dimensions.scale > 0 && (
                <EditingErrorBoundary
                  context={{
                    slideId,
                    operation: "iframe-render",
                    componentName: "SlidePreview-iframe",
                  }}
                >
                  {hasHtml ? (
                    <iframe
                      ref={iframeRef}
                      srcDoc={createEnhancedIframeContentFromHTML(htmlContent)}
                      style={iframeStyle}
                      title={`Slide ${slide.slide_index + 1}`}
                      sandbox="allow-scripts allow-same-origin"
                    />
                  ) : (
                    <div
                      style={iframeStyle}
                      className="bg-muted/30 flex h-full w-full items-center justify-center rounded"
                    >
                      <div className="flex w-[85%] max-w-[900px] flex-col gap-3">
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-40 w-full" />
                        <div className="mt-2 flex items-center gap-2">
                          <Skeleton className="h-8 w-24" />
                          <Skeleton className="h-8 w-16" />
                        </div>
                      </div>
                    </div>
                  )}
                </EditingErrorBoundary>
              )}

              {/* Resize Handles - appears when element is selected */}
              {isEditMode && selectedElement && (
                <EditingErrorBoundary
                  context={{
                    slideId,
                    elementPath: selectedElement.elementPath,
                    operation: "resize",
                    componentName: "ResizeHandles",
                  }}
                >
                  <ResizeHandles
                    selectedElement={selectedElement}
                    iframeRef={iframeRef}
                    containerRef={containerRef}
                    iframeScale={dimensions.scale}
                    onResize={(width, height) => {
                      // TODO: Track change in Redux for undo/redo
                    }}
                  />
                </EditingErrorBoundary>
              )}

              {/* Grid Overlay - appears when grid is enabled */}
              {isEditMode && gridEnabled && (
                <EditingErrorBoundary
                  context={{
                    slideId,
                    operation: "grid-overlay",
                    componentName: "GridOverlay",
                  }}
                >
                  <GridOverlay
                    containerRef={containerRef}
                    iframeRef={iframeRef}
                    iframeScale={dimensions.scale}
                    enabled={gridEnabled}
                    gridSize={20}
                  />
                </EditingErrorBoundary>
              )}

              {/* Alignment Guides - appears when dragging */}
              {isEditMode && alignmentGuides.length > 0 && (
                <EditingErrorBoundary
                  context={{
                    slideId,
                    operation: "alignment-guides",
                    componentName: "AlignmentGuides",
                  }}
                >
                  <AlignmentGuides
                    containerRef={containerRef}
                    iframeRef={iframeRef}
                    guides={alignmentGuides}
                    enabled={true}
                  />
                </EditingErrorBoundary>
              )}

              {/* Editing Toolbar - appears when element is selected */}
              {isEditMode && selectedElement && (
                <EditingErrorBoundary
                  context={{
                    slideId,
                    elementPath: selectedElement.elementPath,
                    operation: "editing",
                    componentName: "EditingToolbar",
                  }}
                >
                  <EditingToolbar
                    slideId={slideId}
                    selectedElement={selectedElement}
                    iframeRef={iframeRef}
                    iframeScale={dimensions.scale}
                    onGridToggle={setGridEnabled}
                    onAlignmentGuidesChange={setAlignmentGuides}
                    onSave={() => autoSave.saveSlide()}
                  />
                </EditingErrorBoundary>
              )}

              {/* Edit mode indicator */}
              {isEditMode && (
                <div className="bg-primary text-primary-foreground absolute top-2 left-2 z-10 rounded px-2 py-1 text-xs font-bold">
                  EDIT MODE - Click on elements to edit
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="thinking" className="m-0 p-0">
            <EnhancedThinkingTab slide={slide} dimensions={dimensions} />
          </TabsContent>
          <TabsContent value="code" className="m-0 p-0">
            <div
              style={{
                minHeight: `${dimensions.height}px`,
                maxHeight: `${dimensions.height}px`,
              }}
              className="bg-secondary relative rounded"
            >
              {/* Copy button */}
              <div className="absolute top-2 right-2 z-10">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleCopy}
                        size="sm"
                        variant="secondary"
                        className="bg-secondary-foreground/10 text-secondary-foreground hover:bg-secondary-foreground/20 h-8 w-8 p-0"
                      >
                        {copied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{copied ? "Copied!" : "Copy code"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Enhanced code display */}
              <pre
                style={{
                  margin: 0,
                  padding: "16px",
                  paddingTop: "48px", // Space for copy button
                  // backgroundColor: "transparent",
                  borderRadius: 8,
                  overflow: "auto",
                  maxHeight: `${dimensions.height}px`,
                  fontSize: "14px",
                  lineHeight: "1.5",
                  fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
                className="text-secondary-foreground"
              >
                <code className="language-html">
                  {hasHtml
                    ? htmlContent
                    : "<!-- Code not generated yet. Please wait... -->"}
                </code>
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Selection feedback snackbar */}
      {/* <Snackbar
        open={showSelectionAlert}
        autoHideDuration={4000}
        onClose={() => setShowSelectionAlert(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setShowSelectionAlert(false)}
          severity="info"
          sx={{ width: "100%" }}
        >
          Edit mode enabled. Hover over elements and click to select them.
        </Alert>
      </Snackbar> */}
    </Card>
  );
}

// =========== UTILITY FUNCTIONS 👇 ===========

const parseSimpleMarkdown = (text) => {
  if (!text) return text;

  return (
    text
      // Headers
      .replace(
        /^### (.*$)/gm,
        '<h3 style="margin: 16px 0 8px 0; font-size: 1.1em; font-weight: 600; color: hsl(var(--primary));">$1</h3>',
      )
      .replace(
        /^## (.*$)/gm,
        '<h2 style="margin: 18px 0 10px 0; font-size: 1.2em; font-weight: 600; color: hsl(var(--primary));">$1</h2>',
      )
      .replace(
        /^# (.*$)/gm,
        '<h1 style="margin: 20px 0 12px 0; font-size: 1.3em; font-weight: 600; color: hsl(var(--primary));">$1</h1>',
      )

      // Bold and italic
      .replace(
        /\*\*(.*?)\*\*/g,
        '<strong style="font-weight: 600; color: hsl(var(--primary));">$1</strong>',
      )
      .replace(
        /\*(.*?)\*/g,
        '<em style="font-style: italic; color: hsl(var(--muted-foreground));">$1</em>',
      )

      // Code blocks
      .replace(
        /```([\s\S]*?)```/g,
        '<pre style="background: hsl(var(--muted)); padding: 12px; border-radius: 4px; margin: 12px 0; overflow-x: auto; font-family: monospace; font-size: 0.9em; border-left: 4px solid hsl(var(--primary));"><code>$1</code></pre>',
      )

      // Inline code
      .replace(
        /`(.*?)`/g,
        '<code style="background: hsl(var(--muted)); padding: 2px 4px; border-radius: 3px; font-family: monospace; font-size: 0.9em; color: hsl(var(--accent-foreground));">$1</code>',
      )

      // Lists
      .replace(
        /^\* (.*$)/gm,
        '<li style="margin: 4px 0; padding-left: 8px;">$1</li>',
      )
      .replace(
        /^\- (.*$)/gm,
        '<li style="margin: 4px 0; padding-left: 8px;">$1</li>',
      )

      // Links
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" style="color: hsl(var(--primary)); text-decoration: none;" target="_blank" rel="noopener">$1</a>',
      )

      // Line breaks
      .replace(/\n\n/g, "<br><br>")
      .replace(/\n/g, "<br>")
  );
};

const EnhancedThinkingTab = ({ slide, dimensions }) => {
  const [processedContent, setProcessedContent] = useState("");

  // 

  useEffect(() => {
    if (slide?.thinking) {
      const parsed = parseSimpleMarkdown(slide.thinking);
      setProcessedContent(parsed);
    }
  }, [slide.thinking]);

  return (
    <div
      style={{
        maxHeight: `${dimensions.height}px`,
        minHeight: `${dimensions.height}px`,
      }}
      className={cn(
        "bg-muted/10 relative overflow-y-auto rounded p-3",
        "[&::-webkit-scrollbar]:w-2",
        "[&::-webkit-scrollbar-track]:bg-muted/20",
        "[&::-webkit-scrollbar-track]:rounded",
        "[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20",
        "[&::-webkit-scrollbar-thumb]:rounded",
        "[&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/30",
      )}
    >
      {/* Content */}
      <div
        className={cn(
          "[&_h1]:font-[inherit] [&_h2]:font-[inherit] [&_h3]:font-[inherit]",
          "[&_p]:my-2 [&_p]:leading-[1.6]",
          "[&_ol]:my-2 [&_ol]:pl-5 [&_ul]:my-2 [&_ul]:pl-5",
          "[&_li]:mb-1",
          "[&_pre]:font-mono",
          "[&_blockquote]:border-primary [&_blockquote]:text-muted-foreground [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:italic",
          "text-xs sm:text-sm lg:text-base",
        )}
      >
        {processedContent ? (
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(processedContent) }} />
        ) : (
          <p className="text-muted-foreground text-[0.9em] leading-[1.6] whitespace-pre-wrap">
            {slide?.thought}
          </p>
        )}
      </div>
    </div>
  );
};
