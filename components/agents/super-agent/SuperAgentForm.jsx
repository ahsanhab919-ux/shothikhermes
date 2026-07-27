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

const MODEL_OPTIONS = [
  { value: "gemini-pro", label: "Gemini Pro" },
  { value: "gemini-ultra", label: "Gemini Ultra" },
];

const SuperAgentForm = ({ onSubmit, defaultValues = {} }) => {
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
      apiKey: "",
      model: "",
      temperature: 0.7,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
      <div className="space-y-2">
        <Label htmlFor="name" className={cn(errors.name && "text-destructive")}>
          Agent Name
        </Label>
        <Input
          id="name"
          {...register("name", { required: "Agent name is required" })}
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
        <Textarea id="description" {...register("description")} rows={2} />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="apiKey"
          className={cn(errors.apiKey && "text-destructive")}
        >
          API Key
        </Label>
        <Input
          id="apiKey"
          type="password"
          {...register("apiKey", { required: "API key is required" })}
          className={cn(
            errors.apiKey &&
              "border-destructive focus-visible:ring-destructive",
          )}
        />
        {errors.apiKey && (
          <p className="text-destructive text-sm">{errors.apiKey.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="model-label"
          className={cn(errors.model && "text-destructive")}
        >
          Model
        </Label>
        <Controller
          name="model"
          control={control}
          rules={{ required: "Model selection is required" }}
          render={({ field }) => (
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <SelectTrigger
                id="model-label"
                className={cn(
                  "w-full",
                  errors.model &&
                    "border-destructive focus-visible:ring-destructive",
                )}
              >
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {MODEL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.model && (
          <p className="text-destructive text-sm">{errors.model.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="temperature"
          className={cn(errors.temperature && "text-destructive")}
        >
          Temperature
        </Label>
        <Input
          id="temperature"
          type="number"
          min={0}
          max={1}
          step={0.01}
          {...register("temperature", {
            valueAsNumber: true,
            min: { value: 0, message: "Min is 0" },
            max: { value: 1, message: "Max is 1" },
          })}
          className={cn(
            errors.temperature &&
              "border-destructive focus-visible:ring-destructive",
          )}
        />
        {errors.temperature ? (
          <p className="text-destructive text-sm">
            {errors.temperature.message}
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">
            Controls randomness (0 = deterministic, 1 = very random)
          </p>
        )}
      </div>

      <div className="mt-2 flex gap-2">
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

export default SuperAgentForm;
