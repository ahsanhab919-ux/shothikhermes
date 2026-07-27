import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import useResponsive from "@/hooks/ui/useResponsive";
import { History, Keyboard, MessageSquare, Settings } from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import SettingsSidebar from "../paraphrase/settings/SettingsSidebar";
import GPTsettingSidebar from "./GPTsettingSidebar";

export default function GPTsettings({
  handleHistorySelect,
  allHumanizeHistory,
  refetchHistory,
}) {
  const mobile = useResponsive("down", "lg");
  const [showSidebar, setShowSidebar] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const paidUser = user?.package && user.package !== "free";

  // 

  return (
    <>
      <div className="z-10 mt-1 flex max-h-[90vh] flex-col px-0 lg:max-h-[638px]">
        <div className="flex flex-col items-center gap-0">
          <div id="gpt-history">
            <ActionButton
              id="gpt-history"
              title="History"
              icon={History}
              onClick={() => setShowSidebar("gpt-history")}
              disabled={false}
              crown={!paidUser}
              mobile={mobile}
            />
          </div>
        </div>

        <div className="mt-2 flex flex-col items-center gap-0">
          <div id="gpt_settings">
            <ActionButton
              title="Settings"
              id="gpt_settings_button"
              icon={Settings}
              onClick={() => setShowSidebar("settings")}
              disabled={false}
              mobile={mobile}
            />
          </div>
          <div id="gpt_feedback">
            <ActionButton
              id="gpt_feedback_button"
              title="Feedback"
              icon={MessageSquare}
              onClick={() => setShowSidebar("feedback")}
              disabled={false}
              mobile={mobile}
            />
          </div>
          <div id="gpt_shortcuts">
            <ActionButton
              id="gpt_shortcuts_button"
              title="Hotkeys"
              icon={Keyboard}
              onClick={() => setShowSidebar("shortcuts")}
              disabled={false}
              mobile={mobile}
            />
          </div>
        </div>
      </div>

      <Sheet open={!!showSidebar} onOpenChange={() => setShowSidebar(false)}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[400px] [&>button.absolute]:hidden"
        >
          {["gpt-history"].includes(showSidebar) && (
            <GPTsettingSidebar
              open={showSidebar}
              onClose={() => setShowSidebar((prev) => !prev)}
              active={showSidebar}
              setActive={setShowSidebar}
              allHumanizeHistory={allHumanizeHistory}
              refetchHistory={refetchHistory}
              handleHistorySelect={handleHistorySelect}
            />
          )}

          {["settings", "feedback", "shortcuts"].includes(showSidebar) && (
            <SettingsSidebar
              open={showSidebar}
              onClose={() => setShowSidebar((prev) => !prev)}
              tab={showSidebar}
              setTab={setShowSidebar}
              mobile={mobile}
              fromComp="humanize"
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

// INNER USED COMPONENT
function ActionButton({
  id,
  title,
  icon: Icon,
  onClick,
  disabled,
  crown = false,
  mobile,
}) {
  const words = title.split(" ");
  const containerStyles = mobile
    ? "w-full flex-row items-center justify-start gap-2 p-2"
    : "flex-col gap-0";

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`flex ${containerStyles} ${mobile ? "rounded-md" : ""} select-none ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
    >
      {/* icon + optional crown */}
      <div className="relative flex items-center justify-center">
        <Button
          id={id}
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) onClick();
          }}
          disabled={disabled}
        >
          <Icon className="h-5 w-5" />
        </Button>
        {crown && (
          <img
            src="/premium_crown.svg"
            alt="premium crown"
            className={`pointer-events-none ${mobile ? "absolute -right-1 -bottom-1" : "absolute right-2 bottom-1"}`}
            width={16}
            height={16}
          />
        )}
      </div>

      {/* split title into separate lines */}
      <span
        className={`text-foreground ${mobile ? "ml-2 whitespace-nowrap" : "text-center whitespace-pre-line"}`}
        style={{ fontSize: 12, lineHeight: 1.2 }}
      >
        {mobile ? title : words.join("\n")}
      </span>
    </div>
  );
}
