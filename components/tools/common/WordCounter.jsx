import SvgColor from "@/components/common/SvgColor";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/ui/useMobile";
import useWordLimit from "@/hooks/useWordLimit";
import { cn } from "@/lib/utils";
import { Gem, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import FreezeWordsContent from "../paraphrase/FreezeWordsContent";
function WordCounter({
  freeze_modal = false,
  freeze_props = {},
  userInput,
  isLoading,
  toolName,
  handleClearInput,
  children,
  userPackage,
  handleSubmit,
  btnText,
  btnDisabled = false,
  ExtraBtn = null,
  ExtraCounter = null,
  btnIcon = null,
  sx = {},
  dontDisable = false,
  sticky = 635,
  isMobile = false,
  detectingFreezeTerms,
}) {
  // if (false) {
  //   const { ref, style } = useStickyBottom(sticky);
  //   return (
  //     <Box ref={ref} sx={style}>
  //       <Contend
  //         btnText={btnText}
  //         handleClearInput={handleClearInput}
  //         handleSubmit={handleSubmit}
  //         isLoading={isLoading}
  //         toolName={toolName}
  //         userInput={userInput}
  //         userPackage={userPackage}
  //         ExtraBtn={ExtraBtn}
  //         ExtraCounter={ExtraCounter}
  //         btnIcon={btnIcon}
  //         dontDisable={dontDisable}
  //         sx={sx}
  //         freeze_modal={freeze_modal}
  //         freeze_props={freeze_props}
  //       >
  //         {children}
  //       </Contend>
  //     </Box>
  //   );
  // } else {
  return (
    <Contend
      btnText={btnText}
      handleClearInput={handleClearInput}
      handleSubmit={handleSubmit}
      isLoading={isLoading}
      toolName={toolName}
      userInput={userInput}
      userPackage={userPackage}
      ExtraBtn={ExtraBtn}
      ExtraCounter={ExtraCounter}
      btnIcon={btnIcon}
      btnDisabled={btnDisabled}
      dontDisable={dontDisable}
      sx={sx}
      freeze_modal={freeze_modal}
      freeze_props={freeze_props}
      isMobile={isMobile}
      detectingFreezeTerms={detectingFreezeTerms}
    >
      {children}
    </Contend>
  );
}
// }

const Contend = ({
  userInput,
  isLoading,
  toolName,
  handleClearInput,
  children,
  userPackage,
  handleSubmit,
  btnText,
  ExtraBtn = null,
  ExtraCounter = null,
  btnIcon = null,
  btnDisabled = false,
  sx = {},
  freeze_modal = false,
  freeze_props = {},
  dontDisable = false,
  isMobile,
  detectingFreezeTerms,
}) => {
  const [wordCount, setWordCount] = useState(0);
  // const isMobile = useResponsive("down", "sm"); // This is now passed as a prop
  const { wordLimit } = useWordLimit(toolName);
  const isMobileScreen = useIsMobile(); // Hook to detect screen size

  useEffect(() => {
    const words = userInput.trim() ? String(userInput).split(" ").length : 0;
    setWordCount(words);
  }, [userInput]);
  const [show_freeze, set_show_freeze] = useState(false);

  const handleCloseFreeze = () => {
    set_show_freeze(false);
  };

  if (!userInput) return null;
  return (
    <div
      className={cn(
        "bg-card flex flex-row flex-wrap items-center justify-between gap-2 px-4",
        typeof sx === "string" ? sx : "",
      )}
    >
      <div
        className={cn(
          "flex h-12 flex-1 flex-row items-center justify-between gap-4",
          btnText === "Fix Grammar" && "w-full sm:w-auto",
        )}
      >
        <div className="flex flex-row items-center gap-2">
          <span
            className={cn(
              "text-xs whitespace-nowrap lg:text-sm",
              wordCount > wordLimit && "text-destructive",
            )}
          >
            <b>{wordCount}</b> /{" "}
            {wordLimit === 9999 ? (
              <span className="text-primary text-sm">Unlimited</span>
            ) : (
              <>
                {wordLimit}{" "}
                <span className="text-foreground text-xs lg:text-sm">
                  Words
                </span>
              </>
            )}
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="delete"
                variant="ghost"
                size={isMobile ? "icon-sm" : "icon"}
                disabled={isLoading}
                onClick={handleClearInput}
                className="cursor-pointer bg-transparent p-0 hover:bg-transparent dark:hover:bg-transparent"
              >
                <Trash2 className="size-[18px]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Clear text</p>
            </TooltipContent>
          </Tooltip>
          {freeze_modal ? (
            <>
              {isMobileScreen ? (
                // Dialog for mobile/tablet (< 1024px)
                <Dialog open={show_freeze} onOpenChange={set_show_freeze}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                        <Button
                          id="show_freeze_button"
                          aria-label="freeze"
                          variant="ghost"
                          size={isMobile ? "icon-sm" : "icon"}
                          disabled={false}
                          className="cursor-pointer bg-transparent p-0 hover:bg-transparent dark:hover:bg-transparent"
                        >
                          <SvgColor
                            src={
                              show_freeze
                                ? "/icons/freeze-active.svg"
                                : "/icons/freeze.svg"
                            }
                            className="text-foreground size-[18px]"
                          />
                        </Button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Freeze Words</p>
                    </TooltipContent>
                  </Tooltip>
                  <DialogContent className="w-fit max-w-[95vw] p-0 sm:max-w-[90vw] md:max-w-[600px]">
                    <FreezeWordsContent
                      close={handleCloseFreeze}
                      readOnly={isLoading}
                      freeze_props={freeze_props}
                    />
                  </DialogContent>
                </Dialog>
              ) : (
                // Popover for desktop (>= 1024px)
                <Popover open={show_freeze} onOpenChange={set_show_freeze}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <Button
                          id="show_freeze_button"
                          aria-label="freeze"
                          variant="ghost"
                          size={isMobile ? "icon-sm" : "icon"}
                          disabled={false}
                          className="cursor-pointer bg-transparent p-0 hover:bg-transparent dark:hover:bg-transparent"
                        >
                          <SvgColor
                            src={
                              show_freeze
                                ? "/icons/freeze-active.svg"
                                : "/icons/freeze.svg"
                            }
                            className="text-foreground size-[18px]"
                          />
                        </Button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>Freeze Words</p>
                    </TooltipContent>
                  </Tooltip>
                  <PopoverContent
                    side="top"
                    align="start"
                    sideOffset={8}
                    className="dark:bg-card z-40 w-full p-0"
                  >
                    <FreezeWordsContent
                      close={handleCloseFreeze}
                      readOnly={isLoading}
                      freeze_props={freeze_props}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </>
          ) : null}

          {detectingFreezeTerms && (
            <div className="flex flex-row items-center gap-2 lg:ml-4">
              <div className="flex items-center">
                <Spinner className="size-4" />
              </div>
              <span className="text-foreground text-sm leading-none whitespace-nowrap">
                freezing
              </span>
            </div>
          )}
        </div>
        {ExtraCounter}
      </div>

      <div
        className={cn(
          "flex flex-1 flex-row gap-4",
          children ? "justify-end md:justify-center" : "justify-end",
        )}
      >
        {wordCount > wordLimit && userPackage !== "unlimited" && (
          <Link href="/pricing">
            <Button
              variant="default"
              className="h-10 px-2 py-0 md:h-10 md:px-2 md:py-0"
            >
              <Gem className="size-5" />
              Upgrade
            </Button>
          </Link>
        )}
        <Button
          onClick={() => handleSubmit()}
          variant="default"
          disabled={!dontDisable ? wordCount > wordLimit : btnDisabled || false}
          className="h-10 cursor-pointer px-2 py-0 whitespace-nowrap md:h-10 md:px-2 md:py-0"
        >
          {isLoading && <Spinner className="mr-2 size-4" />}
          {btnText}
        </Button>
        {ExtraBtn}
      </div>

      {children && (
        <div className="flex flex-1 flex-row justify-end gap-4 md:flex-1 md:justify-end">
          {children}
        </div>
      )}
    </div>
  );
};

export default WordCounter;
