import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Info, Lightbulb } from "lucide-react";

const MetadataDisplay = ({ metadata }) => {
  if (!metadata) return null;

  return (
    <div className="mt-2">
      <Accordion type="multiple" defaultValue={["summary"]} className="w-full">
        {metadata.summary && (
          <AccordionItem value="summary">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Info className="text-primary h-4 w-4" />
                <span className="text-sm font-semibold">Summary</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {metadata.summary}
              </p>
            </AccordionContent>
          </AccordionItem>
        )}

        {metadata.keyPoints && metadata.keyPoints.length > 0 && (
          <AccordionItem value="keyPoints">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Lightbulb className="text-primary h-4 w-4" />
                <span className="text-sm font-semibold">
                  Key Points ({metadata.keyPoints.length})
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-1">
                {metadata.keyPoints.map((point, index) => (
                  <li
                    key={index}
                    className="text-muted-foreground text-sm leading-normal"
                  >
                    • {point}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
};

export default MetadataDisplay;
