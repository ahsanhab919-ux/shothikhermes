import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const RESPONSE_FORMATS = [
  { value: "text", label: "Text" },
  { value: "markdown", label: "Markdown" },
  { value: "json", label: "JSON" },
];

const AgentConfigurationPanel = ({ config, onChange }) => {
  const handleSwitch = (key) => (checked) => {
    onChange({ ...config, [key]: checked });
  };
  const handleSelect = (key) => (value) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <Accordion type="single" collapsible className="mb-2">
      <AccordionItem value="advanced-settings">
        <AccordionTrigger>
          <span className="text-sm font-medium">Advanced Agent Settings</span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="response-format">Response Format</Label>
              <Select
                value={config.responseFormat || "text"}
                onValueChange={handleSelect("responseFormat")}
              >
                <SelectTrigger id="response-format" className="w-full">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {RESPONSE_FORMATS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="verbosity" className="cursor-pointer">
                Verbose Output
              </Label>
              <Switch
                id="verbosity"
                checked={!!config.verbosity}
                onCheckedChange={handleSwitch("verbosity")}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="advanced-mode" className="cursor-pointer">
                Enable Advanced Mode
              </Label>
              <Switch
                id="advanced-mode"
                checked={!!config.advancedMode}
                onCheckedChange={handleSwitch("advancedMode")}
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default AgentConfigurationPanel;
