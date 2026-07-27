"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleTheme } from "@/redux/slices/settings-slice";
import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function ThemeToggle({ className }) {
  const dispatch = useDispatch();
  const { theme } = useSelector((state) => state.settings);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderIcon = () => {
    // Use default theme on server to prevent hydration mismatch
    const currentTheme = mounted ? theme : "system";
    switch (currentTheme) {
      case "light":
        return <Sun className="h-4 w-4" />;
      case "dark":
        return <Moon className="h-4 w-4" />;
      case "system":
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => dispatch(toggleTheme())}
      className={cn("p-2", className)}
      aria-label="Toggle Theme"
      data-testid="theme-toggle"
    >
      {renderIcon()}
    </Button>
  );
}
