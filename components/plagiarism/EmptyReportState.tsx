import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyReportStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyReportState = ({
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyReportStateProps) => {
  return (
    <Card
      className={cn(
        "bg-muted/30 border-muted-foreground/20 border-dashed",
        className,
      )}
    >
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="space-y-2">
          <h3 className="text-foreground text-base font-semibold">{title}</h3>
          <p className="text-muted-foreground max-w-md text-sm">
            {description}
          </p>
        </div>
        {actionLabel && onAction ? (
          <Button variant="outline" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default EmptyReportState;
