import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CHIP_STYLES = {
  loading: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  error: "border-destructive/30 bg-destructive/10 text-destructive",
};

const CHIP_ICONS = {
  loading: Loader2,
  success: CheckCircle2,
  error: AlertTriangle,
};

export default function InlineStatusChip({ status, label }) {
  if (!status || !label) return null;

  const Icon = CHIP_ICONS[status];

  return (
    <div
      aria-label={`Paraphraser status: ${label}`}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
        CHIP_STYLES[status],
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", status === "loading" && "animate-spin")} />
      <span>{label}</span>
    </div>
  );
}
