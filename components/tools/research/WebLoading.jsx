import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Globe } from "lucide-react";

export default function WebLoadingState() {
  return (
    <div className="w-full">
      <Accordion
        type="single"
        defaultValue="web-search"
        collapsible
        className="w-full"
      >
        <AccordionItem
          value="web-search"
          className="overflow-hidden rounded-[10px] border"
        >
          <AccordionTrigger className="px-2 py-2 hover:no-underline">
            <div className="flex w-full items-center">
              <div className="rounded-lg p-1">
                <Globe className="text-muted-foreground h-5 w-5" />
              </div>
              <div className="ml-2 flex-1 text-left">
                <p className="text-base font-medium">Running Web Search</p>
                <div className="mt-1 flex gap-1">
                  <div className="border-muted-foreground h-3 w-3 animate-spin rounded-full border-2 border-t-transparent" />
                  <div
                    className="border-muted-foreground h-3 w-3 animate-spin rounded-full border-2 border-t-transparent"
                    style={{ animationDelay: "0.15s" }}
                  />
                  <div
                    className="border-muted-foreground h-3 w-3 animate-spin rounded-full border-2 border-t-transparent"
                    style={{ animationDelay: "0.3s" }}
                  />
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="bg-background rounded-b-[5px] p-2">
            <div className="mt-2 flex flex-row gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[1, 2, 3].map((i) => (
                <Card
                  key={i}
                  className={cn(
                    "bg-card w-[300px] shrink-0 rounded-[10px] border shadow-none transition-all duration-200",
                    "hover:shadow-md",
                  )}
                >
                  <CardContent>
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-row gap-1">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex flex-1 flex-col gap-1">
                          <Skeleton className="h-2.5 w-full" />
                          <Skeleton className="h-2.5 w-full" />
                        </div>
                      </div>
                      <Skeleton className="h-5 w-full rounded-md" />
                      <Skeleton className="h-5 w-full rounded-md" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
