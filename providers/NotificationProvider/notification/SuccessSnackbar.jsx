import { cn } from "@/lib/utils";
import { CircleCheckIcon, X } from "lucide-react";
import { useEffect } from "react";

export default function SuccessSnackbar({ open, onClose, message }) {
  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }

    onClose();
  };

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onClose();
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[9999] w-full max-w-md">
      <div className="pointer-events-auto">
        <div
          className={cn(
            "flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all",
            "bg-background border-primary text-primary",
          )}
          role="alert"
        >
          <CircleCheckIcon className="text-primary mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1 pr-6 text-sm">{message}</div>
          <button
            onClick={(e) => handleClose(e, "close")}
            className="text-muted-foreground hover:text-foreground absolute top-3 right-3 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
