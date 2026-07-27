"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Bolt, Cpu, Sparkles } from "lucide-react";
import { useState } from "react";

const MODELS = [
  {
    value: "gemini-2.0-flash",
    label: "2.0 Flash",
    description: "Fast & efficient",
    icon: Bolt,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    value: "gemini-2.5-flash-preview-04-17",
    label: "2.5 Flash",
    description: "Balanced performance",
    icon: Sparkles,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    value: "gemini-2.5-pro-preview-05-06",
    label: "2.5 Pro",
    description: "Highest quality",
    icon: Cpu,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
];

function ModelSelectForResearch() {
  const [model, setModel] = useState("gemini-2.0-flash");

  const selectedModel = MODELS.find((m) => m.value === model);

  return (
    <div>
      <Select value={model} onValueChange={setModel}>
        <SelectTrigger className="bg-muted/50 hover:bg-muted h-9 w-fit gap-2 rounded-full border-0 px-3 shadow-none transition-colors">
          <div className="flex items-center gap-1.5">
            {selectedModel && (
              <selectedModel.icon className={cn("size-3.5", selectedModel.color)} />
            )}
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-xl p-1">
          {MODELS.map((m) => {
            const Icon = m.icon;
            return (
              <SelectItem
                key={m.value}
                value={m.value}
                className="cursor-pointer rounded-lg px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <div className={cn("flex size-7 items-center justify-center rounded-lg", m.bgColor)}>
                    <Icon className={cn("size-3.5", m.color)} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{m.label}</div>
                    <div className="text-muted-foreground text-xs">{m.description}</div>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

export default ModelSelectForResearch;
