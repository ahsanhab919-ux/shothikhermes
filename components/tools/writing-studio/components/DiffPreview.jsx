"use client";
import { Button } from "@/components/ui/button";
import { Eye, X, Check } from "lucide-react";

export function DiffPreview({ original, modified, onAccept, onReject }) {
  return (
    <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Review Changes
        </span>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={onReject} className="h-7 text-destructive">
            <X className="h-4 w-4 mr-1" />
            Reject
          </Button>
          <Button size="sm" onClick={onAccept} className="h-7">
            <Check className="h-4 w-4 mr-1" />
            Accept
          </Button>
        </div>
      </div>
      <div className="grid gap-2">
        <div className="text-xs font-medium text-muted-foreground">Original</div>
        <div className="bg-red-500/10 border border-red-500/20 rounded p-2 text-sm line-through opacity-70">
          {original.length > 200 ? original.slice(0, 200) + "..." : original}
        </div>
        <div className="text-xs font-medium text-muted-foreground">Improved</div>
        <div className="bg-green-500/10 border border-green-500/20 rounded p-2 text-sm">
          {modified.length > 200 ? modified.slice(0, 200) + "..." : modified}
        </div>
      </div>
    </div>
  );
}
