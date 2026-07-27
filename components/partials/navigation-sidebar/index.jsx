"use client";

import DotFlashing from "@/components/common/DotFlashing";
import Logo from "@/components/partials/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import { NAV_ITEMS } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { FolderOpen } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import NavigationIcons from "./NavigationIcons";
import NavItem from "./NavItem";
import UserInfo from "./UserInfo";
import WalletCredits from "./WalletCredits";

export default function NavigationSidebar() {
  const { accessToken } = useSelector((state) => state.auth);
  const { sidebar } = useSelector((state) => state.settings);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);
  const { t } = useTranslation();

  const isCompact = mounted ? sidebar === "compact" : false;

  const { setOpen, setOpenMobile, isMobile } = useSidebar();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (sidebar === "compact") {
        setOpen(false);
      } else {
        setOpen(true);
      }
    }
  }, [sidebar, setOpen, mounted]);

  useEffect(() => {
    if (mounted && isMobile) {
      if (prevPathnameRef.current !== pathname) {
        setOpenMobile(false);
      }
      prevPathnameRef.current = pathname;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, mounted, isMobile]);

  const accountGroup = NAV_ITEMS.find((g) => g.subheader === "account");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-sidebar-border h-12 border-b p-0 lg:h-16">
        <div className="flex h-full items-center justify-center px-2 py-1">
          <Logo
            className={cn("", {
              "lg:hidden": isCompact,
              "lg:inline-block": !isCompact,
            })}
          />
          <Image
            src="/moscot.png"
            priority
            alt="shothik_logo"
            width={100}
            height={40}
            className={cn("mx-auto hidden! h-full w-auto object-contain", {
              "lg:hidden!": !isCompact,
              "lg:inline-block!": isCompact,
            })}
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden! overflow-y-auto!">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <div className={`flex flex-col ${isCompact ? "py-0" : "py-3"}`}>

                <div className="flex flex-col gap-0.5 px-2">
                  {!isCompact && (
                    <div className="px-3 pt-1 pb-1">
                      <div className="text-muted-foreground/60 flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase">
                        <FolderOpen className="size-3" />
                        {t('nav.projects')}
                      </div>
                    </div>
                  )}
                  {!isCompact && (
                    <div className="px-3 py-4 text-center">
                      <p className="text-muted-foreground/50 text-xs">
                        {t('common.comingSoon')}
                      </p>
                    </div>
                  )}
                </div>

                {!isCompact && (
                  <div className="mx-4 my-3 border-t" />
                )}

                {accountGroup && (
                  <div className="flex flex-col gap-1">
                    {!isCompact && (
                      <div className="px-3 pt-2 pb-1">
                        <div className="text-muted-foreground/60 flex h-5 items-center text-[11px] font-semibold tracking-wider uppercase">
                          {t('nav.account')}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col gap-0.5 px-2">
                      {accountGroup?.items?.map((item) => (
                        <NavItem
                          key={item?.title + item?.path}
                          item={item}
                          isCompact={isCompact}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border flex min-h-12 flex-col items-center border-t lg:min-h-16">
        <div className="flex h-full w-full flex-1 flex-col">
          {!mounted ? (
            <div className="flex h-full justify-center px-2 py-5 text-center">
              <DotFlashing />
            </div>
          ) : !accessToken ? (
            <UserInfo />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <WalletCredits isCompact={isCompact} />
              <NavigationIcons />
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
