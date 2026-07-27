// src/components/tools/paraphrase/CustomModePopover.jsx
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import CustomModeContent from "./CustomModeContent";

/**
 * Popover wrapper for editing existing custom modes
 * Shows when user clicks on a custom mode tab
 */
const CustomModePopover = ({
  anchorEl,
  open,
  onClose,
  modeName,
  recentModes,
  recommendedModes,
  onUpdate,
  onDelete,
  error,
  isLoading,
}) => {
  const handleUpdate = (newName) => {
    onUpdate(newName);
  };

  const handleDelete = () => {
    // Don't call onClose here - let the parent handle it
    // This prevents the popover from snapping to top-left during deletion
    onDelete();
  };

  // Create virtual ref for PopoverAnchor to position relative to anchorEl
  // Handle both DOM element and virtual object with getBoundingClientRect
  const virtualRef = useMemo(() => {
    if (!anchorEl) return null;
    // If anchorEl is a DOM element, use it directly
    if (anchorEl.getBoundingClientRect) {
      return { current: anchorEl };
    }
    // If anchorEl is a virtual object with getBoundingClientRect method, create a wrapper
    return { current: anchorEl };
  }, [anchorEl]);

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      {/* Use PopoverAnchor with virtualRef to position the popover relative to the clicked tab */}
      {/* Show anchor if we have either a DOM element or a virtual object with getBoundingClientRect */}
      {virtualRef && <PopoverAnchor virtualRef={virtualRef} />}
      <PopoverContent
        side="bottom"
        align="center"
        className={cn("w-full max-w-[500px] rounded-2xl p-0 shadow-md")}
      >
        <div className="p-2.5">
          <CustomModeContent
            mode="edit"
            existingModeName={modeName}
            recentModes={recentModes}
            recommendedModes={recommendedModes}
            onSubmit={handleUpdate}
            onDelete={handleDelete}
            onClose={onClose}
            error={error}
            isLoading={isLoading}
            showHeader={true}
            showActions={true}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CustomModePopover;
