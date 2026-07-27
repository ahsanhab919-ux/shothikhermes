import { Button } from "@/components/ui/button";
import Blockquote from "@tiptap/extension-blockquote";
import Bold from "@tiptap/extension-bold";
import BulletList from "@tiptap/extension-bullet-list";
import Heading from "@tiptap/extension-heading";
import HorizontalRuleExtension from "@tiptap/extension-horizontal-rule";
import Italic from "@tiptap/extension-italic";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Underline as UnderlineIcon,
} from "lucide-react";
import { useEffect } from "react";

const TipTapEditor = ({ content, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Heading.configure({ levels: [1, 2, 3, 4] }), // Supports H2 - H4
      BulletList,
      OrderedList,
      ListItem,
      Blockquote,
      HorizontalRuleExtension,
      Bold,
      Italic,
      Underline,
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div>
      <div className="border-border flex gap-2 rounded-t-md border-2 border-b-0 py-2">
        {/* Bold */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => editor.commands.toggleBold()}
          className="h-8 w-8"
        >
          <BoldIcon className="h-4 w-4" />
        </Button>

        {/* Italic */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => editor.commands.toggleItalic()}
          className="h-8 w-8"
        >
          <ItalicIcon className="h-4 w-4" />
        </Button>

        {/* Underline */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => editor.commands.toggleUnderline()}
          className="h-8 w-8"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        {/* Paragraph */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => editor.commands.setParagraph({ level: 1 })}
          className="h-8 w-8 text-xs font-semibold"
        >
          P
        </Button>

        {/* H2 */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => editor.commands.setHeading({ level: 2 })}
          className="h-8 w-8 text-xs font-semibold"
        >
          H2
        </Button>

        {/* H3 */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => editor.commands.setHeading({ level: 3 })}
          className="h-8 w-8 text-xs font-semibold"
        >
          H3
        </Button>

        {/* H4 */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => editor.commands.setHeading({ level: 4 })}
          className="h-8 w-8 text-xs font-semibold"
        >
          H4
        </Button>

        {/* Ordered List */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => editor.commands.toggleOrderedList()}
          className="h-8 w-8"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        {/* Unordered List */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => editor.commands.toggleBulletList()}
          className="h-8 w-8"
        >
          <List className="h-4 w-4" />
        </Button>

        {/* Blockquote */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => editor.commands.toggleBlockquote()}
          className="h-8 w-8"
        >
          <Quote className="h-4 w-4" />
        </Button>

        {/* Horizontal Rule */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => editor.commands.setHorizontalRule()}
          className="h-8 w-8"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <div className="border-border focus-within:border-primary min-h-[100px] rounded-b-md border-2 transition-colors focus-within:rounded-t-md">
        <EditorContent editor={editor} />
      </div>

      {/* Global Styles for ProseMirror */}
      <style>{`
        .ProseMirror {
          min-height: 90px;
          padding: 5px 10px;
          font-size: 16px;
          outline: none;
        }
        .ProseMirror p,
        .ProseMirror h2,
        .ProseMirror h3,
        .ProseMirror h4 {
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default TipTapEditor;
