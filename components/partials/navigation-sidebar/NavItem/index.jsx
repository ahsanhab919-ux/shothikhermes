"use client";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { useTranslation } from "@/i18n";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function NavItem({ item, isCompact = false, className }) {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();
  const { t } = useTranslation();
  const prevPathnameRef = useRef(pathname);
  const isActive =
    pathname === "/" ? pathname === item.path : pathname.startsWith(item.path);
  const { title, titleKey, path, icon, iconColor } = item;
  const displayTitle = titleKey ? t(titleKey) : title;

  useEffect(() => {
    if (isMobile) {
      if (prevPathnameRef.current !== pathname) {
        setOpenMobile(false);
      }
      prevPathnameRef.current = pathname;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isMobile]);

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Link
      data-rybbit-event="Nav Item"
      data-rybbit-prop-nav_item={`Nav: ${title}`}
      href={path}
      id={item?.id}
      onClick={handleLinkClick}
      className={cn(
        "group relative flex w-full flex-row items-center justify-start gap-x-3 rounded-lg px-3 py-2 capitalize transition-all duration-200",
        {
          "lg:mx-auto lg:w-[72px] lg:min-w-[72px] lg:flex-col lg:justify-center lg:gap-x-0 lg:gap-y-1 lg:p-2":
            isCompact,
        },
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-accent/80 hover:text-foreground",
        className,
      )}
    >
      {isActive && !isCompact && (
        <span className="bg-primary absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full" />
      )}

      {icon && (
        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md transition-transform duration-200 group-hover:scale-105",
            isActive && "bg-primary/10",
          )}
          style={{ color: isActive ? undefined : iconColor }}
        >
          {icon}
        </div>
      )}

      <span
        className={cn(
          "grow truncate text-start text-sm",
          isCompact ? "lg:text-center lg:text-[11px] lg:leading-tight lg:whitespace-normal" : "",
        )}
      >
        {displayTitle}
      </span>
    </Link>
  );
}
