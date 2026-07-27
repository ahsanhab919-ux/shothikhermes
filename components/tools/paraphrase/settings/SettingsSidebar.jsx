// SettingsSidebar.jsx
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Keyboard, MessageSquare, Settings } from "lucide-react";

import GPTsettingsTab from "../../humanize/GPTsettingsTab";
import FeedbackTab from "./FeedbackTab";
import SettingsTab from "./SettingsTab";
import ShortcutsTab from "./ShortcutsTab";

const tabs = [
  { id: "settings", icon: <Settings className="h-6 w-6" /> },
  { id: "feedback", icon: <MessageSquare className="h-6 w-6" /> },
  { id: "shortcuts", icon: <Keyboard className="h-6 w-6" /> },
];

const SettingsSidebar = ({
  open,
  onClose,
  tab = "settings",
  setTab,
  mobile = false,
  fromComp = "paraphrase", // This flag is to maintain different sesstings on same component. ENUM: [paraphrase, humanize, ai-detector, grammar-fix, translator]
}) => {
  if (!open) return null;

  return (
    <div
      className={cn(
        "bg-background box-border h-auto w-full overflow-y-auto sm:h-[calc(100vh-90px)]",
        !mobile && "border-border border-l",
      )}
    >
      {/* Top Nav */}
      <div className="flex items-center justify-between px-2 pt-2 pb-1">
        <div className="flex flex-1 justify-around">
          {tabs.map((t) => (
            <div
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex flex-1 cursor-pointer flex-col items-center"
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "text-muted-foreground h-9 w-9",
                  tab === t.id && "text-primary",
                )}
              >
                {t.icon}
              </Button>
              {tab === t.id && (
                <div className="border-primary mt-0.5 w-6 border-b-2" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-2">
        {
          tab === "settings" && fromComp === "paraphrase" ? (
            <SettingsTab />
          ) : tab === "settings" && fromComp === "humanize" ? (
            <GPTsettingsTab />
          ) : null // default
        }
        {tab === "feedback" && <FeedbackTab />}
        {tab === "shortcuts" && <ShortcutsTab fromComp={fromComp} />}
      </div>
    </div>
  );
};

export default SettingsSidebar;
