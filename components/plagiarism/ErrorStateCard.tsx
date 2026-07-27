import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface ErrorStateCardProps {
  message: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

const ErrorStateCard = ({
  message,
  description,
  onRetry,
  retryLabel = "Retry scan",
  className,
}: ErrorStateCardProps) => {
  return (
    <Card className={cn("border-destructive/40 bg-destructive/5", className)} role="alert" aria-live="assertive">
      <CardHeader className="flex flex-row items-start gap-3">
        <span className="bg-destructive/15 text-destructive rounded-full p-2">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </span>
        <div>
          <CardTitle className="text-destructive text-lg">{message}</CardTitle>
          {description ? (
            <CardDescription className="mt-1">{description}</CardDescription>
          ) : null}
        </div>
      </CardHeader>
      {onRetry ? (
        <CardContent>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="border-destructive/30 text-destructive"
          >
            {retryLabel}
          </Button>
        </CardContent>
      ) : null}
    </Card>
  );
};

export default ErrorStateCard;
