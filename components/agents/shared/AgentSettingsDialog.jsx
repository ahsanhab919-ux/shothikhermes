import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const MODEL_OPTIONS = [
  { value: "gemini-pro", label: "Gemini Pro" },
  { value: "gemini-ultra", label: "Gemini Ultra" },
];

const AgentSettingsDialog = ({ open, onClose, settings = {}, onSave }) => {
  const [form, setForm] = useState({
    apiEndpoint: "",
    defaultModel: "",
    darkMode: false,
    ...settings,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm({
      apiEndpoint: "",
      defaultModel: "",
      darkMode: false,
      ...settings,
    });
    setErrors({});
  }, [open, settings]);

  const handleChange = (key) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectChange = (value) => {
    setForm((prev) => ({ ...prev, defaultModel: value }));
  };

  const handleSwitchChange = (checked) => {
    setForm((prev) => ({ ...prev, darkMode: checked }));
  };

  const validate = () => {
    const errs = {};
    if (!form.apiEndpoint) errs.apiEndpoint = "API endpoint is required";
    if (!form.defaultModel) errs.defaultModel = "Default model is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave(form);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-xs">
        <DialogHeader>
          <DialogTitle>Agent Global Settings</DialogTitle>
        </DialogHeader>
        <div className={cn("mt-1 flex flex-col gap-4")}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="apiEndpoint">API Endpoint</Label>
            <Input
              id="apiEndpoint"
              value={form.apiEndpoint}
              onChange={handleChange("apiEndpoint")}
              className={cn(
                errors.apiEndpoint &&
                  "border-destructive focus-visible:ring-destructive",
              )}
            />
            {errors.apiEndpoint && (
              <p className="text-destructive text-sm">{errors.apiEndpoint}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="defaultModel">Default Model</Label>
            <Select
              value={form.defaultModel || undefined}
              onValueChange={handleSelectChange}
            >
              <SelectTrigger
                id="defaultModel"
                className={cn(
                  "w-full",
                  errors.defaultModel &&
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
            {errors.defaultModel && (
              <p className="text-destructive text-sm">{errors.defaultModel}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="darkMode"
              checked={form.darkMode}
              onCheckedChange={handleSwitchChange}
            />
            <Label htmlFor="darkMode" className="cursor-pointer">
              Enable Dark Mode
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="default">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AgentSettingsDialog;
