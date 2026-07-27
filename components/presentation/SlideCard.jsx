import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";

const SLIDE_WIDTH = 1280;
const SLIDE_HEIGHT = 720;

export const SlideCard = ({ slide, index, totalSlides }) => {
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
    scale: 1,
  });
  const containerRef = useRef(null);

  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;

      // Calculate scale based on available width
      const scale = containerWidth / SLIDE_WIDTH;
      const height = SLIDE_HEIGHT * scale;

      setDimensions({
        width: containerWidth,
        height,
        scale,
      });
    }
  }, []);

  useEffect(() => {
    // Initial calculation
    updateDimensions();

    // Set up ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      // Use requestAnimationFrame to avoid performance issues
      requestAnimationFrame(() => {
        updateDimensions();
      });
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Also listen to window resize as a fallback
    const handleWindowResize = () => {
      requestAnimationFrame(() => {
        updateDimensions();
      });
    };

    window.addEventListener("resize", handleWindowResize);

    // Delay initial calculation to ensure DOM is ready
    const timeoutId = setTimeout(updateDimensions, 100);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleWindowResize);
      clearTimeout(timeoutId);
    };
  }, [updateDimensions]);

  return (
    <div className="w-full">
      <Card
        className={cn(
          "my-6 min-h-0 w-full overflow-hidden rounded-lg py-0 shadow-lg",
        )}
      >
        <CardContent className="p-0 last:pb-0">
          <div className="bg-muted flex items-center justify-between border-b px-3 py-2 sm:px-4">
            <h3 className="text-sm font-semibold md:text-lg lg:text-xl">
              Slide {index + 1}
            </h3>
            <span className="text-muted-foreground text-xs lg:text-sm">
              {index + 1} / {totalSlides}
            </span>
          </div>

          <div
            ref={containerRef}
            className="bg-muted/50 relative flex w-full items-center justify-center overflow-hidden transition-[height] duration-200 ease-in-out"
            style={{
              height: dimensions.height > 0 ? `${dimensions.height}px` : "auto",
            }}
          >
            {dimensions.scale > 0 && slide?.body ? (
              <iframe
                srcDoc={slide.body}
                style={{
                  width: `${SLIDE_WIDTH}px`,
                  height: `${SLIDE_HEIGHT}px`,
                  transform: `scale(${dimensions.scale})`,
                  transformOrigin: "center center",
                  transition: "transform 0.2s ease-in-out",
                  flexShrink: 0,
                  border: "none",
                  display: "block",
                  pointerEvents: "none",
                  backgroundColor: "white",
                }}
                title={`Slide ${index + 1}`}
              />
            ) : (
              <div className="text-muted-foreground flex h-[200px] w-full items-center justify-center">
                <span className="text-sm">Loading slide...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
