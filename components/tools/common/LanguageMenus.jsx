import { languages } from "@/_mock/tools/languages";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import useResponsive from "@/hooks/ui/useResponsive";
import { cn } from "@/lib/utils";
import { Check, Search, X } from "lucide-react";
import { useState } from "react";

const RenderLanguages = ({
  handleLanguageMenu,
  handleClose,
  selectedLanguage,
}) => {
  const [filterTerm, setFilterTerm] = useState("");

  const filtered = languages.filter((lang) =>
    lang.name.toLowerCase().includes(filterTerm.toLowerCase()),
  );

  return (
    <div id="language_menu">
      {/* Sticky search bar */}
      <div className="bg-background sticky top-0 z-50 w-full p-2 md:p-1">
        <div className="relative">
          <Input
            placeholder="Search language..."
            value={filterTerm}
            onChange={(e) => setFilterTerm(e.target.value)}
            className="pr-9"
          />
          <Search className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
        </div>
      </div>

      {/* 3-column grid of languages */}
      <ScrollArea className="max-h-[60vh] overflow-y-auto p-2 md:max-h-[50vh] md:p-1">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {filtered.map((lang, index) => {
            const isSelected = lang.name === selectedLanguage;
            return (
              <div
                key={`${lang.name}-${index}`}
                onClick={() => {
                  handleLanguageMenu(lang.name);
                  handleClose();
                }}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors",
                  isSelected ? "bg-primary/10" : "hover:bg-accent",
                )}
              >
                <span className="text-sm">{lang.name}</span>
                {isSelected && <Check className="text-primary h-4 w-4" />}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

const LanguageMenus = ({
  open,
  anchorEl,
  handleClose,
  handleLanguageMenu,
  selectedLanguage,
}) => {
  const isMobile = useResponsive("down", "sm");

  return (
    <>
      {isMobile ? (
        <Sheet open={open} onOpenChange={(o) => (!o ? handleClose() : null)}>
          <SheetContent
            side="bottom"
            className="h-[60vh] rounded-t-2xl p-0 [&>button]:hidden"
          >
            <div className="flex items-center justify-between px-4 pt-4">
              <h3 className="text-base font-semibold">Select language</h3>
              <button onClick={handleClose} className="text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <RenderLanguages
              handleLanguageMenu={handleLanguageMenu}
              handleClose={handleClose}
              selectedLanguage={selectedLanguage}
            />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={(o) => (!o ? handleClose() : null)}>
          <DialogContent className="w-[550px] p-0">
            <DialogHeader className="px-4 pt-4">
              <DialogTitle className="text-base">Select language</DialogTitle>
            </DialogHeader>
            <RenderLanguages
              handleLanguageMenu={handleLanguageMenu}
              handleClose={handleClose}
              selectedLanguage={selectedLanguage}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
export default LanguageMenus;
