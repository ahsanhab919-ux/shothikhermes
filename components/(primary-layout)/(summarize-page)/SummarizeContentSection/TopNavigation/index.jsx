import { StepRange } from "@/components/common/StepRange";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const TopNavigation = ({
  className,
  selectedMode,
  setSelectedMode,
  modes,
  LENGTH,
  currentLength,
  setCurrentLength,
}) => {
  // Convert LENGTH object to steps array for StepRange
  const lengthSteps = Object.keys(LENGTH)
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => ({
      label: LENGTH[key],
      value: LENGTH[key],
    }));

  // Find the selected mode object to display its name
  const selectedModeObj = modes?.find((tab) => tab.name === selectedMode);

  return (
    <div
      className={cn(
        "flex h-12 flex-row items-center justify-between gap-6 px-4 py-1",
        className,
      )}
    >
      {/* Mode Tabs - Desktop */}
      <div className="hidden flex-1 items-center gap-2 md:flex md:flex-auto md:gap-x-4">
        {modes?.map((tab) => (
          <button
            key={tab.name}
            onClick={() => setSelectedMode(tab.name)}
            className={cn(
              "flex shrink-0 cursor-pointer items-center gap-1 text-xs leading-none font-medium whitespace-nowrap md:text-sm",
              selectedMode === tab.name
                ? "text-primary"
                : "text-muted-foreground",
            )}
          >
            {tab?.icon && (
              <span className="text-base leading-none md:text-xl">
                {tab.icon}
              </span>
            )}
            <span className="leading-none">{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Mode Menu - Mobile */}
      <div className="flex flex-1 items-center md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "border-input bg-background ring-offset-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              )}
            >
              {selectedModeObj?.icon && (
                <span className="text-base leading-none">
                  {selectedModeObj.icon}
                </span>
              )}
              <span className="whitespace-nowrap">
                {selectedModeObj?.name || "Select Mode"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {modes?.map((tab) => (
              <DropdownMenuItem
                key={tab.name}
                onClick={() => setSelectedMode(tab.name)}
                className={cn(
                  "flex cursor-pointer items-center gap-2",
                  selectedMode === tab.name &&
                    "bg-accent text-accent-foreground",
                )}
              >
                {tab?.icon && (
                  <span className="text-base leading-none">{tab.icon}</span>
                )}
                <span className="whitespace-nowrap">{tab.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Length Control */}
      <div className="flex max-w-xs flex-1 items-center gap-2 md:flex-auto">
        <span className="hidden text-sm font-medium sm:inline-block">
          Length:
        </span>
        <StepRange
          value={currentLength}
          onChange={setCurrentLength}
          steps={lengthSteps}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default TopNavigation;
