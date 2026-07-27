import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { Bot, Presentation } from "lucide-react";

const AGENT_TYPES = [
  {
    value: "super",
    label: "Super Agent",
    Icon: Bot,
  },
  {
    value: "presentation",
    label: "Presentation Agent",
    Icon: Presentation,
  },
];

const AgentTypeSelector = ({ value, onChange }) => {
  return (
    <div>
      <h3 className="mb-1 text-sm font-medium">Select Agent Type</h3>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(newValue) => newValue && onChange(newValue)}
        className="inline-flex"
      >
        {AGENT_TYPES.map((type) => {
          const Icon = type.Icon;
          return (
            <ToggleGroupItem
              key={type.value}
              value={type.value}
              aria-label={type.label}
              className={cn(
                "inline-flex min-w-[160px] items-center justify-center gap-2",
              )}
            >
              <Icon className="size-4" />
              <span>{type.label}</span>
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </div>
  );
};

export default AgentTypeSelector;
