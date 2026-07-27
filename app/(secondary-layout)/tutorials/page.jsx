"use client";

// TODO: Replace mock tutorial data with a real API call when a tutorials endpoint is available.
// Mock data lives in @/_mock/tutorials — remove that file once the backend is ready.
import { agenticToolsData, marketingToolsData, writingToolsData } from "@/_mock/tutorials";
import ToolCategorySection from "@/components/tutorial/ToolCategorySection";
import { Button } from "@/components/ui/button";
import useYoutubeSubscriber from "@/hooks/useYoutubeSubcriber";
import { ArrowRight } from "lucide-react";

const Tutorials = () => {
  const { subscriberCount, loading, handleSubscribe, formatSubscriberCount } = useYoutubeSubscriber();

  return (
    <div className="min-h-screen bg-background text-foreground">
        
       {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background opacity-40" />
        <div className="mx-auto max-w-[1200px] px-6 text-center">
          <div className="inline-flex items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium">
             🎓 Master Shothik AI
          </div>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight md:text-6xl lg:text-7xl">
            Learn How to Use <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
  Our Powerful Tools
</span>


          </h1>
          <p className="mx-auto mt-6 max-w-[700px] text-lg text-muted-foreground md:text-xl">
            Explore our comprehensive tutorials and guides to unlock the full potential of Shothik AI. From writing to marketing, we've got you covered.
          </p>
          
           <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button size="lg" className="h-12 px-8 text-base">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base">
               View Documentation
            </Button>
           </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] space-y-24 px-6 pb-40">
        <ToolCategorySection 
          title="Writing Tools" 
          toolsData={writingToolsData}
          subscriberCount={subscriberCount}
          loading={loading}
          handleSubscribe={handleSubscribe}
          formatSubscriberCount={formatSubscriberCount}
          defaultTab="paraphrase"
        />

        <ToolCategorySection 
          title="Agentic Tools" 
          toolsData={agenticToolsData}
          subscriberCount={subscriberCount}
          loading={loading}
          handleSubscribe={handleSubscribe}
          formatSubscriberCount={formatSubscriberCount}
          defaultTab="slide"
        />

        <ToolCategorySection 
          title="Marketing Automation" 
          toolsData={marketingToolsData}
          subscriberCount={subscriberCount}
          loading={loading}
          handleSubscribe={handleSubscribe}
          formatSubscriberCount={formatSubscriberCount}
          defaultTab="marketing_automation"
        />
      </div>
    </div>
  );
};

export default Tutorials;