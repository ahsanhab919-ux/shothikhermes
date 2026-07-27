"use client";
import { faqData } from "@/_mock/fag";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export default function FaqFAG() {
  const [activeTab, setActiveTab] = useState("general");
  const [expanded, setExpanded] = useState("");

  const handleTabChange = (newValue) => {
    setActiveTab(newValue);
    setExpanded("");
  };

  const handleAccordionChange = (value) => {
    setExpanded(value);
  };

  return (
    <div className="my-12">
      {/* Title */}
      <h2 className="from-primary to-primary/70 mb-8 bg-gradient-to-br bg-clip-text text-center text-2xl font-bold break-words text-transparent sm:text-3xl md:text-4xl lg:text-4xl">
        Frequently Asked Questions
      </h2>

      {/* Tabs */}
      <div className="mb-6 flex w-full justify-center overflow-x-auto">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full max-w-4xl"
        >
          <TabsList className="flex w-full justify-start overflow-x-auto">
            {Object.keys(faqData).map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="data-[state=active]:text-primary hover:text-primary min-w-0 flex-1 font-medium capitalize transition-colors data-[state=active]:font-bold data-[state=active]:shadow-none"
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* FAQ Grid */}
      <div className="flex w-full justify-center">
        <div className="w-full max-w-4xl space-y-4">
          <Accordion
            type="single"
            collapsible
            value={expanded}
            onValueChange={handleAccordionChange}
            className="space-y-4"
          >
            {faqData[activeTab].map((faq, index) => (
              <AccordionItem
                key={index}
                value={`panel${index}`}
                className={cn(
                  "border-border overflow-hidden rounded-lg transition-all duration-300",
                  "hover:scale-[1.02] hover:shadow-lg",
                  expanded === `panel${index}`
                    ? "border-primary/20 shadow-lg"
                    : "shadow-md",
                )}
              >
                <AccordionTrigger
                  className={cn(
                    "hover:bg-accent/50 px-6 py-4 hover:no-underline",
                    "text-left font-medium",
                    "text-base sm:text-lg md:text-xl lg:text-xl",
                    expanded === `panel${index}` && "text-primary",
                  )}
                >
                  <span className="text-left">{faq.question}</span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 transition-transform duration-300",
                      expanded === `panel${index}`
                        ? "text-primary rotate-180"
                        : "text-muted-foreground",
                    )}
                  />
                </AccordionTrigger>
                <AccordionContent className="px-6 pt-2 pb-4">
                  <div className="text-muted-foreground text-base sm:text-lg">
                    {faq.answer}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
