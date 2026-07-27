"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useTranslation, type Locale, SUPPORTED_LOCALES } from "@/i18n";
import { Globe, LucideIcon, Monitor, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

interface MenuItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface NavLink {
  label: string;
  href: string;
}

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  featuresSections: MenuSection[];
  navLinks: NavLink[];
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export default function MobileMenu({
  open,
  onClose,
  featuresSections,
  navLinks,
  theme,
  setTheme,
}: MobileMenuProps) {
  const pathname = usePathname();
  const { t, locale, setLocale } = useTranslation();

  useEffect(() => {
    if (open) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleLinkClick = () => {
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="flex w-60 flex-col"
        data-testid="mobile-drawer"
      >
        <div className="md:16 flex h-12 items-center border-b px-2">
          <h3 className="text-base">{t('nav.menu')}</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4 px-2 py-2">
            <div className="space-y-4">
              {featuresSections?.map((section) => (
                <div key={section?.title}>
                  <div className="text-caption text-foreground mb-2 font-semibold uppercase">
                    {section?.title}
                  </div>
                  <div className="flex flex-col">
                    {section?.items?.map((item) => {
                      const isInternalLink = item.href.startsWith("/");

                      return isInternalLink ? (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={handleLinkClick}
                          className="text-foreground hover:text-primary flex items-center px-2 py-2 min-h-[44px] text-sm font-medium transition-colors"
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <a
                          key={item.label}
                          href={item.href}
                          onClick={handleLinkClick}
                          className="text-foreground hover:text-primary flex items-center px-2 py-2 min-h-[44px] text-sm font-medium transition-colors"
                        >
                          {item.label}
                        </a>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex flex-col">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={handleLinkClick}
                className="text-foreground hover:bg-muted flex items-center px-4 py-2 min-h-[44px] font-semibold transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <Separator />

          <div className="px-2 py-2">
            <div className="text-caption text-muted-foreground mb-2 font-semibold uppercase">
              {t('theme.theme')}
            </div>
            <div className="mb-4 flex flex-col gap-1">
              <Button
                variant="ghost"
                className={`justify-start ${theme === "system" ? "text-primary bg-accent font-semibold" : "text-foreground"}`}
                onClick={() => setTheme("system")}
                data-testid="mobile-theme-auto"
              >
                <Monitor className="mr-2 h-4 w-4" />
                {t('theme.auto')}
              </Button>
              <Button
                variant="ghost"
                className={`justify-start ${theme === "light" ? "text-primary bg-accent font-semibold" : "text-foreground"}`}
                onClick={() => setTheme("light")}
                data-testid="mobile-theme-light"
              >
                <Sun className="mr-2 h-4 w-4" />
                {t('theme.light')}
              </Button>
              <Button
                variant="ghost"
                className={`justify-start ${theme === "dark" ? "text-primary bg-accent font-semibold" : "text-foreground"}`}
                onClick={() => setTheme("dark")}
                data-testid="mobile-theme-dark"
              >
                <Moon className="mr-2 h-4 w-4" />
                {t('theme.dark')}
              </Button>
            </div>

            <div className="text-caption text-muted-foreground mb-2 font-semibold uppercase">
              {t('language.label')}
            </div>
            <div className="mb-4 flex flex-col gap-1">
              {SUPPORTED_LOCALES.map((loc) => (
                <Button
                  key={loc.code}
                  variant="ghost"
                  className={`justify-start ${locale === loc.code ? "text-primary bg-accent font-semibold" : "text-foreground"}`}
                  onClick={() => setLocale(loc.code)}
                  data-testid={`mobile-lang-${loc.code}`}
                >
                  <Globe className="mr-2 h-4 w-4" />
                  {loc.nativeLabel}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex h-12 items-center justify-center border-t px-2 md:h-16">
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground w-full font-semibold"
            data-testid="mobile-join-waitlist"
          >
            {t('header.joinWaitlist')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
