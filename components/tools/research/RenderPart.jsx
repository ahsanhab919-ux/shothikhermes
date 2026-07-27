import CopyButton from "@/components/(secondary-layout)/(blogs-page)/details/CopyButton";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { AcademicLoadingState } from "./AcademicLoadingState";
import AcademicSearch from "./AcademicSearch";
import MarkdownRenderer from "./MarkdownRenderer";
import ResearchContentWithReferences from "./ResearchContentWithReferences";
import WebLoadingState from "./WebLoading";
import WebSearch from "./WebSearch";

const RenderPart = ({ data, group, isLoading, userQuestion }) => {
  switch (data.type) {
    case "text":
      return (
        <div>
          <div
            className={cn(
              "mt-2 mb-1 flex flex-row items-center justify-between",
            )}
          >
            <div className={cn("flex flex-row items-center gap-1")}>
              <Sparkles className={cn("text-primary h-7 w-7")} />
              <p className={cn("text-foreground font-semibold")}>Answer</p>
            </div>
            <div>
              <CopyButton
                text={
                  typeof data.content === "string"
                    ? data.content
                    : JSON.stringify(data.content)
                }
              />
            </div>
          </div>
          {data.sources && data.sources.length > 0 ? (
            <ResearchContentWithReferences
              content={data.content}
              sources={data.sources}
              isLastData={true}
              isDataGenerating={isLoading}
              title={userQuestion || "Research Results"}
            />
          ) : (
            <MarkdownRenderer content={data.content} />
          )}
        </div>
      );
    case "tool-invocation": {
      if (group === "web") {
        return data.content && typeof data.content !== "string" ? (
          <WebSearch data={data.content} />
        ) : (
          <WebLoadingState />
        );
      } else if (group === "academic") {
        return data.content && typeof data.content !== "string" ? (
          <AcademicSearch data={data.content} />
        ) : (
          <AcademicLoadingState />
        );
      }
    }
    case "reasoning": {
      return null;
    }
    default:
      return null;
  }
};

export default RenderPart;
