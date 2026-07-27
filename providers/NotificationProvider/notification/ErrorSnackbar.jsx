import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import * as React from "react";

export default function ErrorSnackbar({ open, onClose, message }) {
  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onClose();
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [open, onClose]);

  const handleClose = (event) => {
    if (event?.type === "click" && event?.target === event?.currentTarget) {
      return;
    }

    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] max-w-[400px] min-w-[300px]">
      <Alert variant="destructive" className={cn("relative w-full shadow-lg")}>
        <AlertDescription className="pr-8 text-sm">{message}</AlertDescription>
        <button
          onClick={handleClose}
          className="text-muted-foreground hover:text-foreground absolute top-3 right-3 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </Alert>
    </div>
  );
}
