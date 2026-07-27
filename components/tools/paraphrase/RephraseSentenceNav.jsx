import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import { cn } from "@/lib/utils";
import { Copy, Flag } from "lucide-react";
import { useMemo } from "react";
import { useSelector } from "react-redux";

export default function RephraseSentenceNav({
  open,
  anchorEl,
  handleClose,
  handleCopy,
  sendReprt,
  rephraseSentence,
}) {
  const ref = useOutsideClick(() => handleClose());
  const { showTooltips } = useSelector(
    (state) => state.settings.interfaceOptions,
  );
  const virtualRef = useMemo(() => ({ current: anchorEl }), [anchorEl]);

  return (
    <Popover open={open}>
      <PopoverAnchor virtualRef={virtualRef} />
      <PopoverContent
        ref={ref}
        side="top"
        align="start"
        className={cn(
          "z-50 min-w-[100px] p-0",
          "bg-popover text-popover-foreground border-border border",
          "w-fit shadow-lg",
        )}
      >
        {showTooltips && (
          <TooltipProvider>
            <div className={cn("flex items-center gap-2", "p-1")}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={rephraseSentence}
                    variant="outline"
                    size="sm"
                    className={cn("mb-0")}
                  >
                    Rephrase
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>See More Sentence</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleCopy}
                    aria-label="Copy Sentence"
                    variant="ghost"
                    size="icon"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy Sentence</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="Report Sentence"
                    onClick={sendReprt}
                    variant="ghost"
                    size="icon"
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Report Sentence</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        )}
      </PopoverContent>
    </Popover>
  );
}
