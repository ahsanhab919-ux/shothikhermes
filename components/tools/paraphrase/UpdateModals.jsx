import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import useResponsive from "@/hooks/ui/useResponsive";
import { cn } from "@/lib/utils";
import { Gem } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function MessageTemplate({
  title,
  desc,
  chipLabels,
  chipBgColors,
  inputText,
  paraphrasedText,
}) {
  const isXl = useResponsive("up", "xl");
  return (
    <div
      className={cn(
        "absolute top-0 right-0 bottom-0 left-0 h-full w-full px-[10px] pt-[50px] pb-0 lg:p-2",
        "bg-card z-10 flex flex-col items-center justify-center",
      )}
    >
      <div className="relative mb-2 md:mb-4 lg:mb-6">
        {/* element starts */}
        <div
          className={cn(
            "absolute -right-[100px] -bottom-[100px] lg:-right-[120px] xl:-right-[120px]",
            "flex h-[100px] w-[100px] -translate-x-1/2 -translate-y-1/2 items-center justify-center",
          )}
        >
          <div className="xl:scale-[1.2] select-none pointer-events-none">
            <Image src="/fromTo-2.svg" alt="arrow" width={120} height={120} className="select-none pointer-events-none" />
          </div>
        </div>
        {/* element ends */}
        <div className="flex flex-col items-center justify-center gap-0.5">
          <h3
            className={cn(
              "overflow-hidden text-start text-xs font-semibold lg:text-base",
              "text-foreground mb-0",
            )}
          >
            {title}
          </h3>

          <p
            className={cn(
              "overflow-hidden text-center text-xs font-normal xl:text-sm",
              "text-muted-foreground mb-0",
            )}
          >
            {desc}
          </p>
        </div>
      </div>
      <div
        className={cn(
          "flex flex-col items-center p-3 md:p-4 lg:p-6",
          "border-border/50 gap-2 border md:gap-4 lg:gap-5",
          "rounded-lg md:rounded-xl lg:rounded-2xl",
        )}
      >
        <div className="w-full">
          <div className="flex flex-col items-center justify-center gap-1 lg:gap-2">
            <h4
              className={cn(
                "overflow-hidden text-start text-xs font-semibold xl:text-sm",
                "text-foreground mb-0",
              )}
            >
              Uses
            </h4>
            <div
              className={cn(
                "flex flex-wrap items-center justify-center",
                "max-w-[85%] gap-2 md:gap-3 lg:gap-4 xl:max-w-[65%]",
              )}
            >
              {chipLabels.map((label, index) => (
                <Badge
                  key={index}
                  className={cn(
                    "rounded-lg text-xs font-normal xl:text-sm",
                    "text-foreground border-0",
                  )}
                  style={{
                    backgroundColor: chipBgColors[index] || "hsl(var(--muted))",
                  }}
                >
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div
          className={cn(
            "flex flex-col gap-3 sm:flex-row sm:gap-4",
            "relative w-full",
          )}
        >
          <div
            className={cn(
              "flex flex-1 flex-col p-2 xl:p-4 2xl:p-6",
              "gap-1 rounded-md md:rounded-lg lg:gap-2 lg:rounded-xl",
              "shadow-sm",
            )}
          >
            <h4
              className={cn(
                "overflow-hidden text-start text-xs font-semibold xl:text-sm",
                "text-foreground mb-0",
              )}
            >
              Input text
            </h4>
            <p className={cn("text-muted-foreground text-xs xl:text-sm")}>
              {inputText}
            </p>
          </div>

          <div
            className={cn(
              "flex flex-1 flex-col p-2 xl:p-4 2xl:p-6",
              "gap-1 rounded-md md:rounded-lg lg:gap-2 lg:rounded-xl",
              "shadow-sm",
            )}
          >
            <h4
              className={cn(
                "overflow-hidden text-start text-xs font-semibold xl:text-sm",
                "text-foreground mb-0",
              )}
            >
              Paraphrased Text
            </h4>
            <p className={cn("text-muted-foreground text-xs xl:text-sm")}>
              {paraphrasedText}
            </p>
          </div>
        </div>
        {/* upgrade button */}
        <Link href={"/pricing"}>
          <Button
            // data-umami-event="Nav: Upgrade To Premium"
            data-rybbit-event="clicked_upgrade_plan"
            size={isXl ? "default" : "sm"}
            variant="default"
            rel="noopener"
            className="max-w-fit"
          >
            <Gem className="h-5 w-5 md:h-6 md:w-6" />
            Upgrade Plan
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function Humanize() {
  return (
    <MessageTemplate
      title="Humanize"
      desc="Transforming Ai Text into Human Writing"
      inputText="“Hey, just wanted to check if you saw my last email about the proposal.”"
      paraphrasedText="“I wanted to kindly follow up regarding my previous email about the proposal.”"
      chipLabels={[
        "Professional Writing",
        "Email Writing",
        "Corporate Tone",
        "Professional Refinement",
      ]}
      chipBgColors={["#8E33FF14", "#00B8D914", "#22C55E14", "#FFAB0014"]}
    />
  );
}

export function FormalMessage() {
  return (
    <MessageTemplate
      title="Formal"
      desc="Polishing Professional and Business Communication"
      inputText="“Hey, just wanted to check if you saw my last email about the proposal.”"
      paraphrasedText="“I wanted to kindly follow up regarding my previous email about the proposal.”"
      chipLabels={[
        "Professional Writing",
        "Email Writing",
        "Corporate Tone",
        "Professional Refinement",
      ]}
      chipBgColors={["#8E33FF14", "#00B8D914", "#22C55E14", "#FFAB0014"]}
    />
  );
}

export function AcademicMessage() {
  return (
    <MessageTemplate
      title="Academic"
      desc="Refining Research Writing for Academic Standards Goal"
      mode="Academic"
      inputText="“Pollution is a big problem that makes the environment worse and affects people's health.”"
      paraphrasedText="“Environmental pollution poses a significant threat to ecological balance and public health.”"
      chipLabels={[
        "Research Writing",
        "Formal Tone",
        "Thesis Preparation",
        "Technical Accuracy",
      ]}
      chipBgColors={["#8E33FF14", "#00B8D914", "#22C55E14", "#FFAB0014"]}
    />
  );
}

export function NewsMessage() {
  return (
    <MessageTemplate
      title="News"
      desc="Rewriting Articles with a Clear, Neutral, and Journalistic Tone"
      inputText="“The company proudly launched an amazing new phone that’s going to change the market!”"
      paraphrasedText="“The company has launched a new smartphone that it claims could impact the market.”"
      chipLabels={[
        "Journalistic Writing",
        "Media Editing",
        "Fact Based Writing",
        "Objective Writing",
      ]}
      chipBgColors={["#8E33FF14", "#00B8D914", "#22C55E14", "#FFAB0014"]}
    />
  );
}

export function SimpleMessage() {
  return (
    <MessageTemplate
      title="Simple"
      desc="Making Complex Text Easy to Read and Understand"
      inputText="“Photosynthesis is a biochemical process through which green plants synthesize organic compounds using light energy.”"
      paraphrasedText="“Photosynthesis is the process plants use to make food from sunlight.”"
      chipLabels={[
        "Easy Language",
        "Plain Writing",
        "Readable Content",
        "Simplified Text",
      ]}
      chipBgColors={["#8E33FF14", "#00B8D914", "#22C55E14", "#FFAB0014"]}
    />
  );
}

export function CreativeMessage() {
  return (
    <MessageTemplate
      title="Creative"
      desc="Transforming Ordinary Text into Engaging, Original, and Expressive Writing"
      inputText="“This perfume smells nice and lasts a long time.”"
      paraphrasedText="“This perfume wraps you in a lasting aura of elegance, leaving a scent that lingers beautifully throughout the day.”"
      chipLabels={[
        "Content Writing",
        "Copy writing",
        "Storytelling",
        "Expressive Tone",
      ]}
      chipBgColors={["#8E33FF14", "#00B8D914", "#22C55E14", "#FFAB0014"]}
    />
  );
}

export function ShortMessage() {
  return (
    <MessageTemplate
      title="Short"
      desc="Condensing Long Text into Clear, Concise Sentences"
      inputText="“Our company is committed to providing high-quality products that meet customer expectations and ensure satisfaction.”"
      paraphrasedText="“We deliver quality products that satisfy our customers.”"
      chipLabels={[
        "Concise Writing",
        "Content Editing",
        "Summarized Writing",
        "Social Media Copy",
      ]}
      chipBgColors={["#8E33FF14", "#00B8D914", "#22C55E14", "#FFAB0014"]}
    />
  );
}

export function LongMessage() {
  return (
    <MessageTemplate
      title="Long"
      desc="Expanding Short Text into Detailed, Well-Explained Sentences"
      inputText="“Climate change is dangerous.”"
      paraphrasedText="“Climate change poses a serious threat to the environment, affecting weather patterns, ecosystems, and human livelihoods across the globe.”"
      chipLabels={[
        "Expanded Writing",
        "Detailed Content",
        "Content Development",
        "ElaboratedText",
      ]}
      chipBgColors={["#8E33FF14", "#00B8D914", "#22C55E14", "#FFAB0014"]}
    />
  );
}
