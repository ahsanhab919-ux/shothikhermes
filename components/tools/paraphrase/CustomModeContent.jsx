// src/components/tools/paraphrase/CustomModeContent.jsx
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Reusable content component for creating/editing custom modes
 * Used in both modal and popover contexts
 */
const CustomModeContent = ({
  mode = "create", // 'create' or 'edit'
  existingModeName = "",
  recentModes = [],
  recommendedModes = [],
  onSubmit,
  onDelete,
  onClose,
  error = null,
  isLoading = false,
  showHeader = true,
  showActions = true,
}) => {
  const [modeName, setModeName] = useState(existingModeName);
  const [localError, setLocalError] = useState(null);


  useEffect(() => {
    setModeName(existingModeName);
  }, [existingModeName]);

  useEffect(() => {
    setLocalError(error);
  }, [error]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setModeName(value);
    setLocalError(null);
  };

  const handleSubmit = () => {
    const trimmed = modeName.trim();

    if (!trimmed) {
      setLocalError("Please enter a mode name");
      return;
    }

    if (trimmed.length < 2) {
      setLocalError("Mode name must be at least 2 characters");
      return;
    }

    if (trimmed.length > 30) {
      setLocalError("Mode name must be less than 30 characters");
      return;
    }

    onSubmit(trimmed);
  };

  const handleQuickSelect = (name) => {
    setModeName(name);
    setLocalError(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full">
      {showHeader && (
        <div className="mb-2 flex items-center justify-between">
          <div className="text-base font-semibold">
            {mode === "create" ? "Create Custom Mode" : "Edit Custom Mode"}
          </div>
        </div>
      )}

      {/* Input Field */}
      <div className="mb-6">
        <Label htmlFor="mode-name">Mode Name</Label>
        <div className="relative mt-2">
          <Input
            id="mode-name"
            placeholder="e.g., Conversational, Technical"
            value={modeName}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            autoFocus
            disabled={isLoading}
            className={cn(
              Boolean(localError) &&
                "border-destructive focus-visible:ring-destructive",
            )}
          />
          {isLoading && (
            <Loader2 className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin" />
          )}
        </div>
        <p
          className={cn(
            "mt-2 text-xs",
            localError ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {localError || "Enter a descriptive name for your custom mode"}
        </p>
      </div>

      {/* Error Alert */}
      {localError && (
        <div className="mb-2">
          <Alert
            variant="destructive"
            className="flex items-start justify-between"
          >
            <AlertDescription className="pr-6">{localError}</AlertDescription>
            <button
              type="button"
              onClick={() => setLocalError(null)}
              className="hover:bg-destructive/20 ml-2 inline-flex h-5 w-5 items-center justify-center rounded-sm"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </Alert>
        </div>
      )}

      {/* Recent Modes */}
      {recentModes.length > 0 && (
        <div className="mb-6">
          <div className="text-muted-foreground mb-1 text-[12px]">
            Recently Used
          </div>
          <div className="flex flex-row flex-wrap gap-2">
            {recentModes.map((recent, index) => (
              <Badge
                key={index}
                onClick={() => handleQuickSelect(recent)}
                className="hover:bg-primary/10 cursor-pointer"
              >
                {recent}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Modes */}
      {recommendedModes.length > 0 && (
        <div className="mb-6">
          <div className="text-muted-foreground mb-1 text-[12px]">
            Recommended Modes
          </div>
          <div className="flex flex-row flex-wrap gap-2">
            {recommendedModes.map((recommended, index) => (
              <Badge
                key={index}
                variant="outline"
                onClick={() => handleQuickSelect(recommended)}
                className="hover:bg-primary/10 hover:border-primary cursor-pointer"
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> {recommended}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {showActions && (
        <>
          <Separator className="my-2" />
          <div className="flex items-center justify-between gap-2">
            <div>
              {mode === "edit" && onDelete && (
                <Button
                  variant="destructive"
                  onClick={onDelete}
                  disabled={isLoading}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onClose && (
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleSubmit}
                disabled={!modeName.trim() || isLoading}
              >
                {mode === "create" ? (
                  <>
                    <Plus className="mr-2 h-4 w-4" /> Create Mode
                  </>
                ) : (
                  <>
                    <Pencil className="mr-2 h-4 w-4" /> Update Mode
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomModeContent;
