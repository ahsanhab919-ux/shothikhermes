import { History, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";
import UpgradePrompt from "../paraphrase/UpgradePrompt";
import GPTHistoryTab from "./GPTHistoryTab";

const tabs = [
  { id: "gpt-history", icon: <History />, component: GPTHistoryTab },
];

export default function GPTsettingSidebar({
  open,
  onClose,
  active,
  setActive,
  allHumanizeHistory,
  refetchHistory,
  handleHistorySelect,
}) {
  const { user } = useSelector((state) => state.auth);

  const paidUser =
    user?.package === "pro_plan" ||
    user?.package === "value_plan" ||
    user?.package === "unlimited";

  if (!open) return null;

  return (
    <div className="h-auto w-full overflow-y-auto border-l border-border bg-background">
      {/* top nav with bottom border */}
      <div className="flex flex-row-reverse items-center justify-between px-2 pb-1 pt-2">
        {/* <Box sx={{ display: "flex", flex: 1, justifyContent: "space-around" }}>
          {tabs.map((t) => {
            return (
              <Box
                key={t.id}
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <IconButton
                  size="large"
                  disableRipple
                  // disabled={disableActions && t.id !== "history"}
                  sx={{
                    color: "primary.main",
                  }}
                >
                  {React.cloneElement(t.icon, { fontSize: "30px" })}
                </IconButton>
                {active === t.id && (
                  <Box
                    sx={{
                      width: 24,
                      borderBottom: 2,
                      borderColor: "primary.main",
                      mt: 0.5,
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box> */}

        <Button variant="ghost" size="icon" id="GPT_sidebar_x_button" onClick={onClose} className="h-7 w-7">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* active tab content */}
      {
        !paidUser ? (
          <UpgradePrompt onClose={onClose} />
        ) : // Modified rendering logic
        active === "gpt-history" ? (
          <GPTHistoryTab
            onClose={onClose}
            allHumanizeHistory={allHumanizeHistory}
            refetchHistory={refetchHistory}
            handleHistorySelect={handleHistorySelect}
          />
        ) : // For future tabs, We would add more conditions or a generic renderer
        // For now, if it's not gpt-history, we'll just render a placeholder or nothing
        // We might want to define a default component or handle other tabs here
        // For example:
        // {tabs.find((t) => t.id === active)?.component && (
        //   React.createElement(tabs.find((t) => t.id === active)?.component)
        // )}
        // For now, assuming GPTHistoryTab is the only one, we can keep it simple.
        // If other tabs are added, this logic will need to be expanded.
        null // Or a default component if no specific tab is active
      }
    </div>
  );
}
