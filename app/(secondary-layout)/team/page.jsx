import TeamCTA from "@/components/(secondary-layout)/(team-page)/TeamCTA";
import TeamCulture from "@/components/(secondary-layout)/(team-page)/TeamCulture";
import TeamDepartments from "@/components/(secondary-layout)/(team-page)/TeamDepartments";
import TeamHero from "@/components/(secondary-layout)/(team-page)/TeamHero";
import TeamLeadership from "@/components/(secondary-layout)/(team-page)/TeamLeadership";
import TeamMembers from "@/components/(secondary-layout)/(team-page)/TeamMembers";

export async function generateMetadata() {
  return {
    title: "Our Team - Meet the Minds Behind Shothik AI",
    description:
      "Meet the talented team behind Shothik AI. From engineers and designers to legal advisors, discover the people building the future of AI writing and marketing automation.",
  };
}

export default function TeamPage() {
  return (
    <>
      <TeamHero />
      <div className="container mx-auto px-4">
        <TeamLeadership />
        <TeamDepartments />
        <TeamMembers />
        <TeamCulture />
        <TeamCTA />
      </div>
    </>
  );
}
