import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Controller, useForm } from "react-hook-form";

const STYLE_OPTIONS = [
  { value: "business", label: "Business" },
  { value: "educational", label: "Educational" },
  { value: "creative", label: "Creative" },
  { value: "minimal", label: "Minimal" },
];

const DELIVERY_OPTIONS = [
  { value: "live", label: "Live Presentation" },
  { value: "export-pdf", label: "Export as PDF" },
  { value: "export-ppt", label: "Export as PPT" },
  { value: "export-html", label: "Export as HTML" },
];

const PresentationAgentForm = ({ onSubmit, defaultValues = {} }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    control,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      topic: "",
      style: "",
      delivery: "",
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label htmlFor="name" className={cn(errors.name && "text-destructive")}>
          Presentation Name
        </Label>
        <Input
          id="name"
          {...register("name", { required: "Presentation name is required" })}
          className={cn(
            errors.name && "border-destructive focus-visible:ring-destructive",
          )}
        />
        {errors.name && (
          <p className="text-destructive text-sm">{errors.name.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          className="min-h-[80px]"
        />
      </div>
      <div className="space-y-2">
        <Label
          htmlFor="topic"
          className={cn(errors.topic && "text-destructive")}
        >
          Content / Topic
        </Label>
        <Textarea
          id="topic"
          {...register("topic", { required: "Content or topic is required" })}
          className={cn(
            "min-h-[80px]",
            errors.topic && "border-destructive focus-visible:ring-destructive",
          )}
        />
        {errors.topic && (
          <p className="text-destructive text-sm">{errors.topic.message}</p>
        )}
      </div>
      <Controller
        name="style"
        control={control}
        rules={{ required: "Style selection is required" }}
        render={({ field, fieldState: { error } }) => (
          <div className="space-y-2">
            <Label htmlFor="style" className={cn(error && "text-destructive")}>
              Style / Theme
            </Label>
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <SelectTrigger
                id="style"
                className={cn(
                  "w-full",
                  error && "border-destructive focus-visible:ring-destructive",
                )}
              >
                <SelectValue placeholder="Select a style" />
              </SelectTrigger>
              <SelectContent>
                {STYLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && (
              <p className="text-destructive text-sm">{error.message}</p>
            )}
          </div>
        )}
      />
      <Controller
        name="delivery"
        control={control}
        rules={{ required: "Delivery option is required" }}
        render={({ field, fieldState: { error } }) => (
          <div className="space-y-2">
            <Label
              htmlFor="delivery"
              className={cn(error && "text-destructive")}
            >
              Delivery Option
            </Label>
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <SelectTrigger
                id="delivery"
                className={cn(
                  "w-full",
                  error && "border-destructive focus-visible:ring-destructive",
                )}
              >
                <SelectValue placeholder="Select a delivery option" />
              </SelectTrigger>
              <SelectContent>
                {DELIVERY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && (
              <p className="text-destructive text-sm">{error.message}</p>
            )}
          </div>
        )}
      />
      <div className="mt-2 flex gap-4">
        <Button type="submit" variant="default" disabled={!isValid}>
          Save
        </Button>
        <Button type="button" variant="outline" onClick={() => reset()}>
          Reset
        </Button>
      </div>
    </form>
  );
};

export default PresentationAgentForm;
