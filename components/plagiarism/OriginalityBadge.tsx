import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { getOriginalityTone } from "./plagiarism-modernization";

interface OriginalityBadgeProps {
  originality: number;
}

export default function OriginalityBadge({ originality }: OriginalityBadgeProps) {
  const tone = getOriginalityTone(originality);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          tabIndex={0}
          aria-label={`Originality score ${originality} percent. ${tone.label}.`}
          className={cn("rounded-full border px-3 py-1 text-sm font-semibold", tone.classes)}
        >
          {originality}% original
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p>
          Originality reflects how much of the scanned text appears unique compared with matched sources.
          Higher percentages indicate less overlap.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
