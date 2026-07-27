import { ToolCallsSection } from "@/components/ui/tool-calls-section";
import { cn } from "@/lib/utils";
import { Bot, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import RenderMarkdown from "./RenderMarkdown";

export default function AgentMessage({ message, handleSideView }) {
  const data = message?.content;
  if (!data && !data.length) return null;

  const toolCalls = data
    .flatMap((item) =>
      item.data
        ? item.data.filter((sub) => sub.type === "tool")
        : [],
    )
    .map((sub) => ({
      tool_name: sub.agent_name || "tool",
      tool_category: sub.agent_name || "agent",
      message: sub.message,
      agent_name: sub.agent_name,
      status: sub.status,
    }));

  const hasMarkdown = data[0]?.message?.includes("##");

  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-2 flex items-center gap-2.5">
        <div className="bg-primary/10 flex size-8 items-center justify-center rounded-full">
          <Bot className="text-primary size-5" />
        </div>
        <h3 className="text-sm font-semibold">Shothik AI Agent</h3>
      </div>

      <div className="ml-10">
        {hasMarkdown ? (
          <div
            onClick={() =>
              handleSideView({
                type: "result",
                data: data[0].message,
                status: data[0].status,
                agent_name: data[0].agent_name,
                message: "Shothik AI Agent Task is completed",
              })
            }
            className="bg-primary/5 hover:bg-primary/10 cursor-pointer rounded-2xl rounded-tl-sm px-5 py-4 transition-colors"
          >
            <RenderMarkdown content={data[0].message} />
            <span className="text-primary mt-2 inline-block text-xs font-medium">
              View full result →
            </span>
          </div>
        ) : (
          <div className="bg-muted max-w-[70%] rounded-2xl rounded-tl-sm px-5 py-3">
            <p className="text-base leading-relaxed">{data[0]?.message}</p>
          </div>
        )}

        {data.slice(1).map((item, index, arr) => {
          const itemHasMarkdown = item?.message?.includes("##");
          const itemToolCalls = item.data
            ? item.data.filter((sub) => sub.type === "tool")
            : [];
          const itemTextMessages = item.data
            ? item.data.filter((sub) => sub.type === "text")
            : [];

          return (
            <div key={index} className="mt-3">
              {itemHasMarkdown ? (
                <div
                  onClick={() =>
                    handleSideView({
                      type: "result",
                      data: item.message,
                      status: item.status,
                      agent_name: item.agent_name,
                      message: "Shothik AI Agent Task is completed",
                    })
                  }
                  className="bg-primary/5 hover:bg-primary/10 cursor-pointer rounded-2xl px-5 py-4 transition-colors"
                >
                  <RenderMarkdown content={item.message} />
                  <span className="text-primary mt-2 inline-block text-xs font-medium">
                    View full result →
                  </span>
                </div>
              ) : (
                <div className="bg-muted max-w-[70%] rounded-2xl px-5 py-3">
                  <p className="text-sm leading-relaxed">{item.message}</p>
                </div>
              )}

              {itemTextMessages.length > 0 && (
                <div className="mt-1.5 space-y-1">
                  {itemTextMessages.map((sub, subIdx) => (
                    <p
                      key={subIdx}
                      className="text-muted-foreground text-sm"
                    >
                      {sub.message}
                    </p>
                  ))}
                </div>
              )}

              {itemToolCalls.length > 0 && (
                <ToolCallsSection
                  toolCalls={itemToolCalls.map((sub) => ({
                    tool_name: sub.agent_name || "tool",
                    tool_category: sub.agent_name || "agent",
                    message: sub.message,
                    agent_name: sub.agent_name,
                    status: sub.status,
                  }))}
                  onToolClick={(call) => {
                    const originalSub = itemToolCalls.find(
                      (s) => s.message === call.message,
                    );
                    if (originalSub) handleSideView(originalSub);
                  }}
                  className="mt-2"
                />
              )}
            </div>
          );
        })}

        {toolCalls.length > 0 && data.length === 1 && (
          <ToolCallsSection
            toolCalls={toolCalls}
            onToolClick={(call) => {
              const originalSub = data[0]?.data?.find(
                (s) => s.message === call.message && s.type === "tool",
              );
              if (originalSub) handleSideView(originalSub);
            }}
            className="mt-2"
          />
        )}
      </div>
    </motion.div>
  );
}
