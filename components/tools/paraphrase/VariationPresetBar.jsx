import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VariationPresetBar({
  presets,
  activePresetId,
  onApplyPreset,
}) {
  if (!presets?.length) return null;

  return (
    <div className="px-4 pb-3">
      <div className="rounded-2xl border border-border bg-card/80 p-3">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand" />
          <div>
            <p className="text-sm font-semibold text-foreground">Variation presets</p>
            <p className="text-xs text-muted-foreground">
              Quick-start language styles built on top of the current paraphraser engine.
            </p>
          </div>
        </div>

        <div className="grid gap-2 lg:grid-cols-3">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApplyPreset(preset)}
              aria-pressed={activePresetId === preset.id}
              className={cn(
                "rounded-xl border p-3 text-left transition-all",
                activePresetId === preset.id
                  ? "border-brand/40 bg-brand/10"
                  : "border-border bg-background hover:border-border/80 hover:bg-card",
              )}
            >
              <p className="text-sm font-semibold text-foreground">{preset.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{preset.description}</p>
              <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                {preset.mode} · {preset.synonymLabel}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
