"use client";

export default function LogRouter({ log, onViewSummary, handlePreviewOpen }) {
    if (!log) return null;

    const text = log.text || log.content || log.user_message || "";
    const isUser = log.author === "user";

    return (
        <div
            className={`rounded-lg px-3 py-2 text-sm ${
                isUser
                    ? "bg-primary text-primary-foreground ml-auto max-w-[80%]"
                    : "bg-muted text-foreground max-w-[90%]"
            }`}
        >
            {text && <p className="whitespace-pre-wrap break-words">{text}</p>}
            {log.summary && (
                <button
                    onClick={() => onViewSummary?.(log)}
                    className="mt-1 text-xs underline opacity-70 hover:opacity-100"
                >
                    View summary
                </button>
            )}
        </div>
    );
}
