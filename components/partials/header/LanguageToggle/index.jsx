"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { useEffect, useState } from "react";

export default function LanguageToggle({ className }) {
  const { locale, setLocale } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentLang = mounted ? locale : "en";

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setLocale(currentLang === "en" ? "bn" : "en")}
      className={cn("p-2 text-xs font-bold", className)}
      aria-label={currentLang === "en" ? "Switch to Bengali" : "Switch to English"}
      data-testid="language-toggle"
    >
      {currentLang === "en" ? "বাং" : "EN"}
    </Button>
  );
}
