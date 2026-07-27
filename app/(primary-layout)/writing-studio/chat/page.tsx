import ChatAgentPage from "@/components/agents/ChatAgentPage";

export const metadata = {
  title: "AI Chat — Shothik AI",
  description: "Chat with Shothik AI, your academic writing and research assistant.",
};

export default function WritingStudioChatPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <ChatAgentPage />
    </div>
  );
}
