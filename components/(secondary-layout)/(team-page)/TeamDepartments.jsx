"use client";
import { team } from "@/_mock/team";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Code, Palette, Scale } from "lucide-react";
import * as motion from "motion/react-client";

const departments = [
  {
    title: "Engineering Team",
    description:
      "Full-stack developers, AI engineers, and system architects building robust AI solutions",
    Icon: Code,
    teamSize: team.filter(
      (m) =>
        m.designation?.includes("Developer") ||
        m.designation?.includes("Engineer") ||
        m.designation?.includes("Technology"),
    ).length,
    members: team
      .filter(
        (m) =>
          m.designation?.includes("Developer") ||
          m.designation?.includes("Engineer") ||
          m.designation?.includes("Technology"),
      )
      .map((m) => m.name),
  },
  {
    title: "Design Team",
    description:
      "UI/UX designers creating intuitive and beautiful user experiences",
    Icon: Palette,
    teamSize: team.filter((m) => m.designation?.includes("Designer")).length,
    members: team
      .filter((m) => m.designation?.includes("Designer"))
      .map((m) => m.name),
  },
  {
    title: "Leadership & Strategy",
    description:
      "Visionary leaders guiding Shothik AI's strategic direction and growth",
    Icon: Briefcase,
    teamSize: team.filter(
      (m) =>
        m.designation?.includes("CEO") ||
        m.designation?.includes("Founder") ||
        m.designation?.includes("Director") ||
        m.designation?.includes("Advisor"),
    ).length,
    members: team
      .filter(
        (m) =>
          m.designation?.includes("CEO") ||
          m.designation?.includes("Founder") ||
          m.designation?.includes("Director") ||
          m.designation?.includes("Advisor"),
      )
      .map((m) => m.name),
  },
  {
    title: "Legal & Compliance",
    description:
      "Legal advisors ensuring regulatory compliance and corporate governance",
    Icon: Scale,
    teamSize: team.filter(
      (m) =>
        m.designation?.includes("Legal") ||
        m.designation?.includes("Barrister") ||
        m.designation?.includes("Advocate"),
    ).length,
    members: team
      .filter(
        (m) =>
          m.designation?.includes("Legal") ||
          m.designation?.includes("Barrister") ||
          m.designation?.includes("Advocate"),
      )
      .map((m) => m.name),
  },
];

export default function TeamDepartments() {
  return (
    <div className="bg-muted/20 -mx-4 px-4 py-20 sm:-mx-6 sm:px-6 md:-mx-10 md:px-10">
      <div className="container mx-auto">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <Badge className="mb-4 px-4 py-2 text-sm font-medium">
            Departments
          </Badge>
          <h2 className="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl">
            Our Departments
          </h2>
          <p className="text-muted-foreground mx-auto max-w-3xl text-xl leading-relaxed">
            Specialized teams working together to deliver exceptional AI tools
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {departments.map((dept, index) => (
            <motion.div
              key={index}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 * (index + 1) }}
              viewport={{ once: true }}
            >
              <Card className="bg-card h-full border-0 shadow-md transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="bg-primary/10 mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg">
                    <dept.Icon className="text-primary h-7 w-7" />
                  </div>
                  <h4 className="mb-2 text-lg font-semibold">{dept.title}</h4>
                  <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                    {dept.description}
                  </p>
                  <Badge variant="secondary" className="mb-3 text-xs">
                    {dept.teamSize}+ Team Members
                  </Badge>
                  <div className="text-muted-foreground text-xs">
                    {dept.members.slice(0, 2).join(", ")}
                    {dept.members.length > 2 &&
                      ` +${dept.members.length - 2} more`}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
