// SettingsTab.jsx
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useResponsive from "@/hooks/ui/useResponsive";
import { cn } from "@/lib/utils";
import {
  toggleInterfaceOption,
  toggleParaphraseOption,
} from "@/redux/slices/settings-slice";
import { Info } from "lucide-react";
import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

const SettingsTab = () => {
  const dispatch = useDispatch();
  const isMobile = useResponsive("down", "md");

  const { paraphraseOptions, interfaceOptions } = useSelector(
    (state) => state.settings,
  );

  const paraphraseOptionsMeta = useMemo(
    () => [
      {
        key: "paraphraseQuotations",
        label: "Paraphrase quotations",
        info: false,
        showOnDesktop: true,
      },
      {
        key: "avoidContractions",
        label: "Avoid contractions",
        info: true,
        showOnDesktop: true,
      },
      {
        key: "automaticStartParaphrasing",
        label: "Automatic paraphrase",
        info: false,
        showOnDesktop: false,
      },
      {
        key: "autoFreeze",
        label: "Auto freeze",
        info: false,
        showOnDesktop: false,
      },
    ],
    [],
  );

  const interfaceOptionsMeta = useMemo(
    () => [
      { key: "useYellowHighlight", label: "Use yellow highlight", info: false },
      { key: "showTooltips", label: "Show tooltips", info: false },
      {
        key: "showChangedWords",
        label: "Show ",
        highlightText: "changed words",
        highlight: "text-primary",
        info: false,
      },
      {
        key: "showStructuralChanges",
        label: "Show Structural changes",
        info: false,
      },
      // {
      //   key: "showLongestUnchangedWords",
      //   label: "Show ",
      //   highlightText: "longest unchanged words",
      //   highlight: "text-primary",
      //   info: false,
      // },
    ],
    [],
  );

  const visibleParaphraseOptions = useMemo(() => {
    if (!isMobile) {
      return paraphraseOptionsMeta.filter((option) => option.showOnDesktop);
    }
    return paraphraseOptionsMeta;
  }, [isMobile, paraphraseOptionsMeta]);

  return (
    <div id="settings_tab">
      <h2 className="mb-4 text-xl font-bold">Settings</h2>

      {/* Paraphrase Section - Only show if there are visible options */}
      {visibleParaphraseOptions.length > 0 && (
        <>
          <h3 className="text-muted-foreground mb-2 text-sm font-medium">
            Paraphrase
          </h3>
          <div className="space-y-1">
            {visibleParaphraseOptions.map(({ key, label, info }) => (
              <div key={key} className="flex items-center justify-start gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={paraphraseOptions[key]}
                    onCheckedChange={() =>
                      dispatch(toggleParaphraseOption(key))
                    }
                  />
                  <label
                    htmlFor={key}
                    className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {label}
                  </label>
                </div>
                {info && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-transparent hover:bg-transparent"
                      >
                        <Info className="text-muted-foreground h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      className="z-[1002] max-w-[200px]"
                      side="bottom"
                    >
                      <p>
                        A contraction joins two words into a shorter form, such
                        as turning do not into don't.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            ))}
          </div>
          <Separator className="my-2" />
        </>
      )}

      {/* Interface Section */}
      <h3 className="text-muted-foreground mb-2 text-sm font-medium">
        Interface
      </h3>
      <div className="space-y-2.5">
        {interfaceOptionsMeta.map(
          ({ key, label, info, highlight, highlightText }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={key}
                  checked={interfaceOptions[key] || false}
                  onCheckedChange={() => dispatch(toggleInterfaceOption(key))}
                />
                <label
                  htmlFor={key}
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {label}
                  {highlightText && (
                    <span
                      className={cn(
                        "text-sm leading-none font-medium",
                        highlight,
                      )}
                    >
                      {highlightText}
                    </span>
                  )}
                </label>
              </div>
              {info && (
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="text-muted-foreground h-4 w-4" />
                </Button>
              )}
            </div>
          ),
        )}
      </div>
    </div>
  );
};

export default SettingsTab;
