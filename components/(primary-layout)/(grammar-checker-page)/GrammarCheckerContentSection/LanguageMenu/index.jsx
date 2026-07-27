// LanguageMenu.jsx
"use client";
import LanguageMenus from "@/components/tools/common/LanguageMenus";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const LanguageMenu = ({ language, setLanguage, isLoading }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const showMenu = Boolean(anchorEl);

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleSelect = (value) => {
    setLanguage(value);
    handleClose();
  };

  return (
    <div className="flex items-center">
      <button
        className="flex items-center gap-2 px-4 py-2"
        onClick={handleOpen}
        disabled={isLoading}
      >
        <span>{language}</span>
        {showMenu ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
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
