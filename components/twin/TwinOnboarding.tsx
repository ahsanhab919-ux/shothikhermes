"use client";

import { useState } from "react";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Brain, ArrowRight, ArrowLeft, Loader2, Plus, X, Check } from "lucide-react";

const COMM_STYLES = ["formal", "casual", "academic", "creative"] as const;

interface TwinOnboardingProps {
  onComplete: (data: {
    name: string;
    communicationStyle: "formal" | "casual" | "academic" | "creative";
    persona?: string;
    expertiseAreas?: string[];
    writingSample?: string;
  }) => Promise<void>;
}

export default function TwinOnboarding({ onComplete }: TwinOnboardingProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [commStyle, setCommStyle] = useState<typeof COMM_STYLES[number]>("casual");
  const [persona, setPersona] = useState("");
  const [expertiseAreas, setExpertiseAreas] = useState<string[]>([]);
  const [expertiseInput, setExpertiseInput] = useState("");
  const [writingSample, setWritingSample] = useState("");

  const addExpertise = () => {
    const val = expertiseInput.trim();
    if (val && !expertiseAreas.includes(val)) {
      setExpertiseAreas([...expertiseAreas, val]);
    }
    setExpertiseInput("");
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await onComplete({
        name: name.trim() || t("twinDashboard.twinNamePlaceholder"),
        communicationStyle: commStyle,
        persona: persona.trim() || undefined,
        expertiseAreas: expertiseAreas.length > 0 ? expertiseAreas : undefined,
        writingSample: writingSample.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const wordCount = writingSample.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="container mx-auto max-w-lg py-12 px-4">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Brain className="h-8 w-8 text-primary" />
        </div>
        <p className="text-xs text-muted-foreground">
          {t("twinDashboard.stepOf", { current: step, total: 3 })}
        </p>
        <div className="flex gap-1.5 justify-center mt-3">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 w-12 rounded-full transition-all",
                s <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">{t("twinDashboard.onboardingStep1Title")}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t("twinDashboard.onboardingStep1Desc")}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t("twinDashboard.twinName")}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("twinDashboard.twinNamePlaceholder")}
              className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t("twinDashboard.communicationStyle")}</label>
            <div className="grid grid-cols-2 gap-2">
              {COMM_STYLES.map((style) => (
                <button
                  key={style}
                  onClick={() => setCommStyle(style)}
                  className={cn(
                    "flex flex-col items-start rounded-xl border p-3 text-left transition-all",
                    commStyle === style
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-muted-foreground/40"
                  )}
                >
                  <span className={cn("text-sm font-medium", commStyle === style ? "text-primary" : "text-foreground")}>
                    {t(`twinDashboard.${style}`)}
                  </span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {t(`twinDashboard.${style}Desc`)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Button onClick={() => setStep(2)} className="w-full" disabled={!name.trim()}>
            {t("twinDashboard.next")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">{t("twinDashboard.onboardingStep2Title")}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t("twinDashboard.onboardingStep2Desc")}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t("twinDashboard.describeYourself")}</label>
            <textarea
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              placeholder={t("twinDashboard.describeYourselfPlaceholder")}
              rows={3}
              className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t("twinDashboard.expertiseAreas")}</label>
            <div className="flex flex-wrap gap-1.5 min-h-[32px]">
              {expertiseAreas.map((tag) => (
                <span key={tag} className="flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
                  {tag}
                  <button onClick={() => setExpertiseAreas(expertiseAreas.filter((t) => t !== tag))} className="ml-1 hover:text-primary/60" aria-label={`Remove ${tag}`}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={expertiseInput}
                onChange={(e) => setExpertiseInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExpertise(); } }}
                placeholder={t("twinDashboard.expertisePlaceholder")}
                className="flex-1 rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              />
              <button onClick={addExpertise} className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted/50 border border-border text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors" aria-label={t("twinDashboard.expertiseAreas")}>
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("twinDashboard.back")}
            </Button>
            <Button onClick={() => setStep(3)} className="flex-1">
              {t("twinDashboard.next")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <button onClick={handleFinish} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors" disabled={saving}>
            {t("twinDashboard.skipForNow")}
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">{t("twinDashboard.onboardingStep3Title")}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t("twinDashboard.onboardingStep3Desc")}</p>
          </div>

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

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("twinDashboard.back")}
            </Button>
            <Button onClick={handleFinish} className="flex-1" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              {t("twinDashboard.finish")}
            </Button>
          </div>

          <button onClick={handleFinish} className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors" disabled={saving}>
            {t("twinDashboard.skipForNow")}
          </button>
        </div>
      )}
    </div>
  );
}
