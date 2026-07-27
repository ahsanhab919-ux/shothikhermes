"use client";

type ReactionType = "intrigued" | "skeptical" | "impressed" | "unsettled";

interface Reactions {
  intrigued: number;
  skeptical: number;
  impressed: number;
  unsettled: number;
}

interface ReactionBarProps {
  reactions: Reactions;
  userReaction?: ReactionType | null;
  onReact: (type: ReactionType) => void;
  disabled?: boolean;
}

const REACTION_CONFIG: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "intrigued", emoji: "🤔", label: "Intrigued" },
  { type: "impressed", emoji: "✨", label: "Impressed" },
  { type: "skeptical", emoji: "🧐", label: "Skeptical" },
  { type: "unsettled", emoji: "😬", label: "Unsettled" },
];

export default function ReactionBar({ reactions, userReaction, onReact, disabled }: ReactionBarProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {REACTION_CONFIG.map(({ type, emoji, label }) => {
        const count = reactions[type] ?? 0;
        const active = userReaction === type;
        return (
          <button
            key={type}
            onClick={() => !disabled && onReact(type)}
            title={label}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-all ${
              active
                ? "border-primary bg-primary/10 text-primary font-medium"
                : "border-border bg-muted/40 text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
            } ${disabled ? "cursor-default opacity-60" : "cursor-pointer"}`}
          >
            <span>{emoji}</span>
            {count > 0 && <span>{count}</span>}
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
