import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Controller, useFormContext } from "react-hook-form";

export function RHFSelect({
  name,
  label,
  children,
  helperText,
  placeholder = "Select an option",
  className,
  native = false,
  ...other
}) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <div className="space-y-2">
          {label && (
            <Label htmlFor={name} className={cn(error && "text-destructive")}>
              {label}
            </Label>
          )}
          {native ? (
            <select
              {...field}
              id={name}
              className={cn(
                "border-input bg-background ring-offset-background file:text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                error && "border-destructive focus-visible:ring-destructive",
                className,
              )}
              {...other}
            >
              {children}
            </select>
          ) : (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              {...other}
            >
              <SelectTrigger
                id={name}
                className={cn(
                  error && "border-destructive focus:ring-destructive",
                  className,
                )}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent className="max-h-[220px]">
                {children}
              </SelectContent>
            </Select>
          )}
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
      )}
    />
  );
}
