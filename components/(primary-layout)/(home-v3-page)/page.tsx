import FinalCTA from "./components/common/FinalCTA";
import OneMoreThing from "./components/common/OneMoreThing";
import { InspirationGallery } from "./components/features/agents";
import {
  ComparisonSection,
  FeaturesSection,
} from "./components/features/comparison";
import { ShothikHero } from "./components/features/hero";
import { MindmapFeature } from "./components/features/product";
import {
  FounderMessage,
  TrustedBy,
  WhyShothik,
} from "./components/features/social-proof";

export default function Home() {
  return (
    <main>
      <ShothikHero />
      <InspirationGallery />
      <TrustedBy />
      <FeaturesSection />
      <ComparisonSection />
      <MindmapFeature />
      <FounderMessage />
      <OneMoreThing />
      <WhyShothik />
      <FinalCTA />
    </main>
  );
}
