import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Save, Send, X } from "lucide-react";

const AgentActionButtons = ({
  onSubmit,
  onClear,
  onSave,
  disabled = false,
  showSave = false,
  loading = false,
}) => {
  return (
    <div className="mt-4 flex items-center gap-2">
      <Button
        onClick={onSubmit}
        disabled={disabled || loading}
        variant="default"
        className="flex items-center gap-2"
      >
        {loading ? (
          <>
            <Spinner className="size-4" />
            <span>Submitting...</span>
          </>
        ) : (
          <>
            <Send className="size-4" />
            <span>Submit</span>
          </>
        )}
      </Button>
      <Button
        onClick={onClear}
        variant="outline"
        className="flex items-center gap-2"
      >
        <X className="size-4" />
        <span>Clear</span>
      </Button>
      {showSave && (
        <Button
          onClick={onSave}
          variant="default"
          className="flex items-center gap-2"
        >
          <Save className="size-4" />
          <span>Save</span>
        </Button>
      )}
    </div>
  );
};

export default AgentActionButtons;
