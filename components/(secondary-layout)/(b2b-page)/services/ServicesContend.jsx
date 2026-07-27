"use client";
import { features } from "@/_mock/b2b/features";
import { useSearchParams } from "next/navigation";
import { FeaturesSection } from "../FeaturesSection";
import { HeroSection } from "./HeroSection";
import { ProjectSection } from "./ProjectSection";

const ServicesContend = () => {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");
  const data = features.filter((item) => item.slug !== slug).slice(0, 2);
  data.push({
    image: "url('/b2b/see-more.png')",
  });

  return (
    <div className="flex flex-col gap-5">
      <HeroSection slug={slug} />
      <ProjectSection slug={slug} />
      <FeaturesSection features={data} title="Other Services" />
    </div>
  );
};

export default ServicesContend;
