import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { useMemo } from "react";

export default function Synonyms({
  synonyms,
  open,
  handleClose,
  anchorEl,
  replaceSynonym,
}) {
  const ref = useOutsideClick(() => handleClose());
  const virtualRef = useMemo(() => ({ current: anchorEl }), [anchorEl]);

  return (
    <Popover open={open} onOpenChange={(v) => !v && handleClose()}>
      <PopoverAnchor virtualRef={virtualRef} />
      <PopoverContent
        ref={ref}
        side="bottom"
        align="start"
        className={cn(
          "z-50 max-h-[300px] min-w-[200px] overflow-auto p-0",
          "bg-popover text-popover-foreground border-border border",
          "mr-8 shadow-lg",
        )}
      >
        <div className={cn("relative", "[&>ul]:p-0")}>
          {synonyms.length ? (
            <ul className="m-0 list-none p-0">
              {synonyms?.map((synonym, index) => (
                <li key={`item-${index}`}>
                  <button
                    type="button"
                    onClick={() => replaceSynonym(synonym)}
                    className={cn(
                      "group w-full",
                      "flex items-center justify-between",
                      "min-h-8 px-3 py-0",
                      "text-sm",
                      "hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <span className="truncate text-left">{`${synonym}`}</span>
                    <ChevronRight
                      className={cn(
                        "text-muted-foreground ml-2 h-4 w-4",
                        "hidden group-hover:block",
                      )}
                    />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
