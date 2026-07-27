// TODO: Replace mock B2B data (client logos and features list) with a real CMS or API call.
// Mock data lives in @/_mock/b2b/ — remove once backend content management is in place.
import { clientImages } from "@/_mock/b2b/clientImages";
import { features } from "@/_mock/b2b/features";
import { BookACall } from "@/components/(secondary-layout)/(b2b-page)/BookACall";
import { ClientsSection } from "@/components/(secondary-layout)/(b2b-page)/ClientsSection";
import { FeaturesSection } from "@/components/(secondary-layout)/(b2b-page)/FeaturesSection";
import { HeroSection } from "@/components/(secondary-layout)/(b2b-page)/HeroSection";
import { StatsSection } from "@/components/(secondary-layout)/(b2b-page)/StatsSection";
import { TestimonialsSection } from "@/components/(secondary-layout)/(b2b-page)/TestimonialsSection";
import { WhyChooseUsSection } from "@/components/(secondary-layout)/(b2b-page)/WhyChooseUsSection";

export async function generateMetadata() {
  return {
    title: "B2B | Shothik AI",
    description: "This is B2B page",
  };
}

const B2B = () => {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex flex-col gap-28">
        <HeroSection />
        <StatsSection />
        <WhyChooseUsSection />
        <FeaturesSection
          features={features}
          title="The Features "
          subtitle="of Our Exceptional Service Offerings in Shothik AI"
        />

        <ClientsSection
          images={clientImages}
          subtitle="Fostering Trust, Strengthening Partnerships: "
          title="Our Valuable Clients"
        />
        <TestimonialsSection />
        <BookACall />
      </div>
    </div>
  );
};

export default B2B;
