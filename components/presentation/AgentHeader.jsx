// components/AgentHeader.tsx
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default function AgentHeader({ currentAgentType, onBackClick }) {
  return (
    <div
      className={cn(
        "bg-background border-border fixed top-0 right-0 left-0 z-[1001] h-20 border-b shadow-sm",
        "flex items-center",
      )}
    >
      <div className="mx-auto flex h-full w-full max-w-screen-lg items-center px-4">
        <div className="flex w-full items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBackClick}
            className="text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <h1
            className={cn(
              "flex-1 text-3xl font-bold",
              "from-primary to-primary/70 bg-gradient-to-r bg-clip-text text-transparent",
            )}
          >
            Shothik{" "}
            {currentAgentType === "presentation" ? "Presentation" : "Super"}{" "}
            Agent
          </h1>
          <div
            className={cn("bg-primary size-2 rounded-full", "animate-pulse")}
          />
        </div>
      </div>
    </div>
  );
}
