"use client";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toggleParaphraseOption } from "@/redux/slices/settings-slice";
import { useDispatch, useSelector } from "react-redux";

export default function AutoParaphraseSettings() {
  const dispatch = useDispatch();
  const { paraphraseOptions } = useSelector((state) => state.settings);

  const handleAutoParaphraseToggle = () => {
    dispatch(toggleParaphraseOption("automaticStartParaphrasing")); // "automaticStartParaphrasing" -> is the key to set auto paraphrasing true on redux
    // 
  };
  return (
    <div className={cn("w-full")}>
      <div className={cn("flex items-center gap-2")}>
        <span
          className={cn(
            "text-muted-foreground text-[13px] font-semibold whitespace-nowrap",
          )}
        >
          Auto Paraphrase
        </span>
        <Switch
          checked={paraphraseOptions.automaticStartParaphrasing}
          onCheckedChange={handleAutoParaphraseToggle}
          aria-label="auto paraphrase"
          data-rybbit-event="Auto Paraphrase"
        />
      </div>
    </div>
  );
}
