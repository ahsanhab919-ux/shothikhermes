"use client";

import { AlertCircle, Bot, CheckCircle2, Command, Link2, Loader2, Paperclip, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageActions } from "./MessageActions";
import { MarkdownMessage } from "./MarkdownMessage";
import { getSlashCommandDisplayText } from "@/lib/chat/commands";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/chat/types";

interface TranscriptProps {
  messages: ChatMessage[];
  isStreaming?: boolean;
  onCopy?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => void;
  onRegenerate?: (message: ChatMessage) => void;
  onStop?: (message: ChatMessage) => void;
  className?: string;
}

export function Transcript({
  messages,
  isStreaming,
  onCopy,
  onDelete,
  onRegenerate,
  onStop,
  className,
}: TranscriptProps) {
  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="space-y-4 p-4" aria-live={isStreaming ? "polite" : "off"}>
        {messages.map((message) => {
          const isUser = message.role === "user";
          const canRegenerate = message.role === "assistant" && message.status !== "streaming";
          const canStop = message.role === "assistant" && message.status === "streaming";
          const slashCommand = isUser ? getSlashCommandDisplayText(message.content) : null;
          const displayContent = slashCommand ? slashCommand.body : message.content;
          const progress = message.metadata?.progress ?? [];
          const inlineError = message.metadata?.inlineError;
          const statusLabel = message.metadata?.statusLabel;

          return (
            <div key={message._id} className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                isUser ? "bg-primary text-primary-foreground" : "bg-brand/10 text-brand"
              )}>
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={cn("max-w-[85%] space-y-2", isUser ? "items-end" : "items-start")}>
                <div className={cn(
                  "rounded-2xl border px-4 py-3 text-sm shadow-sm",
                  isUser
                    ? "bg-primary text-primary-foreground rounded-tr-sm border-primary"
                    : "bg-background rounded-tl-sm border-border"
                )}>
                  {slashCommand ? (
                    <div className="mb-3 inline-flex items-center gap-1 rounded-full border border-current/15 bg-background/10 px-2.5 py-1 text-[11px] font-medium">
                      <Command className="h-3.5 w-3.5" />
                      <span>/{slashCommand.command.name}</span>
                    </div>
                  ) : null}
                  {message.metadata?.attachments?.length ? (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {message.metadata.attachments.map((attachment) => {
                        const isUrl = attachment.kind === "url";
                        return (
                          <div
                            key={attachment.id}
                            className={cn(
                              "inline-flex max-w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs",
                              isUser
                                ? "border-primary-foreground/20 bg-primary-foreground/10"
                                : "border-border bg-muted/40",
                            )}
                          >
                            {isUrl ? <Link2 className="h-3.5 w-3.5 shrink-0" /> : <Paperclip className="h-3.5 w-3.5 shrink-0" />}
                            <span className="truncate">{attachment.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                  {!isUser && (statusLabel || progress.length > 0) ? (
                    <div className="mb-3 rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
                      {statusLabel ? (
                        <p className="text-xs font-medium text-foreground">{statusLabel}</p>
                      ) : null}
                      {progress.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {progress.map((item) => {
                            const icon =
                              item.state === "completed" ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              ) : item.state === "error" ? (
                                <AlertCircle className="h-3.5 w-3.5" />
                              ) : item.state === "active" ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <div className="h-2 w-2 rounded-full bg-muted-foreground/60" />
                              );

                            return (
                              <span
                                key={item.id}
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px]",
                                  item.state === "completed" && "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                                  item.state === "active" && "border-brand/20 bg-brand/10 text-brand",
                                  item.state === "error" && "border-destructive/30 bg-destructive/10 text-destructive",
                                  item.state === "pending" && "border-border bg-background text-muted-foreground",
                                )}
                                title={item.detail}
                              >
                                {icon}
                                <span>{item.label}</span>
                              </span>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {message.contentFormat === "markdown" && !isUser ? (
                    <MarkdownMessage
                      content={
                        displayContent ||
                        (message.status === "streaming"
                          ? "Waiting for Hermes..."
                          : slashCommand
                            ? "Spec request"
                            : "")
                      }
                    />
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {displayContent ||
                        (message.status === "streaming"
                          ? "Waiting for Hermes..."
                          : slashCommand
                            ? "Spec request"
                            : "")}
                    </p>
                  )}
                  {inlineError ? (
                    <div
                      role="alert"
                      className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
                    >
                      {inlineError.message}
                    </div>
                  ) : null}
                  {Array.isArray(message.metadata?.citations) && message.metadata.citations.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="text-muted-foreground text-xs font-medium">Sources</span>
                      {message.metadata.citations.slice(0, 3).map((citation, index) => (
                        <span
                          key={`${message._id}-citation-${index}`}
                          className="bg-muted text-muted-foreground rounded-full px-2 py-1 text-[11px]"
                        >
                          {typeof citation === "string" ? citation : `Source ${index + 1}`}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className={cn("flex items-center gap-2", isUser ? "justify-end" : "justify-start")}>
                  <span className="text-muted-foreground text-xs">
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <MessageActions
                    canRegenerate={canRegenerate}
                    canStop={canStop}
                    onCopy={onCopy ? () => onCopy(message) : undefined}
                    onDelete={onDelete ? () => onDelete(message) : undefined}
                    onRegenerate={onRegenerate ? () => onRegenerate(message) : undefined}
                    onStop={onStop ? () => onStop(message) : undefined}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
