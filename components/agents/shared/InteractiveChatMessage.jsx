import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "@/components/ui/message-bubble";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Bot, CheckCircle2, HelpCircle, Palette, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

export default function InteractiveChatMessage({
  message,
  onResponse,
  onPreferenceUpdate,
  onFeedback,
}) {
  const [selectedOptions, setSelectedOptions] = useState([]);

  const handleOptionSelect = (option) => {
    if (message.allowMultiple) {
      const newOptions = selectedOptions.includes(option)
        ? selectedOptions.filter((o) => o !== option)
        : [...selectedOptions, option];
      setSelectedOptions(newOptions);
    } else {
      setSelectedOptions([option]);
      onResponse?.(message.id, [option]);
    }
  };

  const handleSubmitMultiple = () => {
    onResponse?.(message.id, selectedOptions);
  };

  const isUser = message.sender === "user";

  const renderMessageContent = () => {
    switch (message.type) {
      case "question":
        return (
          <div>
            <p className="mb-4 text-base">{message.content}</p>

            {message.options && (
              <div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {message.options.map((option, index) => (
                    <Button
                      key={index}
                      variant={
                        selectedOptions.includes(option) ? "default" : "outline"
                      }
                      className={cn(
                        "w-full justify-start text-left",
                        selectedOptions.includes(option) &&
                          "bg-primary text-primary-foreground hover:bg-primary/90",
                        !selectedOptions.includes(option) &&
                          "hover:bg-accent hover:text-accent-foreground",
                      )}
                      onClick={() => handleOptionSelect(option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>

                {message.allowMultiple && selectedOptions.length > 0 && (
                  <div className="mt-4 text-right">
                    <Button variant="default" onClick={handleSubmitMultiple}>
                      Submit ({selectedOptions.length} selected)
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case "quality_feedback":
        const qualityScore = message.qualityScore || 0;
        const scorePercent = Math.round(qualityScore * 100);
        const isHighScore = qualityScore >= 0.8;
        const isMediumScore = qualityScore >= 0.6 && qualityScore < 0.8;
        const isLowScore = qualityScore < 0.6;

        return (
          <div>
            <p className="mb-4 text-base">{message.content}</p>

            {message.qualityScore !== undefined && (
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Quality Score
                  </span>
                  <Badge
                    variant={
                      isHighScore
                        ? "default"
                        : isMediumScore
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {scorePercent}%
                  </Badge>
                </div>
                <Progress
                  value={scorePercent}
                  className={cn(
                    isHighScore &&
                      '[&_[data-slot="progress-indicator"]]:bg-primary',
                    isMediumScore &&
                      '[&_[data-slot="progress-indicator"]]:bg-secondary',
                    isLowScore &&
                      '[&_[data-slot="progress-indicator"]]:bg-destructive',
                  )}
                />
              </div>
            )}

            <div className="mt-2 flex gap-2">
              <Button
                variant="outline"
                onClick={() => onResponse?.(message.id, "accept")}
                className="border-primary text-primary hover:bg-accent hover:text-accent-foreground"
              >
                Accept Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => onResponse?.(message.id, "modify")}
                className="border-primary text-primary hover:bg-accent hover:text-accent-foreground"
              >
                Request Modifications
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getMessageIcon = () => {
    switch (message.type) {
      case "question":
        return <HelpCircle className="size-4" />;
      case "preference_request":
        return <Palette className="size-4" />;
      case "quality_feedback":
        return <CheckCircle2 className="size-4" />;
      default:
        return isUser ? (
          <User className="size-4" />
        ) : (
          <Bot className="size-4" />
        );
    }
  };

  if (isUser && !message.type) {
    return (
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="mb-4 flex justify-end"
      >
        <MessageBubble
          message={message.content}
          variant="sent"
          className="max-w-[70%] px-5 py-3 text-base"
        />
      </motion.div>
    );
  }

  const hasInteractiveContent = message.type === "question" || message.type === "quality_feedback";

  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "mb-4 flex",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "flex max-w-[70%] items-start gap-2.5",
          isUser ? "flex-row-reverse" : "flex-row",
        )}
      >
        <Avatar
          className={cn(
            "size-8 shrink-0",
            isUser ? "bg-secondary" : "bg-primary",
          )}
        >
          <AvatarFallback
            className={cn(
              isUser
                ? "bg-secondary text-secondary-foreground"
                : "bg-primary text-primary-foreground",
            )}
          >
            {getMessageIcon()}
          </AvatarFallback>
        </Avatar>

        <div
          className={cn(
            "overflow-hidden rounded-2xl px-5 py-4",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted text-foreground rounded-tl-sm border",
          )}
        >
          {message.agentName && (
            <span className="text-muted-foreground mb-2 block text-xs font-medium">
              {message.agentName}
            </span>
          )}

          {hasInteractiveContent ? (
            renderMessageContent()
          ) : (
            <p className="text-base">{message.content}</p>
          )}

          {message.timestamp && (
            <span className="text-muted-foreground/70 mt-2 block text-xs">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
