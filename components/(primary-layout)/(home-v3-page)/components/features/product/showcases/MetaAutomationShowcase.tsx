"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function MetaAutomationShowcase() {
  const [open, setOpen] = useState(false);
  const [agentStage, setAgentStage] = useState(0);

  const stages = [
    {
      title: "Product Analysis",
      description: "Extracting product data and competitor landscape",
      progress: 15,
    },
    {
      title: "AI Personas & Campaigns",
      description: "Generating targeted personas and campaign structure",
      progress: 30,
    },
    {
      title: "Vibe Canvas - Ad Creatives",
      description: "Creating compelling ad copy and variations",
      progress: 50,
    },
    {
      title: "Media Canvas Generation",
      description: "Generating UGC, influencers, and content formats",
      progress: 70,
    },
    {
      title: "Campaign Launch",
      description: "Publishing to Facebook with targeting configuration",
      progress: 90,
    },
    {
      title: "Dashboard & Optimization",
      description: "Live insights, mindmap learning, and AI suggestions",
      progress: 100,
    },
  ];

  useEffect(() => {
    if (open && agentStage < 5) {
      const timer = setTimeout(() => {
        setAgentStage(agentStage + 1);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [open, agentStage]);

  const handleOpen = () => {
    setAgentStage(0);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setAgentStage(0);
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        size="lg"
        data-testid="button-try-meta-demo"
        className="rounded-lg bg-[#1877F2] text-sm font-semibold text-white hover:bg-[#0C63D4]"
      >
        Try Interactive Demo
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-background h-[80vh] max-w-6xl gap-0 p-0 dark:bg-gray-900">
          <div className="flex h-full">
            <div className="border-border w-80 overflow-y-auto border-r bg-gray-50 p-6 dark:bg-gray-800">
              <p className="text-caption text-muted-foreground mb-6 block font-bold">
                META AUTOMATION PIPELINE
              </p>

              <div className="flex flex-col gap-4">
                {stages.map((stage, index) => (
                  <div
                    key={index}
                    className={`rounded-lg border p-4 transition-all ${
                      index <= agentStage
                        ? "border-[#1877F2] bg-[rgba(24,119,242,0.05)] opacity-100"
                        : "border-border bg-transparent opacity-50"
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      {index < agentStage ? (
                        <CheckCircle2 size={16} color="#1877F2" />
                      ) : index === agentStage ? (
                        <Loader2
                          size={16}
                          color="#1877F2"
                          className="animate-spin"
                        />
                      ) : (
                        <div className="border-border h-4 w-4 rounded-full border" />
                      )}
                      <p className="text-body2 text-foreground font-semibold">
                        {stage.title}
                      </p>
                    </div>
                    <p className="text-caption text-muted-foreground mb-3 block">
                      {stage.description}
                    </p>
                    {index <= agentStage && (
                      <div className="h-1 overflow-hidden rounded bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-full bg-[#1877F2] transition-all duration-1000"
                          style={{
                            width: `${index < agentStage ? 100 : stage.progress}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-1 flex-col">
              <div className="border-border flex items-center justify-between border-b px-8 py-6">
                <div>
                  <h3 className="text-h6 text-foreground font-bold">
                    Meta Automation Agent
                  </h3>
                  <p className="text-body2 text-muted-foreground">
                    From product link to live campaigns automatically
                  </p>
                </div>
                <Button
                  onClick={handleClose}
                  variant="ghost"
                  size="icon"
                  data-testid="button-close-meta-demo"
                  className="text-muted-foreground"
                >
                  <X size={20} />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {agentStage === 5 ? (
                  <div className="py-16 text-center">
                    <CheckCircle2
                      size={64}
                      color="#1877F2"
                      className="mx-auto"
                    />
                    <h4 className="text-h4 mt-6 mb-4 font-bold">
                      Campaign Live!
                    </h4>
                    <p className="text-body1 text-muted-foreground mb-8">
                      Your Meta ads campaign is now running with AI-powered
                      optimization
                    </p>
                    <div className="mx-auto grid max-w-2xl grid-cols-4 gap-6">
                      {[
                        { value: "2.4K", label: "Impressions" },
                        { value: "156", label: "Clicks" },
                        { value: "12", label: "Conversions" },
                        { value: "3.2x", label: "ROAS" },
                      ].map((stat, i) => (
                        <div
                          key={i}
                          className="border-border rounded-lg border bg-gray-50 p-6 dark:bg-gray-800"
                        >
                          <p className="text-h5 font-bold text-[#1877F2]">
                            {stat.value}
                          </p>
                          <p className="text-caption text-muted-foreground">
                            {stat.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto max-w-2xl">
                    <h5 className="text-h5 mb-4 text-center font-bold">
                      {stages[agentStage].title}
                    </h5>
                    <p className="text-body2 text-muted-foreground mb-8 text-center">
                      {stages[agentStage].description}
                    </p>
                    <div className="border-border rounded-xl border bg-gray-50 p-8 dark:bg-gray-800">
                      <div className="mb-6 flex items-center gap-4">
                        <Loader2
                          size={20}
                          color="#1877F2"
                          className="animate-spin"
                        />
                        <p className="text-body2 font-semibold">
                          Processing...
                        </p>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-full bg-[#1877F2] transition-all duration-1000"
                          style={{
                            width: `${stages[agentStage].progress}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
