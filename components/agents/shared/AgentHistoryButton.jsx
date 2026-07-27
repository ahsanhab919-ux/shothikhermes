"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { setAgentHistoryMenu } from "@/redux/slices/tools";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { History } from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function AgentHistoryButton() {
  const dispatch = useDispatch();
  const sidebarOpen = useSelector((state) => state.tools.agentHistoryMenu);
  const { accessToken } = useSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleDrawer = (open) => () => {
    dispatch(setAgentHistoryMenu(open));
  };

  // Don't render if not mounted or no access token
  if (!mounted || !accessToken) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div className="absolute top-4 left-3 z-50">
            {/* Animated circular outline - outer ring */}
            <div
              className={cn(
                "absolute rounded-full transition-all duration-1000 ease-in-out",
                "border-2 border-primary",
                isHovered && "animate-ping",
                sidebarOpen && "border-primary animate-pulse",
              )}
              style={{
                width: "calc(100% + 16px)",
                height: "calc(100% + 16px)",
                top: "-8px",
                left: "-8px",
                animation: isHovered
                  ? "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite"
                  : sidebarOpen
                    ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                    : "none",
              }}
            />
            {/* Animated circular outline - inner ring */}
            <div
              className={cn(
                "absolute rounded-full transition-all duration-700 ease-in-out",
                "border border-primary/60",
                isHovered && "scale-110 opacity-75",
                sidebarOpen && "border-primary/80 scale-105",
              )}
              style={{
                width: "calc(100% + 8px)",
                height: "calc(100% + 8px)",
                top: "-4px",
                left: "-4px",
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDrawer(true)}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className={cn(
                "relative h-10 w-10 rounded-full transition-all duration-300 ease-in-out",
                "bg-transparent! hover:bg-transparent! active:bg-transparent! focus:bg-transparent!",
                "hover:scale-110 hover:shadow-lg hover:shadow-primary/20",
                "active:scale-95",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                sidebarOpen && "ring-2 ring-primary/50",
              )}
              style={{
                backgroundColor: 'transparent',
                background: 'transparent',
              }}
              aria-label="Open agent history"
            >
              <History
                className={cn(
                  "h-5 w-5 transition-all duration-300 ease-in-out",
                  "text-foreground hover:text-primary",
                  sidebarOpen && "text-primary rotate-180",
                )}
                style={{ fill: 'none' }}
                fill="none"
                stroke="currentColor"
              />
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="right"
            sideOffset={12}
            className={cn(
              "bg-popover text-popover-foreground",
              "px-4 py-2.5 rounded-lg shadow-xl",
              "border border-border",
              "animate-in fade-in-0 zoom-in-95 slide-in-from-left-2 duration-200",
              "relative z-50",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            )}
          >
            <div className="flex items-center gap-2.5">
              <History className="h-4 w-4 text-foreground" />
              <p className="font-semibold text-sm tracking-wide text-foreground">
                View History
              </p>
            </div>
            {/* No arrow rendered */}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </Tooltip>
    </TooltipProvider>
  );
}

