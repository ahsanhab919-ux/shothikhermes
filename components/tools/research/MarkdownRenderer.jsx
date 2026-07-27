import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useGetResearchMetaDataQuery } from "@/redux/api/tools/toolsApi";
import { Check, Copy } from "lucide-react";
import Marked from "marked-react";
import Image from "next/image";
import { useCallback, useState } from "react";

const isValidUrl = (str) => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

const LinkPreview = ({ href }) => {
  const { data: metadata, isLoading } = useGetResearchMetaDataQuery(
    {
      url: href,
    },
    { skip: !href },
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Spinner className="text-muted-foreground h-5 w-5" />
      </div>
    );
  }

  const domain = new URL(href).hostname;

  return (
    <Card className="flex flex-col overflow-hidden">
      {/* Header Section */}
      <div className="bg-muted flex items-center gap-2 p-2">
        <Image
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=256`}
          alt="Favicon"
          width={20}
          height={20}
          className="rounded"
        />
        <p className="text-muted-foreground overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap">
          {domain}
        </p>
      </div>

      {/* Content Section */}
      <div className="px-2 pb-2">
        <h6 className="text-foreground line-clamp-2 text-base font-semibold">
          {metadata?.title || "Untitled"}
        </h6>

        {metadata?.description && (
          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
            {metadata.description}
          </p>
        )}
      </div>
    </Card>
  );
};

const RenderHoverCard = ({ href, text, isCitation = false }) => {
  return (
    <span className="inline-block">
      {/* Link as Trigger */}
      <HoverCard>
        <HoverCardTrigger asChild>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center justify-center no-underline",
              isCitation
                ? "bg-border text-muted-foreground h-5 w-5 cursor-help rounded-full text-sm"
                : "text-muted-foreground cursor-pointer",
            )}
          >
            {text}
          </a>
        </HoverCardTrigger>
        <HoverCardContent
          side="top"
          align="start"
          className="pointer-events-auto w-80 p-0"
        >
          <div className="border-border w-full border p-0">
            <LinkPreview href={href} />
          </div>
        </HoverCardContent>
      </HoverCard>
    </span>
  );
};

const MarkdownRenderer = ({ content }) => {
  let linkItem = 0;

  // Handle content - it might be an object with text property or a string
  let contentStr = "";
  if (typeof content === "string") {
    contentStr = content;
  } else if (typeof content === "object" && content !== null) {
    // If content is an object, try to extract the text content
    contentStr =
      content.text || content.content || content.result || content.answer || "";
  } else {
    contentStr = String(content || "");
  }

  // Clean any [object Object] strings from the content
  contentStr = contentStr.replace(/\[object Object\]/g, "");

  const CodeBlock = ({ language, children }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = useCallback(async () => {
      await navigator.clipboard.writeText(children);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }, [children]);

    return (
      <div className="my-0.5">
        <div className="border-border grid grid-rows-[auto_1fr] rounded-lg border">
          <div className="border-border flex items-center justify-between border-b px-3 py-2">
            <span className="border-border rounded-md border px-2 py-0.5 text-xs font-medium">
              {language || "text"}
            </span>
            <Button
              onClick={handleCopy}
              variant="ghost"
              size="sm"
              className="bg-primary/5 h-8 w-8 p-0"
              aria-label={isCopied ? "Copied!" : "Copy code"}
            >
              {isCopied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-track]:bg-muted overflow-auto [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-sm">
            {children}
          </div>
        </div>
      </div>
    );
  };

  // Helper function to safely render children
  const safeRenderChildren = (children) => {
    if (Array.isArray(children)) {
      return children.map((child, index) => {
        if (typeof child === "object" && child !== null) {
          // If it's an object, try to extract text or convert to string
          return (
            child.text ||
            child.content ||
            child.result ||
            child.answer ||
            String(child)
          );
        }
        return child;
      });
    }
    if (typeof children === "object" && children !== null) {
      return (
        children.text ||
        children.content ||
        children.result ||
        children.answer ||
        String(children)
      );
    }
    return children;
  };

  const renderer = {
    text(text) {
      return text;
    },
    paragraph(children) {
      return (
        <p key={this.elementId} className="text-foreground">
          {safeRenderChildren(children)}
        </p>
      );
    },
    code(children, language) {
      return (
        <CodeBlock key={this.elementId} language={language}>
          {String(children)}
        </CodeBlock>
      );
    },
    link(href) {
      if (!isValidUrl(href)) return null;
      linkItem += 1;
      // 
      return (
        <sup key={this.elementId}>
          <RenderHoverCard href={href} text={linkItem} isCitation={true} />
        </sup>
      );
    },
    heading(children) {
      return (
        <h4 key={this.elementId} className="text-foreground my-2">
          {safeRenderChildren(children)}
        </h4>
      );
    },
    list(children, ordered) {
      const ListTag = ordered ? "ol" : "ul";
      return (
        <ListTag
          key={this.elementId}
          className={cn(
            "text-foreground list-inside pl-4",
            ordered ? "list-decimal" : "list-disc",
          )}
        >
          {safeRenderChildren(children)}
        </ListTag>
      );
    },
    listItem(children) {
      return (
        <li key={this.elementId} className="text-foreground list-item p-0">
          {safeRenderChildren(children)}
        </li>
      );
    },
    blockquote(children) {
      return (
        <blockquote
          key={this.elementId}
          className="border-border text-muted-foreground my-4 border-l-4 pl-4 italic"
        >
          {safeRenderChildren(children)}
        </blockquote>
      );
    },
  };

  return <Marked renderer={renderer}>{contentStr}</Marked>;
};
export default MarkdownRenderer;
