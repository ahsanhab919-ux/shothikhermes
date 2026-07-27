import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const AgentPromptInput = ({
  value,
  onChange,
  maxLength = 500,
  label = "Prompt",
  helperText = "",
  ...props
}) => {
  const charCount = value ? value.length : 0;
  const isError = charCount > maxLength;

  return (
    <div className="w-full">
      {label && (
        <Label className="mb-2 block text-sm font-medium">{label}</Label>
      )}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        aria-invalid={isError}
        className="resize-none"
        {...props}
      />
      <div className="mt-2 flex items-center justify-between">
        {isError ? (
          <span className="text-destructive text-sm">
            Maximum length is {maxLength} characters.
          </span>
        ) : helperText ? (
          <span className="text-muted-foreground text-sm">{helperText}</span>
        ) : (
          <span className="text-muted-foreground text-sm">&nbsp;</span>
        )}
        <span
          className={cn(
            "text-xs",
            isError ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {charCount} / {maxLength}
        </span>
      </div>
    </div>
  );
};

export default AgentPromptInput;
