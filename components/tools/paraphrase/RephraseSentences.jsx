import { modes } from "@/_mock/tools/paraphrase";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Diamond, Lock, X } from "lucide-react";
import Link from "next/link";
import { Fragment, useMemo } from "react";

export default function RephraseSentences(props) {
  const {
    open,
    anchorEl,
    handleClose,
    userPackage,
    replaceSentence,
    setRephraseMode,
    isPending,
    rephraseData,
    rephraseMode,
  } = props;

  const virtualRef = useMemo(() => ({ current: anchorEl }), [anchorEl]);

  if (!open) return null;

  return (
    <Popover open={open}>
      <PopoverAnchor virtualRef={virtualRef} />
      <PopoverContent
        align="start"
        side="bottom"
        onEscapeKeyDown={handleClose}
        onPointerDownOutside={handleClose}
        className={cn(
          "z-50 p-0",
          "w-[360px] sm:w-[520px] lg:w-[720px]",
          "bg-popover text-popover-foreground border-border border",
          "mr-8 rounded-md shadow-lg",
        )}
      >
        <div className={cn("flex items-center gap-2", "pt-2 pr-2 pl-2")}>
          <div className={cn("flex-1 overflow-hidden")}>
            <Tabs
              value={rephraseMode}
              onValueChange={(val) => setRephraseMode(val)}
            >
              <TabsList
                className={cn(
                  "w-full justify-start gap-1",
                  "overflow-x-auto",
                  "[&>*]:shrink-0",
                  "!flex-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                )}
              >
                {modes?.slice(0, 7)?.map((mode, index) => {
                  const isDisabled = !mode.package.includes(userPackage);
                  const trigger = (
                    <TabsTrigger
                      key={index}
                      value={mode.value}
                      disabled={isDisabled}
                      className={cn(
                        "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                        "data-[state=inactive]:text-foreground",
                        "h-8 px-3 py-1",
                        isDisabled && "cursor-not-allowed opacity-60",
                      )}
                    >
                      {isDisabled && <Lock className="mr-1 h-3 w-3" />}
                      {mode.value}
                    </TabsTrigger>
                  );

                  if (!isDisabled) return trigger;

                  return (
                    <TooltipProvider key={index}>
                      <Tooltip>
                        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
                        <TooltipContent className={cn("max-w-xs text-center")}>
                          <div className={cn("space-y-2")}>
                            <p className={cn("text-sm font-medium")}>Upgrade</p>
                            <p className={cn("text-muted-foreground text-xs")}>
                              Access premium modes by upgrading your plan.
                            </p>
                            <Link href="/pricing" className={cn("block")}>
                              <Button
                                className={cn("w-full")}
                                data-rybbit-event="clicked_upgrade_plan"
                              >
                                <Diamond className="mr-2 h-4 w-4" />
                                Upgrade Plan
                              </Button>
                            </Link>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </TabsList>
            </Tabs>
          </div>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8")}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div
          className={cn(
            "max-h-60 w-full overflow-auto",
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
        >
          {isPending ? (
            <div className={cn("space-y-2 px-2 py-2")}>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-10/12" />
            </div>
          ) : (
            rephraseData?.map((sentence, index) => {
              return (
                <Fragment key={index}>
                  <button
                    type="button"
                    onClick={() => replaceSentence(sentence)}
                    className={cn(
                      "w-full text-left",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus:outline-none",
                    )}
                  >
                    <div className={cn("px-3 py-2")}>
                      {sentence &&
                        sentence?.map((segment, i, arr) => (
                          <span
                            key={i}
                            className={cn(
                              /NP/.test(segment.type)
                                ? "text-primary"
                                : /VP/.test(segment.type)
                                  ? "text-secondary-foreground"
                                  : /PP|CP|AdvP|AdjP/.test(segment.type)
                                    ? "text-accent-foreground"
                                    : /freeze/.test(segment.type)
                                      ? "text-muted-foreground"
                                      : undefined,
                              "hover:text-primary cursor-pointer transition-colors",
                            )}
                          >
                            {arr.length - 1 === i ||
                            segment.word === "," ||
                            segment?.word?.endsWith("'")
                              ? ""
                              : " "}
                            {segment.word?.length > 1
                              ? segment.word
                                  ?.replace(/[{}]/g, "")
                                  .replace(/[.।]+$/, "")
                              : segment.word}
                          </span>
                        ))}
                    </div>
                  </button>
                  <hr className={cn("border-border")} />
                </Fragment>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
