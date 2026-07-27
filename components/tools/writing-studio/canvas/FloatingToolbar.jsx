"use client";

import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Undo,
  Redo,
  Link as LinkIcon,
  Unlink,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWritingStudio } from "../providers/WritingStudioProvider";

export function FloatingToolbar() {
  const { editor, showLinkInput, setShowLinkInput, linkUrl, setLinkUrl, handleSetLink } = useWritingStudio();

  if (!editor) return null;

  const ToolBtn = ({ onClick, active, disabled, children, label }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "p-1.5 rounded transition-colors",
        active
          ? "bg-white dark:bg-zinc-700 text-brand"
          : "text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700"
      )}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );

  return (
    <div className="h-11 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-center px-4 gap-3 sticky top-0 bg-white/80 dark:bg-brand-surface/80 backdrop-blur-sm z-20">
      <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 gap-0.5">
        <ToolBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive("heading", { level: 1 })}
          label="Heading 1"
        >
          <Heading1 className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          label="Heading 2"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          label="Heading 3"
        >
          <Heading3 className="h-3.5 w-3.5" />
        </ToolBtn>
      </div>

      <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 gap-0.5">
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          label="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          label="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          label="Underline"
        >
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          label="Strikethrough"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolBtn>
      </div>

      <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800" />

      <div className="flex items-center gap-0.5">
        <ToolBtn
          onClick={() => {
            if (editor.isActive("link")) {
              editor.chain().focus().unsetLink().run();
            } else {
              setShowLinkInput(true);
            }
          }}
          active={editor.isActive("link")}
          label="Link"
        >
          {editor.isActive("link") ? <Unlink className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" />}
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          label="Quote"
        >
          <Quote className="h-3.5 w-3.5" />
        </ToolBtn>
      </div>

      <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800" />

      <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 gap-0.5">
        <ToolBtn
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          label="Align left"
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          label="Align center"
        >
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolBtn>
      </div>

      <div className="flex items-center gap-0.5">
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          label="Bullet list"
        >
          <List className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          label="Ordered list"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolBtn>
      </div>

      <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800" />

      <div className="flex items-center gap-0.5">
        <ToolBtn
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          label="Undo"
        >
          <Undo className="h-3.5 w-3.5" />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          label="Redo"
        >
          <Redo className="h-3.5 w-3.5" />
        </ToolBtn>
      </div>

      {showLinkInput && (
        <div className="absolute top-full left-0 right-0 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-brand-surface px-4 py-1.5 flex items-center gap-2 z-30">
          <input
            type="url"
            placeholder="Enter URL..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg px-2.5 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand/30"
            onKeyDown={(e) => e.key === "Enter" && handleSetLink()}
            autoFocus
          />
          <Button size="sm" onClick={handleSetLink} className="h-7 text-xs bg-brand">Apply</Button>
          <Button size="sm" variant="ghost" onClick={() => setShowLinkInput(false)} className="h-7 text-xs">Cancel</Button>
        </div>
      )}
    </div>
  );
}
