import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function ToolsSepecigFaq({ tag, data }) {
  return (
    <div className="p-6">
      <h2 className="text-center text-3xl font-bold">
        Frequently Asked Questions
      </h2>

      <p className="text-muted-foreground mb-20 text-center text-base">{tag}</p>

      <div className="mx-auto max-w-[800px]">
        <Accordion type="single" collapsible className="space-y-12">
          {data.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border-b"
            >
              <AccordionTrigger className="py-4 text-left hover:no-underline sm:py-6">
                <span className="text-base font-medium">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
