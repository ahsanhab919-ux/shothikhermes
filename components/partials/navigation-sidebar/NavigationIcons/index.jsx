"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/ui/useMobile";
import { cn } from "@/lib/utils";
import { HelpCircle, Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const NavigationBar = ({ className }) => {
  const [selectedItem, setSelectedItem] = useState("home");
  const router = useRouter();
  const isMobile = useIsMobile();

  const navigationItems = [
    { id: "home", icon: Home, label: "Home", href: "/" },
    {
      id: "help",
      icon: HelpCircle,
      label: "Help",
      href: "mailto:support@shothik.ai",
    },
  ];

  const handleItemClick = (itemId, href) => {
    setSelectedItem(itemId);
    // Handle mailto links differently
    if (href.startsWith("mailto:")) {
      window.location.href = href;
    } else {
      router.push(href);
    }
  };

  const renderButton = (item) => {
    const IconComponent = item.icon;
    const isSelected = selectedItem === item.id;
    const button = (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleItemClick(item.id, item.href)}
        aria-label={item.label}
        className={cn(
          "transition-all duration-200",
          isSelected
            ? "text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground"
            : "text-muted-foreground hover:bg-primary hover:text-primary-foreground",
        )}
      >
        <IconComponent className="h-5 w-5" />
      </Button>
    );

    // On mobile, don't show tooltips
    if (isMobile) {
      return button;
    }

    // On desktop, wrap with tooltip
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>
          <p>{item.id}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div
      className={cn(
        "flex w-full flex-1 items-center justify-around gap-1 py-1",
        className,
      )}
    >
      {navigationItems.map((item) => (
        <div key={item.id}>{renderButton(item)}</div>
      ))}
    </div>
  );
};

export default NavigationBar;
