import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Controller, useFormContext } from "react-hook-form";

// ----------------------------------------------------------------------

/**
 * RHFTextField - React Hook Form + shadcn/ui Input
 * Props:
 *  - restrict: "digits" | null   // opt-in input sanitization
 *  - endAdornment: React element to show at end of input
 *  - startAdornment: React element to show at start of input
 *  - border: boolean - show/hide border
 */
export default function RHFTextField({
  name,
  label,
  helperText,
  endAdornment,
  startAdornment,
  readOnly,
  border = true,
  inputProps = {},
  restrict = null,
  type,
  className,
  ...other
}) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        // Normalize value so Input never gets undefined
        const valueForInput = field.value ?? "";

        const callerOnChange = inputProps.onChange;

        const handleChange = (e) => {
          let raw = e?.target?.value;

          // Convert to string if needed
          if (typeof raw !== "string" && raw != null) raw = String(raw);

          let sanitized = raw;

          if (restrict === "digits") {
            sanitized = (raw ?? "").replace(/[^0-9]/g, "");
          }

          // Update react-hook-form value
          field.onChange(sanitized);

          // Call caller's onChange if provided
          if (typeof callerOnChange === "function") {
            try {
              callerOnChange(e);
            } catch (err) {
              // Silently fail to avoid breaking form
            }
          }
        };

        return (
          <div className="space-y-2">
            {label && (
              <Label htmlFor={name} className={cn(error && "text-destructive")}>
                {label}
              </Label>
            )}
            <div className="relative">
              {startAdornment && (
                <div className="absolute top-1/2 left-3 -translate-y-1/2 z-10">
                  {startAdornment}
                </div>
              )}
              <Input
                {...field}
                id={name}
                value={valueForInput}
                onChange={handleChange}
                type={type}
                readOnly={readOnly}
                className={cn(
                  error && "border-destructive focus-visible:ring-destructive",
                  !border && "border-none",
                  startAdornment && "!pl-[56px]",
                  endAdornment && "pr-10",
                  className,
                )}
                style={startAdornment ? { paddingLeft: '56px' } : undefined}
                {...inputProps}
                {...other}
              />
              {endAdornment && (
                <div className="absolute top-1/2 right-3 -translate-y-1/2">
                  {endAdornment}
                </div>
              )}
            </div>
            {(error || helperText) && (
              <p
                className={cn(
                  "text-sm",
                  error ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {error ? error.message : helperText}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}
