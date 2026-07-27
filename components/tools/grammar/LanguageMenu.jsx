// LanguageMenu.jsx
"use client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useResponsive from "@/hooks/ui/useResponsive";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import LanguageMenus from "../common/LanguageMenus";

const initLanguage = ["English (US)", "French", "Spanish", "German", "Bangla"];

const LanguageMenu = ({ language, setLanguage, isLoading }) => {
  const [languageTabs, setLanguageTabs] = useState(initLanguage);
  const [anchorEl, setAnchorEl] = useState(null);
  const isMobile = useResponsive("down", "lg");
  const maxTabs = isMobile ? 1 : 4;
  const showMenu = Boolean(anchorEl);

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleSelect = (value) => {
    // promote selected to front, keep maxTabs
    setLanguageTabs((prev) => {
      const filtered = prev.filter((l) => l !== value);
      return [value, ...filtered].slice(0, maxTabs);
    });
    setLanguage(value);
    handleClose();
  };

  // desktop: what you had before
  const displayTabs = languageTabs.includes(language)
    ? languageTabs
    : [language, ...languageTabs].slice(0, maxTabs);

  if (isMobile) {
    // mobile: single button
    return (
      <>
        <Button
          onClick={handleOpen}
          disabled={isLoading}
          variant="primary"
          className="w-fit justify-start"
        >
          <span className="truncate">{language}</span>
          <ChevronDown className="ml-auto h-4 w-4" />
        </Button>
        <LanguageMenus
          selectedLanguage={language}
          anchorEl={anchorEl}
          open={showMenu}
          handleClose={handleClose}
          handleLanguageMenu={handleSelect}
        />
      </>
    );
  }

  return (
    <div className="flex w-full items-center">
      <Tabs value={language} onValueChange={setLanguage} className="w-fit">
        <TabsList className="border-border flex-nowrap overflow-x-auto rounded-b-none bg-transparent p-0 whitespace-nowrap">
          {displayTabs.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              disabled={isLoading}
              className="hover:text-foreground data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:text-foreground px-3 py-4 text-[#858481] data-[state=active]:rounded-t-lg data-[state=active]:rounded-b-none data-[state=active]:border"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Button
        id="language_x_button"
        onClick={() => {
          handleClose();
        }}
        className="pointer-events-none absolute -z-50 h-0 w-0 opacity-0"
      ></Button>

      <Button
        onClick={handleOpen}
        disabled={isLoading}
        variant="ghost"
        className="ml-2 text-[#858481] hover:bg-transparent"
        id="language_all_button"
      >
        All{" "}
        {showMenu ? (
          <ChevronUp className="ml-1 h-4 w-4" />
        ) : (
          <ChevronDown className="ml-1 h-4 w-4" />
        )}
      </Button>
      <LanguageMenus
        selectedLanguage={language}
        anchorEl={anchorEl}
        open={showMenu}
        handleClose={handleClose}
        handleLanguageMenu={handleSelect}
      />
    </div>
  );
};

export default LanguageMenu;
