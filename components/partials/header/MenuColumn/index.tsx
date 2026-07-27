"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface MenuItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

interface MenuColumnProps {
  title: string;
  items: MenuItem[];
  onItemClick: () => void;
  className?: string;
}

export default function MenuColumn({
  title,
  items,
  onItemClick,
  className,
}: MenuColumnProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="text-subtitle2 text-foreground mb-4 text-sm font-bold tracking-wide uppercase">
        {title}
      </div>
      <div className="flex w-full flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isInternalLink = item.href.startsWith("/");
          return (
            <div key={item.label} className="w-full">
              {isInternalLink ? (
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:bg-muted hover:text-primary flex w-full items-center justify-start rounded px-3 py-2 text-sm font-medium transition-colors"
                  data-rybbit-event="Feature Menu Item"
                  data-rybbit-prop-feature_menu={item.label}
                  data-testid={`menu-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={onItemClick}
                >
                  <Icon className="mr-2 h-[18px] w-[18px] shrink-0" />
                  <span className="text-left">{item.label}</span>
                </Link>
              ) : (
                <a
                  href={item.href}
                  className="text-muted-foreground hover:bg-muted hover:text-primary flex w-full items-center justify-start rounded px-3 py-2 text-sm font-medium transition-colors"
                  data-rybbit-event="Feature Menu Item"
                  data-rybbit-prop-feature_menu={item.label}
                  data-testid={`menu-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={onItemClick}
                >
                  <Icon className="mr-2 h-[18px] w-[18px] shrink-0" />
                  <span className="text-left">{item.label}</span>
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
