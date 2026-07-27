import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  History as HistoryIcon,
  XCircle,
} from "lucide-react";
import React from "react";

const STATUS_ICONS = {
  success: CheckCircle2,
  error: XCircle,
  pending: Clock,
  default: HistoryIcon,
};

const STATUS_LABELS = {
  success: "Success",
  error: "Error",
  pending: "Pending",
  default: "Unknown",
};

function formatTimestamp(ts) {
  const date = new Date(ts);
  return date.toLocaleString();
}

const AgentHistoryList = ({ history = [], onSelect }) => {
  return (
    <div className="bg-background w-full rounded-lg shadow-sm">
      {history.length === 0 && (
        <div className="flex items-center gap-3 p-4">
          <HistoryIcon className="text-muted-foreground h-5 w-5" />
          <span className="text-muted-foreground text-sm">No history yet.</span>
        </div>
      )}
      {history.map((item, idx) => {
        const status = item.status || "default";
        const IconComponent = STATUS_ICONS[status] || STATUS_ICONS.default;
        const getBadgeVariant = () => {
          if (status === "success") return "default";
          if (status === "error") return "destructive";
          if (status === "pending") return "secondary";
          return "outline";
        };
        const getIconColor = () => {
          if (status === "success") return "text-primary";
          if (status === "error") return "text-destructive";
          if (status === "pending") return "text-muted-foreground";
          return "text-muted-foreground";
        };
        return (
          <React.Fragment key={item.id || idx}>
            <div
              className={cn(
                "flex items-start gap-3 p-4 transition-colors",
                onSelect && "hover:bg-accent cursor-pointer",
              )}
              onClick={onSelect ? () => onSelect(item) : undefined}
            >
              <IconComponent
                className={cn("mt-0.5 h-5 w-5 shrink-0", getIconColor())}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    {item.query || "No query"}
                  </span>
                  <Badge variant={getBadgeVariant()} className="shrink-0">
                    {STATUS_LABELS[status] || STATUS_LABELS.default}
                  </Badge>
                </div>
                <span className="text-muted-foreground text-xs">
                  {formatTimestamp(item.timestamp)}
                </span>
              </div>
            </div>
            {idx < history.length - 1 && (
              <div className="border-border mx-4 border-b" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default AgentHistoryList;
