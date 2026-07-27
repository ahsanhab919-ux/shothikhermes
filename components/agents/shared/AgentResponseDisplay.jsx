import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import js from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";
import python from "react-syntax-highlighter/dist/esm/languages/hljs/python";
import { github } from "react-syntax-highlighter/dist/esm/styles/hljs";

SyntaxHighlighter.registerLanguage("javascript", js);
SyntaxHighlighter.registerLanguage("python", python);

const AgentResponseDisplay = ({
  response,
  type = "text",
  language = "javascript",
}) => {
  if (!response) {
    return (
      <Card className={cn("bg-muted min-h-[80px]")}>
        <CardContent className={cn("p-4")}>
          <p className={cn("text-muted-foreground text-sm")}>
            No response yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  let content = null;
  if (type === "code") {
    content = (
      <SyntaxHighlighter
        language={language}
        style={github}
        customStyle={{ borderRadius: 8, fontSize: 14 }}
      >
        {typeof response === "string" ? response : response.code || ""}
      </SyntaxHighlighter>
    );
  } else if (type === "image") {
    content = (
      <div className={cn("flex min-h-[120px] items-center justify-center")}>
        <Image
          src={typeof response === "string" ? response : response.url}
          alt="Agent response"
          className={cn("max-h-[240px] max-w-full rounded-lg")}
          width={800}
          height={600}
        />
      </div>
    );
  } else {
    content = (
      <p className={cn("text-base whitespace-pre-line")}>
        {typeof response === "string" ? response : response.text || ""}
      </p>
    );
  }

  return (
    <Card className={cn("bg-card min-h-[80px] shadow-sm")}>
      <CardContent className={cn("p-4")}>{content}</CardContent>
    </Card>
  );
};

export default AgentResponseDisplay;
