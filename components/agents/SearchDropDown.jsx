"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useResponsive from "@/hooks/ui/useResponsive";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Clock, Crown, FileText, Sparkles, Zap } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useSelector } from "react-redux";

const searchLevels = [
  {
    id: "quick",
    title: "Quick",
    subtitle: "Fast overview",
    description: "Essential points and key facts from top sources",
    isPremium: false,
    model: "gemini-2.0-flash",
    topLevel: 2,
    icon: Zap,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    time: "~1 min",
    sources: "5-10",
  },
  {
    id: "standard",
    title: "Standard",
    subtitle: "Balanced analysis",
    description: "Detailed findings with examples, context, and comparisons",
    isPremium: true,
    model: "gemini-2.0-flash",
    topLevel: 6,
    icon: Sparkles,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    time: "~5 min",
    sources: "15-25",
  },
  {
    id: "deep",
    title: "Deep Dive",
    subtitle: "Executive report",
    description: "Exhaustive research with comprehensive references and citations",
    isPremium: true,
    model: "gemini-2.5-pro",
    topLevel: 9,
    icon: Crown,
    color: "text-violet-600",
    bgColor: "bg-violet-500/10",
    time: "~15 min",
    sources: "40+",
  },
];

const SearchDropdown = ({ setResearchModel, setTopLevel }) => {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("quick");

  const isMobile = useResponsive("down", "sm");
  const pathname = usePathname();
  const router = useRouter();

  const { user } = useSelector((state) => state.auth);

  const userPackage = user?.package || "free";
  const isPremiumUser = ["value_plan", "pro_plan", "unlimited"].includes(
    userPackage,
  );

  const handleMenuItemClick = (item) => {
    if (item.isPremium && !isPremiumUser) {
      setOpen(false);
      const redirectUrl = `/pricing?redirect=${encodeURIComponent(pathname)}`;
      router.push(redirectUrl);
      return;
    }

    setSelectedId(item.id);
    setOpen(false);
    setResearchModel(item.model);
    setTopLevel(item.topLevel);
  };

  const handleUpgradeClick = (event) => {
    event.stopPropagation();
    setOpen(false);
    const redirectUrl = `/pricing?redirect=${encodeURIComponent(pathname)}`;
    router.push(redirectUrl);
  };

  const selectedItem = searchLevels.find((s) => s.id === selectedId);
  const SelectedIcon = selectedItem?.icon || Zap;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "gap-1.5 rounded-full border px-3 font-medium transition-all",
            "bg-muted/50 hover:bg-muted",
            isMobile ? "h-8 text-xs" : "h-9 text-sm",
          )}
        >
          <SelectedIcon className={cn("size-3.5", selectedItem?.color || "text-emerald-600")} />
          {selectedItem?.title || "Quick"}
          <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={cn(
          "mt-1 rounded-xl border p-1.5 shadow-lg",
          isMobile
            ? "max-w-[320px] min-w-[280px]"
            : "max-w-[420px] min-w-[360px]",
        )}
      >
        {searchLevels.map((item) => {
          const isPremiumFeature = item.isPremium && !isPremiumUser;
          const isSelected = selectedId === item.id;
          const LevelIcon = item.icon;

          return (
            <DropdownMenuItem
              key={item.id}
              onClick={() => handleMenuItemClick(item)}
              className={cn(
                "flex cursor-pointer flex-col items-start rounded-lg px-3 py-3 break-words whitespace-normal",
                isSelected ? "bg-primary/5" : "hover:bg-accent",
              )}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl", item.bgColor)}>
                    <LevelIcon className={cn("size-4", item.color)} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-semibold", isSelected ? "text-primary" : "text-foreground")}>
                        {item.title}
                      </span>
                      {item.isPremium && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-0 px-1.5 py-0 text-[10px] font-semibold">
                          PRO
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                      {item.description}
                    </p>
                    <div className="mt-1.5 flex items-center gap-3">
                      <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                        <Clock className="size-3" />
                        {item.time}
                      </span>
                      <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                        <FileText className="size-3" />
                        {item.sources} sources
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-1 shrink-0">
                  {isSelected ? (
                    <div className="bg-primary flex size-5 items-center justify-center rounded-full">
                      <Check className="text-primary-foreground size-3" />
                    </div>
                  ) : isPremiumFeature ? (
                    <Button
                      onClick={handleUpgradeClick}
                      size="sm"
                      className="h-7 rounded-full px-2.5 text-xs"
                    >
                      Upgrade
                    </Button>
                  ) : null}
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SearchDropdown;
