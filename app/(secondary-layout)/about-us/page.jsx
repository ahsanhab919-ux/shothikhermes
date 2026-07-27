import AboutHero from "@/components/(secondary-layout)/(about-page)/AboutHero";
import AboutIntroduction from "@/components/(secondary-layout)/(about-page)/AboutIntroduction";
import AboutVision from "@/components/(secondary-layout)/(about-page)/AboutVision";
import AboutTools from "@/components/(secondary-layout)/(about-page)/AboutTools";
import AboutWhyChoose from "@/components/(secondary-layout)/(about-page)/AboutWhyChoose";
import AboutUsers from "@/components/(secondary-layout)/(about-page)/AboutUsers";
import AboutTeam from "@/components/(secondary-layout)/(about-page)/AboutTeam";
import AboutTechnology from "@/components/(secondary-layout)/(about-page)/AboutTechnology";
import AboutFAQ from "@/components/(secondary-layout)/(about-page)/AboutFAQ";
import AboutCTA from "@/components/(secondary-layout)/(about-page)/AboutCTA";

export async function generateMetadata() {
  return {
    title:
      "About Us | Shothik AI - Best AI Writing Tool & Meta Marketing Automation",
    description:
      "Learn about Shothik AI - the leading AI writing tool and Meta marketing automation platform. Discover our comprehensive suite of AI tools for content creation, marketing, and more.",
  };
}

export default function AboutPage() {
  return (
    <>
      <AboutHero />
        <AboutIntroduction />
        <AboutVision />
        <AboutUsers />
      <div className="container mx-auto p-5 py-20">
        <AboutTeam />
      </div>
        <AboutFAQ />
        <AboutCTA />
    </>
  );
}
