"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { Plus, X, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrainingPanelProps {
  initialData?: {
    persona?: string;
    expertiseAreas?: string[];
    communicationStyle?: "formal" | "casual" | "academic" | "creative";
    goals?: string[];
    languages?: string[];
  };
  onSave: (data: {
    persona: string;
    expertiseAreas: string[];
    communicationStyle: "formal" | "casual" | "academic" | "creative";
    goals: string[];
    languages: string[];
  }) => Promise<void>;
  onTrain: (textSamples?: string[]) => Promise<void>;
  isSaving?: boolean;
  isTraining?: boolean;
  trainingProgress?: number;
  className?: string;
}

const STYLE_VALUES: ("formal" | "casual" | "academic" | "creative")[] = ["formal", "casual", "academic", "creative"];

function TagInput({
  label,
  placeholder,
  tags,
  onChange,
}: {
  label: string;
  placeholder: string;
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const val = input.trim();
    if (val && !tags.includes(val)) {
      onChange([...tags, val]);
    }
    setInput("");
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="flex flex-wrap gap-1.5 min-h-[36px]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary"
          >
            {tag}
            <button
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="ml-1 hover:text-primary/60 transition-colors"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
        />
        <button
          onClick={add}
          aria-label="Add tag"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50 border border-border text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function TrainingPanel({
  initialData = {},
  onSave,
  onTrain,
  isSaving,
  isTraining,
  trainingProgress = 0,
  className,
}: TrainingPanelProps) {
  const { t } = useTranslation();
  const [persona, setPersona] = useState(initialData.persona ?? "");
  const [expertiseAreas, setExpertiseAreas] = useState<string[]>(initialData.expertiseAreas ?? []);
  const [communicationStyle, setCommunicationStyle] = useState<"formal" | "casual" | "academic" | "creative">(
    initialData.communicationStyle ?? "casual"
  );
  const [goals, setGoals] = useState<string[]>(initialData.goals ?? []);
  const [languages, setLanguages] = useState<string[]>(initialData.languages ?? []);
  const [writingSample, setWritingSample] = useState("");
  const [trainError, setTrainError] = useState("");

  const styleOptions = STYLE_VALUES.map((value) => ({
    value,
    label: t(`twinDashboard.${value}`),
    desc: t(`twinDashboard.${value}Desc`),
  }));

  const handleSave = () => {
    onSave({ persona, expertiseAreas, communicationStyle, goals, languages });
  };

  const handleTrain = async () => {
    setTrainError("");
    const samples = writingSample.trim().length > 0 ? [writingSample.trim()] : undefined;
    try {
      await onTrain(samples);
    } catch (err) {
      setTrainError(err instanceof Error ? err.message : "Training failed");
    }
  };

  const wordCount = writingSample.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{t("twinDashboard.describeYourself")}</label>
        <textarea
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
          placeholder={t("twinDashboard.describeYourselfPlaceholder")}
          rows={4}
          className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground resize-none"
        />
        <p className="text-xs text-muted-foreground">{t("twinDashboard.describeYourselfHint")}</p>
      </div>

      <TagInput
        label={t("twinDashboard.expertiseAreas")}
        placeholder={t("twinDashboard.expertisePlaceholder")}
        tags={expertiseAreas}
        onChange={setExpertiseAreas}
      />

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{t("twinDashboard.communicationStyle")}</label>
        <div className="grid grid-cols-2 gap-2">
          {styleOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setCommunicationStyle(opt.value)}
              className={cn(
                "flex flex-col items-start rounded-xl border p-3 text-left transition-all",
                communicationStyle === opt.value
                  ? "border-primary bg-primary/10"
                  : "border-border bg-muted/30 hover:border-muted-foreground/40"
              )}
            >
              <span className={cn("text-sm font-medium", communicationStyle === opt.value ? "text-primary" : "text-foreground")}>
                {opt.label}
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <TagInput
        label={t("twinDashboard.goals")}
        placeholder={t("twinDashboard.goalsPlaceholder")}
        tags={goals}
        onChange={setGoals}
      />

      <TagInput
        label={t("twinDashboard.languages")}
        placeholder={t("twinDashboard.languagesPlaceholder")}
        tags={languages}
        onChange={setLanguages}
      />

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{t("twinDashboard.writingSample")}</label>
        <textarea
          value={writingSample}
          onChange={(e) => setWritingSample(e.target.value)}
          placeholder={t("twinDashboard.writingSamplePlaceholder")}
          rows={6}
          className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground resize-none"
        />
        <p className="text-xs text-muted-foreground">
          {wordCount > 0 ? t("twinDashboard.wordCount", { count: wordCount }) : t("twinDashboard.writingSampleHint")}
        </p>
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("twinDashboard.saving")}</>
          ) : (
            t("twinDashboard.saveProfile")
          )}
        </Button>

        <Button
          variant="outline"
          onClick={handleTrain}
          disabled={isTraining}
          className="w-full border-primary/40 text-primary hover:bg-primary/10"
        >
          {isTraining ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("twinDashboard.training", { progress: trainingProgress })}</>
          ) : (
            <><Sparkles className="mr-2 h-4 w-4" />{t("twinDashboard.trainFromMyWork")}</>
          )}
        </Button>

        {isTraining && (
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              role="progressbar"
              aria-valuenow={trainingProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${trainingProgress}%` }}
            />
          </div>
        )}

        {trainError && (
          <p role="alert" className="text-xs text-destructive">{trainError}</p>
        )}
      </div>
    </div>
  );
}
