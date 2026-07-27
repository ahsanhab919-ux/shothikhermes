import CareerCTA from "@/components/(secondary-layout)/(career-page)/CareerCTA";
import CareerCulture from "@/components/(secondary-layout)/(career-page)/CareerCulture";
import CareerHero from "@/components/(secondary-layout)/(career-page)/CareerHero";
import CareerOpenings from "@/components/(secondary-layout)/(career-page)/CareerOpenings";
import CareerWhyJoin from "@/components/(secondary-layout)/(career-page)/CareerWhyJoin";

export async function generateMetadata() {
  return {
    title: "Careers - Join Our AI Innovation Team | Shothik AI",
    description:
      "Explore career opportunities at Shothik AI. Join our team building cutting-edge AI writing tools and Meta marketing automation. Shape the future of content creation.",
  };
}

const Career = () => {
  return (
    <>
      {/* <CareerHero /> */}
      <div className="container mx-auto px-4">
        <CareerOpenings />
        <CareerCulture />
        <CareerWhyJoin />
        <CareerCTA />
      </div>
    </>
  );
};

export default Career;
