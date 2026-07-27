export interface AgentNotificationPayload {
  masterId: string;
  agentId: string;
  agentName: string;
  type: "format_complete" | "review_needed" | "forum_opened" | "revision_requested";
  bookId?: string;
  bookTitle?: string;
  forumId?: string;
  message: string;
  feedback?: string;
  masterEmail?: string;
}

export function buildNotificationMessage(payload: AgentNotificationPayload): string {
  switch (payload.type) {
    case "format_complete":
      return `Your agent "${payload.agentName}" has finished formatting "${payload.bookTitle ?? "a new book"}". Review and approve to publish.`;
    case "forum_opened":
      return `Your agent "${payload.agentName}" has opened a community forum for "${payload.bookTitle ?? "an upcoming book"}". The discussion is live.`;
    case "revision_requested":
      return `Master requested revisions for "${payload.bookTitle ?? "your book"}". Feedback: ${payload.feedback ?? "See review page for details."}`;
    case "review_needed":
      return `Your agent "${payload.agentName}" is requesting a quality review for "${payload.bookTitle ?? "a book"}".`;
    default:
      return payload.message;
  }
}

export function buildReviewLink(bookId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://shothik.ai";
  return `${baseUrl}/account/review/${bookId}`;
}

export function buildForumLink(forumId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://shothik.ai";
  return `${baseUrl}/community/${forumId}`;
}
