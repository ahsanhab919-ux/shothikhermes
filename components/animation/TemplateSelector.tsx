"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  previewUrl?: string;
}

interface TemplateSelectorProps {
  templates: Template[];
  selected: string;
  onSelect: (id: string) => void;
}

export default function TemplateSelector({
  templates,
  selected,
  onSelect,
}: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <Card
          key={template.id}
          className={cn(
            "cursor-pointer transition-all hover:shadow-md relative overflow-hidden",
            selected === template.id
              ? "ring-2 ring-primary border-primary"
              : "border-border hover:border-primary/50"
          )}
          onClick={() => onSelect(template.id)}
        >
          {/* Selection Indicator */}
          {selected === template.id && (
            <div className="absolute top-2 right-2 z-10">
              <div className="bg-primary text-primary-foreground rounded-full p-1">
                <Check className="h-4 w-4" />
              </div>
            </div>
          )}

          {/* Preview Image */}
          <div className="aspect-video bg-muted relative">
            {template.previewUrl ? (
              <img
                src={template.previewUrl}
                alt={template.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to placeholder
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <span className="text-4xl font-bold text-primary/20">
                  {template.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-4">
            <h3 className="font-semibold mb-1">{template.name}</h3>
            <p className="text-sm text-muted-foreground">
              {template.description}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}
