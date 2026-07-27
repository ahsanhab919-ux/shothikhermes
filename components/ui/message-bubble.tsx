"use client";

import { cn } from "@/lib/utils";

export interface MessageBubbleProps {
  message: string;
  variant?: "sent" | "received";
  grouped?: "first" | "middle" | "last" | "none";
  className?: string;
  children?: React.ReactNode;
}

export function MessageBubble({
  message,
  variant = "received",
  grouped = "none",
  className,
  children,
}: MessageBubbleProps) {
  const isSent = variant === "sent";

  const groupedRadius = {
    first: isSent
      ? "rounded-[20px_20px_5px_20px]"
      : "rounded-[20px_20px_20px_5px]",
    middle: isSent
      ? "rounded-[20px_5px_5px_20px]"
      : "rounded-[5px_20px_20px_5px]",
    last: isSent
      ? "rounded-[20px_5px_20px_20px]"
      : "rounded-[5px_20px_20px_20px]",
    none: "rounded-[20px]",
  };

  return (
    <div
      className={cn(
        "relative max-w-[70%] px-5 py-2 leading-6 break-words",
        groupedRadius[grouped],
        grouped === "first" || grouped === "middle" ? "mb-1.5" : "",
        isSent
          ? "self-end bg-primary text-primary-foreground"
          : "self-start bg-muted text-foreground",
        className,
      )}
    >
      {children || <p className="whitespace-pre-wrap">{message}</p>}
    </div>
  );
}

export interface ChatMessageProps {
  timestamp?: string;
  messages: string[];
  variant?: "sent" | "received";
  className?: string;
  showTimestamp?: boolean;
}

export function ChatMessage({
  timestamp,
  messages,
  variant = "received",
  className,
  showTimestamp = true,
}: ChatMessageProps) {
  const hasMultipleMessages = messages.length > 1;

  const getGroupedType = (
    index: number,
    total: number,
  ): "first" | "middle" | "last" | "none" => {
    if (total === 1) return "none";
    if (index === 0) return "first";
    if (index === total - 1) return "last";
    return "middle";
  };

  return (
    <div className={cn("flex w-full flex-col", className)}>
      <div className="flex flex-col">
        {messages.map((message, index) => (
          <MessageBubble
            key={index}
            message={message}
            variant={variant}
            grouped={
              hasMultipleMessages
                ? getGroupedType(index, messages.length)
                : "none"
            }
          />
        ))}
      </div>

      {showTimestamp && timestamp && (
        <span
          className={cn(
            "text-muted-foreground mt-1 px-2 text-xs",
            variant === "sent" && "text-right",
          )}
        >
          {timestamp}
        </span>
      )}
    </div>
  );
}
