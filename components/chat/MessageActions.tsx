"use client";

import { Copy, RotateCcw, Square, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageActionsProps {
  canRegenerate?: boolean;
  canStop?: boolean;
  onCopy?: () => void;
  onDelete?: () => void;
  onRegenerate?: () => void;
  onStop?: () => void;
}

export function MessageActions({
  canRegenerate,
  canStop,
  onCopy,
  onDelete,
  onRegenerate,
  onStop,
}: MessageActionsProps) {
  return (
    <div className="flex items-center gap-1">
      <Button type="button" variant="ghost" size="icon-sm" onClick={onCopy} aria-label="Copy message">
        <Copy className="h-4 w-4" />
      </Button>
      {canRegenerate ? (
        <Button type="button" variant="ghost" size="icon-sm" onClick={onRegenerate} aria-label="Regenerate response">
          <RotateCcw className="h-4 w-4" />
        </Button>
      ) : null}
      {canStop ? (
        <Button type="button" variant="ghost" size="icon-sm" onClick={onStop} aria-label="Stop response">
          <Square className="h-4 w-4" />
        </Button>
      ) : null}
      <Button type="button" variant="ghost" size="icon-sm" onClick={onDelete} aria-label="Delete message">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
