"use client";

import { Paperclip, Send, Square, X } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ComposerAttachment {
  id: string;
  name: string;
  preview?: string;
  status?: "ready" | "uploading" | "error";
  error?: string;
}

export interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
  generating?: boolean;
  placeholder?: string;
  modelHandle?: string;
  onModelChange?: (value: string) => void;
  footer?: string;
  attachments?: ComposerAttachment[];
  onAttachFiles?: (files: FileList | File[]) => void;
  onRemoveAttachment?: (attachmentId: string) => void;
  commandHint?: {
    name: string;
    description: string;
  } | null;
  errorMessage?: string | null;
}

export const Composer = forwardRef<HTMLTextAreaElement, ComposerProps>(function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  disabled,
  isStreaming,
  generating,
  placeholder,
  modelHandle,
  onModelChange,
  footer,
  attachments = [],
  onAttachFiles,
  onRemoveAttachment,
  commandHint,
  errorMessage,
}: ComposerProps, ref) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeStreaming = isStreaming ?? generating ?? false;

  useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [value]);

  return (
    <div className="border-t bg-background p-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        {attachments.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className={cn(
                  "flex max-w-full items-start gap-2 rounded-xl border px-3 py-2 text-left text-xs",
                  attachment.status === "error"
                    ? "border-destructive/40 bg-destructive/5 text-destructive"
                    : "border-border bg-muted/40 text-foreground",
                )}
              >
                <Paperclip className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{attachment.name}</p>
                  <p className="text-muted-foreground truncate">
                    {attachment.status === "uploading"
                      ? "Preparing attachment..."
                      : attachment.error || attachment.preview || "Ready for this turn"}
                  </p>
                </div>
                {onRemoveAttachment ? (
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => onRemoveAttachment(attachment.id)}
                    aria-label={`Remove ${attachment.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <label className="text-muted-foreground text-xs">Model</label>
          <select
            value={modelHandle ?? "gemini-2.5-flash"}
            onChange={(event) => onModelChange?.(event.target.value)}
            className="border-input bg-background h-9 rounded-md border px-3 text-sm"
            disabled={disabled || activeStreaming}
          >
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
          </select>
        </div>
        <div className="flex items-end gap-3 rounded-2xl border bg-muted/30 p-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.txt,.md,text/plain,text/markdown,application/pdf"
            className="hidden"
            onChange={(event) => {
              if (!event.target.files?.length) return;
              onAttachFiles?.(event.target.files);
              event.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || activeStreaming}
            aria-label="Attach files"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSubmit();
              }
            }}
            placeholder={placeholder ?? "Ask anything..."}
            disabled={disabled}
            className="min-h-[52px] max-h-40 w-full resize-none border-0 bg-transparent text-sm shadow-none outline-none"
          />
          {activeStreaming ? (
            <Button type="button" variant="outline" size="icon" onClick={onStop} aria-label="Stop generating">
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              onClick={onSubmit}
              disabled={disabled || !value.trim()}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
        {commandHint ? (
          <div className="flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/5 px-3 py-2 text-xs text-foreground">
            <span className="rounded-full bg-brand/10 px-2 py-0.5 font-medium text-brand">
              /{commandHint.name}
            </span>
            <span>{commandHint.description}</span>
          </div>
        ) : null}
        {errorMessage ? (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
          >
            {errorMessage}
          </div>
        ) : null}
        {footer ? <p className="text-center text-xs text-muted-foreground">{footer}</p> : null}
      </div>
    </div>
  );
});
