// src/components/tools/paraphrase/CustomModeModal.jsx
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import CustomModeContent from "./CustomModeContent";

/**
 * Modal wrapper for creating custom modes
 */
const CustomModeModal = ({
  open,
  onClose,
  recentModes,
  recommendedModes,
  onSubmit,
  error,
  isLoading,
}) => {
  const handleSubmit = (modeName) => {
    onSubmit(modeName);
    // Modal will be closed by parent component after successful submission
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose?.();
      }}
    >
      <DialogContent
        className={cn(
          // spacing equivalent to MUI p:3 (24px)
          "p-6",
          // width and rounding similar to maxWidth=\"sm\" and fullWidth
          "w-full sm:max-w-[640px]",
          // full-screen feel on small screens, rounded on larger
          "rounded-none sm:rounded-lg",
        )}
      >
        <CustomModeContent
          mode="create"
          recentModes={recentModes}
          recommendedModes={recommendedModes}
          onSubmit={handleSubmit}
          onClose={onClose}
          error={error}
          isLoading={isLoading}
          showHeader={true}
          showActions={true}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CustomModeModal;
