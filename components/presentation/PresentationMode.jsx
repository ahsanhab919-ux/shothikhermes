import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const SLIDE_WIDTH = 1280;
const SLIDE_HEIGHT = 720;

export const PresentationMode = ({ slides, open, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const containerRef = useRef(null);

  // Reset index when modal is opened
  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
    }
  }, [open]);

  // Function to calculate the correct scale for the slide to fit in the window
  const updateScale = useCallback(() => {
    if (open && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const availableWidth = containerRect.width;
      const availableHeight = containerRect.height;

      // Calculate scale to fit both width and height, maintaining aspect ratio
      const scaleX = availableWidth / SLIDE_WIDTH;
      const scaleY = availableHeight / SLIDE_HEIGHT;
      const newScale = Math.min(scaleX, scaleY, 1.2); // Don't scale above 1.2

      setScale(newScale);
    }
  }, [open]);

  // Recalculate scale on window resize or when the modal opens
  useEffect(() => {
    if (!open) return;

    updateScale();

    const handleResize = () => {
      updateScale();
    };

    window.addEventListener("resize", handleResize);

    // Also update scale after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(updateScale, 100);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, [open, updateScale]);

  // Use ResizeObserver for more precise container size tracking
  useEffect(() => {
    if (!open || !containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        updateScale();
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [open, updateScale]);

  // Navigation handlers
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Set up event listeners for keyboard and mouse navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") onClose();
    };

    const handleContextMenu = (e) => {
      e.preventDefault(); // Prevent the default right-click menu
      handlePrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);

    // Cleanup listeners when the component unmounts or closes
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [open, slides.length, onClose]);

  if (!slides || slides.length === 0) {
    return null;
  }

  const currentSlide = slides[currentIndex];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="bg-foreground" />
        <DialogPrimitive.Content
          className={cn(
            "bg-foreground fixed inset-0 z-50 flex h-screen w-screen max-w-none cursor-pointer items-center justify-center overflow-hidden rounded-none border-0 p-0 outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        >
          <div
            ref={containerRef}
            onClick={handleNext}
            className="relative flex h-full w-full cursor-pointer items-center justify-center overflow-hidden outline-none"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation(); // Prevent the click from advancing the slide
                onClose();
              }}
              className="text-background bg-foreground/50 hover:bg-foreground/80 absolute top-4 right-4 z-[1000] rounded-full p-2 transition-colors"
              aria-label="Close presentation"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Scaled Slide Iframe */}
            <div
              className="bg-muted shrink-0 shadow-2xl transition-transform duration-300 ease-in-out"
              style={{
                width: `${SLIDE_WIDTH}px`,
                height: `${SLIDE_HEIGHT}px`,
                transform: `scale(${scale})`,
                transformOrigin: "center center",
              }}
            >
              <iframe
                srcDoc={currentSlide.body}
                className="pointer-events-none block h-full w-full border-0"
                title={`Slide ${currentIndex + 1}`}
              />
            </div>

            {/* Slide Counter */}
            <span className="text-background bg-foreground/50 absolute bottom-5 left-1/2 z-[1000] -translate-x-1/2 rounded-lg px-4 py-2 font-sans">
              {currentIndex + 1} / {slides.length}
            </span>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};
