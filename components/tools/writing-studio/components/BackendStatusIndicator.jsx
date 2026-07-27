"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff, Server } from "lucide-react";

const springTransition = { type: "spring", stiffness: 300, damping: 30 };

export function BackendStatusIndicator() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch("/api/health", {
          method: "GET",
          signal: AbortSignal.timeout(5000),
        });
        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          const calibreOk = data?.services?.calibre === "ok" || data?.status === "ok";
          setStatus(calibreOk ? "connected" : "degraded");
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  const statusConfig = {
    checking: {
      icon: Server,
      label: "Checking services...",
      color: "text-muted-foreground",
      dot: "bg-muted-foreground",
    },
    connected: {
      icon: Wifi,
      label: "Export Service Ready",
      color: "text-green-600 dark:text-green-400",
      dot: "bg-green-500",
    },
    degraded: {
      icon: Wifi,
      label: "Export Service Limited",
      color: "text-amber-600 dark:text-amber-400",
      dot: "bg-amber-500",
    },
    error: {
      icon: WifiOff,
      label: "Export Service Offline",
      color: "text-amber-600 dark:text-amber-400",
      dot: "bg-amber-500",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={springTransition}
      className="flex items-center gap-1.5"
    >
      <div className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      <span className={cn("text-[10px]", config.color)}>{config.label}</span>
    </motion.div>
  );
}

export default BackendStatusIndicator;
