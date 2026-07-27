import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InfoIcon, OctagonXIcon, TriangleAlertIcon } from "lucide-react";

const ERROR_TITLES = {
  network: "Network Error",
  validation: "Validation Error",
  server: "Server Error",
  default: "Error",
};

const ERROR_SEVERITY = {
  network: "warning",
  validation: "info",
  server: "error",
  default: "error",
};

const ERROR_ICONS = {
  warning: TriangleAlertIcon,
  info: InfoIcon,
  error: OctagonXIcon,
  default: OctagonXIcon,
};

const ERROR_VARIANTS = {
  warning: "default",
  info: "default",
  error: "destructive",
  default: "destructive",
};

const AgentErrorDisplay = ({
  error,
  type = "default",
  onRetry,
  showRetry = false,
}) => {
  const title = ERROR_TITLES[type] || ERROR_TITLES.default;
  const severity = ERROR_SEVERITY[type] || ERROR_SEVERITY.default;
  const message =
    typeof error === "string"
      ? error
      : error?.message || "An unexpected error occurred.";
  const Icon = ERROR_ICONS[severity] || ERROR_ICONS.default;
  const variant = ERROR_VARIANTS[severity] || ERROR_VARIANTS.default;

  return (
    <div className="my-4">
      <Alert variant={variant} className="items-center">
        <Icon className="size-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className={cn(showRetry && onRetry && "mb-4")}>
          {message}
        </AlertDescription>
        {showRetry && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="col-start-2 mt-2"
          >
            Retry
          </Button>
        )}
      </Alert>
    </div>
  );
};

export default AgentErrorDisplay;
