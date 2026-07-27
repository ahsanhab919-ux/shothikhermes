"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import { WRITING_TEMPLATES } from "../constants";

export function WritingTemplates({ onApply }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">Writing Templates</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Start with a pre-built structure for your document
      </p>
      <div className="space-y-2">
        {WRITING_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => setSelectedTemplate(selectedTemplate === template.id ? null : template.id)}
            className={cn(
              "w-full p-3 rounded-lg border text-left transition-all",
              selectedTemplate === template.id
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <template.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">{template.name}</h4>
                <p className="text-xs text-muted-foreground">{template.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
      {selectedTemplate && (
        <Button
          onClick={() => {
            const template = WRITING_TEMPLATES.find(t => t.id === selectedTemplate);
            if (template && onApply) {
              onApply(template.content);
              setSelectedTemplate(null);
              toast.success(`${template.name} template applied!`);
            }
          }}
          className="w-full"
          size="sm"
        >
          <FileText className="h-4 w-4 mr-2" />
          Apply Template
        </Button>
      )}
    </div>
  );
}
