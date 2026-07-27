import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Editor from "@monaco-editor/react";
import { Bot, Brain, Globe, Minimize2 } from "lucide-react";
import { motion } from "motion/react";
import RenderMarkdown from "./RenderMarkdown";
import TaskProgress from "./TaskProgress";

const ComputerWindow = ({ computerLogs, closeWindow, taskProgress }) => {
  function handleEditorWillMount(monaco) {
    monaco.editor.defineTheme("mint-light-theme", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "", foreground: "2d2d2d" }, // default text
        { token: "comment", foreground: "6a737d", fontStyle: "italic" },
        { token: "keyword", foreground: "d73a49" },
        { token: "string", foreground: "032f62" },
        { token: "number", foreground: "005cc5" },
        { token: "variable", foreground: "e36209" },
        { token: "type", foreground: "22863a" },
      ],
      colors: {
        "editor.background": "#cbe9dd",
        "editor.foreground": "#2d2d2d",
        "editorLineNumber.foreground": "#5c5c5c",
        "editorCursor.foreground": "#333333",
        "editor.selectionBackground": "#a4c8ba88",
        "editor.inactiveSelectionBackground": "#a4c8ba44",
      },
    });
  }

  return (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      exit={{ x: 50, opacity: 0, transition: { duration: 0.5 } }}
    >
      <Card className={cn("relative h-full p-4")}>
        <div className="mb-0.5 flex flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(
                "bg-primary/10 text-primary rounded-md p-2",
                "hover:bg-primary/20",
              )}
            >
              <Bot className="size-4" />
            </Button>
            <h3 className="text-lg font-bold">Shothik AI Computer</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeWindow}
            className="text-muted-foreground"
          >
            <Minimize2 className="size-4 rotate-45" />
          </Button>
        </div>

        <div
          className={cn(
            "bg-primary/10 rounded-lg px-3 py-1",
            "w-fit cursor-pointer",
            "text-primary",
            "mb-2 flex flex-row items-center gap-1",
          )}
        >
          <span className="text-sm">Shothik AI Agent is using</span>
          {computerLogs.agent_name === "browser_agent" ? (
            <Globe className="text-primary size-4" />
          ) : computerLogs.agent_name === "planner_agent" ? (
            <Brain className="text-primary size-4" />
          ) : (
            <Bot className="text-primary size-4" />
          )}
        </div>

        <div
          className={cn(
            "relative h-[500px] overflow-hidden overflow-y-auto rounded-md",
          )}
        >
          <div
            className={cn(
              "border-border border-b px-2 py-1 text-center",
              "bg-primary/10 text-primary",
              "overflow-hidden text-ellipsis whitespace-nowrap",
              "sticky top-0 z-10",
            )}
          >
            {computerLogs?.message?.includes("##") &&
            computerLogs?.type === "text"
              ? "Shothik AI Agent Task is completed"
              : computerLogs.message}
          </div>
          {computerLogs?.type === "tool" ? (
            <Editor
              height="93.5%"
              defaultLanguage="markdown"
              value={computerLogs?.data?.result}
              beforeMount={handleEditorWillMount}
              theme="mint-light-theme"
              options={{
                readOnly: true,
                scrollBeyondLastLine: false,
                minimap: { enabled: false },
                lineNumbers: "off",
                wordWrap: "on",
              }}
            />
          ) : computerLogs?.type === "result" ||
            computerLogs?.message?.includes("##") ? (
            <div className={cn("h-[93.5%] overflow-auto px-4", "bg-primary/5")}>
              <RenderMarkdown
                content={
                  computerLogs?.message?.includes("##")
                    ? computerLogs?.message
                    : computerLogs?.data
                }
              />
            </div>
          ) : null}
        </div>

        {/* bottom progress */}
        {taskProgress.length ? (
          <TaskProgress taskProgress={taskProgress} />
        ) : null}
      </Card>
    </motion.div>
  );
};

export default ComputerWindow;
