import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/ui/useMobile";
import { cn } from "@/lib/utils";
import { ArrowLeft, Bot, Loader2, Paperclip, Send } from "lucide-react";
import { useRef, useState } from "react";

const ai_agent_list = [
  {
    title: "Super Agent",
    agent_name: "shothik_ai_agent",
  },
  {
    title: "Deep Research",
    agent_name: "deep_research_agent",
  },
  {
    title: "Slider Deck",
    agent_name: "slider_creator_agent",
  },
];

export default function InputArea({ addChatHistory, loading, showTitle }) {
  const [files, setFiles] = useState(null);
  const [value, setValue] = useState("");
  const filesRef = useRef(null);
  const isMobile = useIsMobile();
  const [selectedAgent, setSelectedAgent] = useState(null);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!value) return;

    addChatHistory({ message: value, files }, "user");
    setValue("");
    setFiles(null);
  };

  const handleFileInputClick = () => {
    if (!filesRef.current) return;
    filesRef.current.click();
  };

  const handleInputChange = (e) => {
    const files = e.target.files;
    setFiles(files);
  };

  return (
    <div className="flex w-full items-center justify-center">
      {showTitle && !selectedAgent && (
        <div className="mb-2">
          <h3 className="text-primary mb-2 text-center text-[22px] font-semibold">
            Shothik AI multi Agent solution
          </h3>
          <div className="flex items-center gap-2">
            {ai_agent_list.map((agent, index) => (
              <div
                className="border-primary bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer rounded-lg border px-4 py-1 transition-colors"
                onClick={() => setSelectedAgent(agent)}
                key={index}
              >
                <span className="text-sm font-medium">{agent.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {selectedAgent && (
        <div
          className={cn(
            "border-primary bg-primary/10 text-primary flex items-center justify-start rounded-t-lg border border-b-0",
            isMobile ? "w-full" : "w-[80%]",
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedAgent(null)}
            className="h-9 w-9"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <span className="text-sm font-medium">{selectedAgent.title}</span>
        </div>
      )}
      <form
        onSubmit={handleAdd}
        className={cn(
          "border-primary flex items-center rounded-lg border p-4",
          selectedAgent && "rounded-t-none",
          isMobile ? "w-full" : "w-[80%]",
          showTitle ? "flex-col" : "flex-row",
          "justify-between",
        )}
      >
        <div
          className={cn(
            "flex w-full items-center",
            isMobile && !showTitle && "w-auto",
          )}
        >
          <Bot className="text-primary mr-3 size-5" />
          <Input
            placeholder="Give a task to Shothik AI Agent"
            className={cn(
              "w-full border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
              isMobile ? "min-w-[200px]" : "min-w-[300px]",
            )}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />

          <input
            type="file"
            ref={filesRef}
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            multiple
            onChange={handleInputChange}
          />
        </div>

        <div
          className={cn(
            "flex w-full items-center justify-end",
            isMobile && !showTitle && "w-auto",
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={handleFileInputClick}
                className="group relative"
              >
                {files && (
                  <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full text-xs font-semibold group-hover:hidden">
                    {Array.from(files).length}
                  </span>
                )}
                <Paperclip className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {filesRef?.current?.files?.length
                  ? `${filesRef.current.files.length} Files selected`
                  : "Attach files"}
              </p>
            </TooltipContent>
          </Tooltip>

          <Button disabled={loading} type="submit" size="icon">
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
