import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CheckCircle, Clock, Eye, Table } from "lucide-react";

const ConversationCard = ({ conversation, onViewData, isActive = false }) => {
  const handleViewClick = () => {
    if (onViewData && conversation.response) {
      onViewData(conversation);
    }
  };

  const getStatusInfo = () => {
    if (conversation.response && conversation.response.rows) {
      return {
        status: "completed",
        icon: <CheckCircle className="h-4 w-4" />,
        color: "default",
        text: `${conversation.response.rows.length} rows`,
      };
    } else if (conversation.response) {
      return {
        status: "completed",
        icon: <CheckCircle className="h-4 w-4" />,
        color: "default",
        text: "Generated",
      };
    } else {
      return {
        status: "pending",
        icon: <Clock className="h-4 w-4" />,
        color: "secondary",
        text: "No response",
      };
    }
  };

  const statusInfo = getStatusInfo();
  const hasData = conversation.response && conversation.response.rows;

  return (
    <Card
      className={cn(
        "mb-2 transition-all duration-200",
        hasData ? "cursor-pointer opacity-100" : "cursor-default opacity-70",
        isActive ? "border-primary border-2" : "border-border border",
        hasData && "hover:border-primary hover:shadow-md",
      )}
      onClick={hasData ? handleViewClick : undefined}
    >
      <CardContent className="p-2 pb-2">
        <div className="flex items-start justify-between">
          <div className="mr-1 min-w-0 flex-1">
            <p
              className={cn(
                "mb-1 line-clamp-2 overflow-hidden text-sm leading-[1.4] text-ellipsis",
                isActive ? "font-semibold" : "font-normal",
              )}
            >
              {conversation.prompt}
            </p>

            <div className="flex flex-wrap items-center gap-1">
              <Badge
                variant={
                  statusInfo.color === "default" ? "default" : "secondary"
                }
                className="h-5 gap-1 text-xs"
              >
                {statusInfo.icon}
                {statusInfo.text}
              </Badge>

              {hasData && (
                <Badge variant="outline" className="h-5 gap-1 text-xs">
                  <Table className="h-3.5 w-3.5" />
                  {`${conversation.response.columns?.length || 0} cols`}
                </Badge>
              )}

              <span className="text-muted-foreground text-xs">
                {new Date(conversation.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          {hasData && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-primary h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewClick();
                  }}
                >
                  <Eye className="h-[18px] w-[18px]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View this data in grid</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversationCard;
