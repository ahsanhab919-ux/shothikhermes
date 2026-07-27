"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation, type Locale } from "@/i18n";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSelector } from "react-redux";
import { useSyncLocaleToConvex } from "@/i18n/useSyncLocaleToConvex";

const localeOptions: { code: Locale; label: string; shortLabel: string }[] = [
  { code: "en", label: "English", shortLabel: "EN" },
  { code: "bn", label: "বাংলা", shortLabel: "বাং" },
];

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useTranslation();
  const user = useSelector((state: any) => state.auth?.user);
  const syncLocale = useSyncLocaleToConvex();

  const handleLocaleChange = (code: Locale) => {
    setLocale(code);
    if (user?._id) {
      syncLocale(user._id, code);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn("p-2", className)}
          aria-label="Switch language"
          data-testid="language-switcher"
        >
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        {localeOptions.map((option) => (
          <DropdownMenuItem
            key={option.code}
            onClick={() => handleLocaleChange(option.code)}
            className={cn(
              "cursor-pointer gap-2",
              locale === option.code && "bg-accent font-semibold"
            )}
            data-testid={`lang-${option.code}`}
          >
            <span className="text-xs font-mono w-6">{option.shortLabel}</span>
            <span>{option.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
