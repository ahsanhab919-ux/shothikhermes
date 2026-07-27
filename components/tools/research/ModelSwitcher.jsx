import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const ModelSwitcher = ({
  selectedModel,
  setSelectedModel,
  showExperimentalModels,
  attachments,
  models,
}) => {
  const selectedModelData = models.find(
    (model) => model.value === selectedModel,
  );
  const [open, setOpen] = useState(false);

  const handleClose = () => setOpen(false);

  // Check if there are attachments in current or previous messages
  const hasAttachments = attachments.length > 0;

  // Filter models based on attachments and experimental status
  const filteredModels = hasAttachments
    ? models.filter((model) => model.vision)
    : models.filter((model) =>
        showExperimentalModels ? true : !model.experimental,
      );

  // Group models by category
  const groupedModels = filteredModels.reduce((acc, model) => {
    const category = model.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(model);
    return acc;
  }, {});

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Model"
          className={cn(
            "bg-primary/5 text-muted-foreground inline-flex items-center justify-center gap-1 rounded-md p-1 text-xs transition-colors",
            "hover:bg-primary/10 focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-none",
          )}
        >
          {selectedModelData && (
            <Avatar className="size-6">
              <AvatarImage
                src={selectedModelData.icon}
                alt={selectedModelData.label}
              />
            </Avatar>
          )}
          <ChevronDown className="size-4" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="min-w-[220px] rounded-lg border p-1 shadow-md"
      >
        {Object.entries(groupedModels).map(
          ([category, categoryModels], categoryIndex) => (
            <div key={category}>
              {categoryIndex > 0 && <DropdownMenuSeparator className="my-1" />}
              <DropdownMenuLabel className="px-2 py-1.5 text-[11px] font-medium opacity-60">
                {category}
              </DropdownMenuLabel>
              {categoryModels.map((model) => (
                <DropdownMenuItem
                  key={model.value}
                  onClick={() => {
                    setSelectedModel(model.value.trim());
                    handleClose();
                  }}
                  className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors"
                >
                  <div className="bg-muted flex size-6 items-center justify-center rounded-md p-1">
                    <Avatar className="size-6">
                      <AvatarImage src={model.icon} alt={model.label} />
                    </Avatar>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{model.label}</span>
                    <span className="text-[10px] opacity-80">
                      {model.description}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ModelSwitcher;
