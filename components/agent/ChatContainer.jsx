import { cn } from "@/lib/utils";
import AgentMessage from "./AgentMessage";
import UserMessage from "./UserMessage";

export default function ChatContainer({
  chatHistory,
  handleSideView,
  ref,
  onScroll,
  messageBottomRef,
}) {
  return (
    <div
      ref={ref}
      onScroll={onScroll}
      className={cn("mb-4 flex flex-1 flex-col gap-4 overflow-y-auto")}
    >
      {chatHistory.map((message, index) =>
        message.role === "user" ? (
          <UserMessage key={index} message={message.content} />
        ) : (
          <AgentMessage
            handleSideView={handleSideView}
            key={index}
            message={message}
          />
        ),
      )}

      <div ref={messageBottomRef} />
    </div>
  );
}
