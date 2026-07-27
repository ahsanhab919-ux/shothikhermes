import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/ui/useMobile";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Clock, History } from "lucide-react";
import { useEffect, useState } from "react";

const SavePointsDropdown = ({
  savePoints,
  activeSavePointId,
  onSavePointChange,
}) => {
  const isMobile = useIsMobile();

  const [selectedValue, setSelectedValue] = useState(
    activeSavePointId || "current",
  );

  const handleChange = (value) => {
    setSelectedValue(value);
    if (value === "current") return;

    const selectedSavePoint = savePoints.find((sp) => sp.id === value);
    if (selectedSavePoint && onSavePointChange) {
      onSavePointChange(selectedSavePoint);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="text-primary h-[18px] w-[18px]" />;
      case "error":
        return <AlertCircle className="text-destructive h-[18px] w-[18px]" />;
      case "generating":
        return <Clock className="text-primary h-[18px] w-[18px]" />;
      default:
        return <History className="text-muted-foreground h-[18px] w-[18px]" />;
    }
  };

  const getDisplayText = (value) => {
    if (value === "current") return "Current Data";
    const savePoint = savePoints.find((sp) => sp.id === value);
    return savePoint ? savePoint.title : "Unknown";
  };

  // sync internal state with Redux / parent
  useEffect(() => {
    if (
      activeSavePointId &&
      savePoints.some((sp) => sp.id === activeSavePointId)
    ) {
      setSelectedValue(activeSavePointId);
    } else if (!activeSavePointId) {
      setSelectedValue("current");
    } else if (!savePoints.some((sp) => sp.id === selectedValue)) {
      setSelectedValue("current");
    }
  }, [activeSavePointId, savePoints]);

  return (
    <Select value={selectedValue} onValueChange={handleChange}>
      <SelectTrigger
        className={cn(
          "bg-background text-foreground h-9 gap-2",
          isMobile ? "min-w-[160px]" : "min-w-[200px]",
          "max-w-[240px]",
        )}
      >
        <SelectValue>
          {(() => {
            const savePoint =
              selectedValue === "current"
                ? null
                : savePoints.find((sp) => sp.id === selectedValue);
            const status = savePoint?.generations.find(
              (g) => g.id === savePoint.activeGenerationId,
            )?.status;

            return (
              <div className="flex items-center gap-2 overflow-hidden">
                {getStatusIcon(
                  selectedValue === "current" ? "completed" : status,
                )}
                <span className="text-foreground flex-shrink truncate text-sm font-medium">
                  {getDisplayText(selectedValue)}
                </span>
              </div>
            );
          })()}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="current">
          <span className="text-foreground text-sm">Current Data</span>
        </SelectItem>

        {savePoints.map((sp) => {
          const activeGen = sp.generations.find(
            (g) => g.id === sp.activeGenerationId,
          );
          return (
            <SelectItem key={sp.id} value={sp.id}>
              <div className="overflow-hidden">
                <span className="text-foreground block max-w-[180px] overflow-hidden text-sm text-ellipsis whitespace-nowrap">
                  {sp.title}
                </span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export default SavePointsDropdown;
