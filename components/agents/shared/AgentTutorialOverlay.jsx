import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const LOCAL_STORAGE_KEY = "agents_tutorial_completed";

// Example step: { title, description, targetSelector, image, icon }
const defaultSteps = [
  {
    title: "Welcome to Agents!",
    description:
      "This tutorial will guide you through the main features of the Agents UI.",
  },
  {
    title: "Sidebar Navigation",
    description:
      "Use the sidebar to switch between different agents and features.",
    targetSelector: "#agent-sidebar",
  },
  {
    title: "Agent Actions",
    description: "Interact with agents using the action buttons and forms.",
    targetSelector: "#agent-action-buttons",
  },
  {
    title: "History & Settings",
    description: "Review your history and adjust settings from the top right.",
    targetSelector: "#agent-settings",
  },
];

const AgentTutorialOverlay = ({
  open,
  onClose,
  steps = defaultSteps,
  initialStep = 0,
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completed, setCompleted] = useState(false);
  const [highlightRect, setHighlightRect] = useState(null);

  useEffect(() => {
    if (open) {
      setCurrentStep(initialStep);
      setCompleted(false);
    }
  }, [open, initialStep]);

  useEffect(() => {
    if (!open) return;
    const step = steps[currentStep];
    if (step && step.targetSelector) {
      const el = document.querySelector(step.targetSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        setHighlightRect({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
      } else {
        setHighlightRect(null);
      }
    } else {
      setHighlightRect(null);
    }
  }, [open, currentStep, steps]);

  useEffect(() => {
    if (completed) {
      localStorage.setItem(LOCAL_STORAGE_KEY, "true");
      onClose && onClose();
    }
  }, [completed, onClose]);

  useEffect(() => {
    // Prevent background scroll when overlay is open
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      setCompleted(true);
    } else {
      setCurrentStep((s) => s + 1);
    }
  };
  const handleBack = () => {
    setCurrentStep((s) => (s > 0 ? s - 1 : 0));
  };
  const handleSkip = () => {
    setCompleted(true);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handleBack();
      if (e.key === "Escape") handleSkip();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, currentStep, isLast]);

  // Only return null after all hooks
  if (!open || completed) return null;

  return (
    <>
      {/* Highlighted element - rendered in portal to ensure correct z-index */}
      {highlightRect &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            className={cn(
              "pointer-events-none fixed z-[1402] rounded-lg transition-all duration-300",
            )}
            style={{
              top: highlightRect.top,
              left: highlightRect.left,
              width: highlightRect.width,
              height: highlightRect.height,
              boxShadow: "0 0 0 4px hsl(var(--primary) / 0.67)",
            }}
          />,
          document.body,
        )}
      {/* Tutorial Dialog */}
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleSkip()}>
        <DialogContent
          className={cn("z-[1403] w-full max-w-xs")}
          showCloseButton={false}
        >
          <DialogHeader className="relative pr-10">
            <DialogTitle id="tutorial-dialog-title">{step.title}</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close tutorial"
              onClick={handleSkip}
              className={cn("absolute top-0 right-0 h-9 w-9")}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="space-y-4">
            <p className="mb-2 text-base">{step.description}</p>
            {step.image && (
              <div className="mb-2 text-center">
                <img
                  src={step.image}
                  alt="Tutorial step"
                  className="max-w-full"
                />
              </div>
            )}
            {step.icon && <div className="mb-2 text-center">{step.icon}</div>}
          </div>
          <DialogFooter>
            <Button onClick={handleSkip} variant="outline">
              Skip
            </Button>
            <Button
              onClick={handleBack}
              disabled={currentStep === 0}
              variant="ghost"
            >
              Back
            </Button>
            <Button onClick={handleNext} variant="default">
              {isLast ? "Finish" : "Next"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AgentTutorialOverlay;
