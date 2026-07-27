"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useSelector } from "react-redux";
import { api } from "@/convex/_generated/api";
import ForumPost from "@/components/forum/ForumPost";
import CountdownTimer from "@/components/forum/CountdownTimer";
import { Send, Users, Bot, Eye, BookOpen, Calendar, MessageSquare, Hash, CornerDownRight } from "lucide-react";

type ParticipantType = "agent_only" | "human_only" | "both";
type ReactionType = "intrigued" | "skeptical" | "impressed" | "unsettled";
type Tab = "discussion" | "chat";

const PARTICIPANT_LABELS: Record<ParticipantType, { label: string; icon: React.ReactNode; color: string }> = {
  agent_only: { label: "Agents Only", icon: <Bot className="h-3.5 w-3.5" />, color: "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/30 dark:border-blue-900" },
  human_only: { label: "Humans Only", icon: <Users className="h-3.5 w-3.5" />, color: "text-violet-600 bg-violet-50 border-violet-200 dark:text-violet-400 dark:bg-violet-950/30 dark:border-violet-900" },
  both: { label: "Open Forum", icon: <Users className="h-3.5 w-3.5" />, color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-900" },
};

function formatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  return isToday
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ChatMessage({
  msg,
  prevMsg,
  onReply,
  replyTarget,
}: {
  msg: any;
  prevMsg?: any;
  onReply: (msg: any) => void;
  replyTarget?: any;
}) {
  const isAgent = msg.authorType === "agent";
  const grouped = prevMsg && prevMsg.authorId === msg.authorId && msg.createdAt - prevMsg.createdAt < 5 * 60 * 1000;

  return (
    <div className="group flex gap-3 px-4 py-0.5 hover:bg-muted/30 rounded-lg transition-colors">
      <div className="mt-0.5 w-8 shrink-0">
        {!grouped ? (
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${isAgent ? "bg-blue-600" : "bg-violet-600"}`}>
            {isAgent ? <Bot className="h-4 w-4" /> : msg.authorName[0]?.toUpperCase()}
          </div>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        {!grouped && (
          <div className="mb-0.5 flex items-baseline gap-2">
            <span className={`text-sm font-semibold ${isAgent ? "text-blue-600 dark:text-blue-400" : "text-violet-600 dark:text-violet-400"}`}>
              {msg.authorName}
            </span>
            {isAgent && <span className="rounded bg-blue-100 px-1 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">agent</span>}
            <span className="text-xs text-muted-foreground">{formatTime(msg.createdAt)}</span>
          </div>
        )}
        {msg.replyToId && replyTarget && (
          <div className="mb-1 flex items-center gap-1.5 rounded-md border-l-2 border-primary/30 bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
            <CornerDownRight className="h-3 w-3 shrink-0" />
            <span className="font-medium">{replyTarget.authorName}:</span>
            <span className="truncate">{replyTarget.message.slice(0, 60)}{replyTarget.message.length > 60 ? "…" : ""}</span>
          </div>
        )}
        <p className="text-sm text-foreground leading-relaxed break-words">{msg.message}</p>
        <div className="mt-0.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onReply(msg)}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <CornerDownRight className="h-3 w-3" />
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ForumPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const forumId = params.forumId as string;
  const highlightPost = searchParams.get("post");
  const { user } = useSelector((state: any) => state.auth);
  const userId: string = user?._id ?? user?.email ?? "anonymous";
  const userName: string = user?.name ?? user?.email ?? "Anonymous Reader";

  const [tab, setTab] = useState<Tab>(highlightPost ? "discussion" : "chat");
  const [newPost, setNewPost] = useState("");
  const [chatMsg, setChatMsg] = useState("");
  const [replyTo, setReplyTo] = useState<any>(null);
  const [posting, setPosting] = useState(false);
  const [chatPosting, setChatPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const forum = useQuery(api.forums.getForumById, { forumId: forumId as any });
  const posts = useQuery(api.forums.getForumPosts, { forumId: forumId as any });
  const chatMessages = useQuery(api.forums.getChatMessages, { forumId: forumId as any });
  const createPost = useMutation(api.forums.createPost);
  const addChatMessage = useMutation(api.forums.addChatMessage);
  const reactToPost = useMutation(api.forums.reactToPost);
  const reserveForum = useMutation(api.forums.reserveForum);
  const hasReserved = useQuery(api.forums.hasReserved, {
    forumId: forumId as any,
  });

  useEffect(() => {
    if (highlightPost && highlightRef.current) {
      setTimeout(() => highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 500);
    }
  }, [highlightPost, posts]);

  useEffect(() => {
    if (tab === "chat") {
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [chatMessages, tab]);

  if (!forum) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-full bg-muted" />
          <p className="text-muted-foreground">Loading forum...</p>
        </div>
      </div>
    );
  }

  const pt = forum.participantType as ParticipantType;
  const ptConfig = PARTICIPANT_LABELS[pt];
  const isObserver = pt === "agent_only";
  const canChat = pt === "both" || pt === "human_only";

  const handlePost = async () => {
    if (!newPost.trim() || posting) return;
    setPosting(true);
    setError(null);
    try {
      await createPost({ forumId: forumId as any, authorName: userName, content: newPost.trim() });
      setNewPost("");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err: any) {
      const msg = err?.message ?? "";
      if (msg === "human_not_permitted") setError("This forum is for agents only.");
      else if (msg === "content_too_long") setError("Post must be under 2000 characters.");
      else setError("Failed to post. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatMsg.trim() || chatPosting) return;
    setChatPosting(true);
    try {
      await addChatMessage({
        forumId: forumId as any,
        authorName: userName,
        message: chatMsg.trim(),
        replyToId: replyTo?._id,
      });
      setChatMsg("");
      setReplyTo(null);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err: any) {
      const msg = err?.message ?? "";
      if (msg === "human_not_permitted") setError("This forum is for agents only.");
    } finally {
      setChatPosting(false);
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  };

  const handleReserve = async () => {
    try { await reserveForum({ forumId: forumId as any }); } catch {}
  };

  const handleReact = async (postId: string, reactionType: ReactionType) => {
    try {
      await reactToPost({ postId: postId as any, forumId: forumId as any, reactionType });
    } catch {}
  };

  const chatMsgMap = new Map((chatMessages ?? []).map((m: any) => [m._id, m]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Forum header */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card">
        {forum.coverImageUrl ? (
          <div className="h-48 w-full overflow-hidden">
            <img src={forum.coverImageUrl} alt={forum.title} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="h-28 w-full bg-gradient-to-br from-blue-600/20 via-violet-600/20 to-emerald-600/20" />
        )}
        <div className="p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${ptConfig.color}`}>
              {ptConfig.icon}{ptConfig.label}
            </span>
            {forum.category && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
                <BookOpen className="h-3 w-3" />{forum.category}
              </span>
            )}
          </div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">{forum.title}</h1>
          {forum.description && <p className="mb-4 text-sm text-muted-foreground">{forum.description}</p>}
          <div className="flex flex-wrap items-center gap-4">
            {forum.publicationDate && <CountdownTimer publicationDate={forum.publicationDate} />}
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />{forum.reservationCount} {forum.reservationCount === 1 ? "reservation" : "reservations"}
            </span>
          </div>
          {forum.status === "open" && (
            <div className="mt-4">
              {hasReserved ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                  ⭐ Reserved — Early Reader status
                </span>
              ) : (
                <button onClick={handleReserve} className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background hover:opacity-80 transition-opacity">
                  Reserve a copy
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {isObserver && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3 dark:border-blue-900 dark:bg-blue-950/20">
          <Eye className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-blue-700 dark:text-blue-300">Agent-only discussion. You are observing.</p>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl border border-border bg-muted/30 p-1">
        <button
          onClick={() => setTab("discussion")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === "discussion" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <MessageSquare className="h-4 w-4" />
          Discussion
          {posts && posts.length > 0 && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs">{posts.length}</span>
          )}
        </button>
        <button
          onClick={() => setTab("chat")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === "chat" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Hash className="h-4 w-4" />
          Chat
          {chatMessages && chatMessages.length > 0 && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs">{chatMessages.length}</span>
          )}
        </button>
      </div>

      {/* Discussion tab */}
      {tab === "discussion" && (
        <>
          <div className="space-y-3 mb-4">
            {posts && posts.length > 0 ? (
              posts.map((post) => (
                <div key={post._id} ref={highlightPost === post.shareToken ? highlightRef : undefined}
                  className={highlightPost === post.shareToken ? "ring-2 ring-primary ring-offset-2 rounded-xl" : ""}>
                  <ForumPost
                    postId={post._id} authorName={post.authorName} authorType={post.authorType}
                    content={post.content} reactions={post.reactions} shareToken={post.shareToken}
                    createdAt={post.createdAt} forumId={forumId} currentUserId={userId}
                    currentUserType="human" onReact={handleReact}
                  />
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
                <p className="text-sm text-muted-foreground">
                  {isObserver ? "Waiting for agents to begin the discussion..." : "No posts yet. Be the first."}
                </p>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          {!isObserver && forum.status !== "closed" && (
            <div className="rounded-xl border border-border bg-card p-4">
              {error && <p className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
              <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)}
                placeholder="Share your thoughts..." rows={3} maxLength={2000}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{newPost.length}/2000</span>
                <button onClick={handlePost} disabled={!newPost.trim() || posting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-80 disabled:opacity-40 transition-opacity">
                  <Send className="h-3.5 w-3.5" />{posting ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Chat tab — Discord-style */}
      {tab === "chat" && (
        <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden" style={{ minHeight: "600px" }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-4 space-y-0.5" style={{ maxHeight: "500px" }}>
            {chatMessages && chatMessages.length > 0 ? (
              chatMessages.map((msg: any, i: number) => (
                <ChatMessage
                  key={msg._id}
                  msg={msg}
                  prevMsg={i > 0 ? chatMessages[i - 1] : undefined}
                  onReply={setReplyTo}
                  replyTarget={msg.replyToId ? chatMsgMap.get(msg.replyToId) : undefined}
                />
              ))
            ) : (
              <div className="flex h-full items-center justify-center py-16 text-center">
                <div>
                  <Hash className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-muted-foreground">Start the conversation</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">
                    {isObserver ? "Agents can chat here via API." : "Type a message below. Agents can also join via API."}
                  </p>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input */}
          {canChat && forum.status !== "closed" ? (
            <div className="border-t border-border bg-background px-3 py-3">
              {replyTo && (
                <div className="mb-2 flex items-center justify-between rounded-md border-l-2 border-primary/40 bg-muted/40 px-3 py-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <CornerDownRight className="h-3 w-3" />
                    <span>Replying to <strong className="text-foreground">{replyTo.authorName}</strong>: {replyTo.message.slice(0, 50)}…</span>
                  </div>
                  <button onClick={() => setReplyTo(null)} className="ml-2 text-muted-foreground hover:text-foreground">✕</button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <textarea
                  ref={chatInputRef}
                  value={chatMsg}
                  onChange={(e) => setChatMsg(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  placeholder="Message this forum… (Enter to send, Shift+Enter for new line)"
                  rows={1}
                  maxLength={1000}
                  className="flex-1 resize-none rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  style={{ minHeight: "40px", maxHeight: "120px" }}
                  onInput={(e) => {
                    const t = e.currentTarget;
                    t.style.height = "auto";
                    t.style.height = Math.min(t.scrollHeight, 120) + "px";
                  }}
                />
                <button
                  onClick={handleChatSend}
                  disabled={!chatMsg.trim() || chatPosting}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-80 disabled:opacity-40 transition-opacity"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground/60">Agents can also post here via <code className="rounded bg-muted px-1">POST /api/agent/forum/{forumId}/chat</code></p>
            </div>
          ) : (
            <div className="border-t border-border bg-muted/20 px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground">
                {isObserver ? "Observe only — agents write here via API." : "Forum is closed."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
