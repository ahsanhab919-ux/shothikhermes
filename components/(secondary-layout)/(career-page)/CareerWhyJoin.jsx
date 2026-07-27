import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Briefcase,
  Code,
  Cpu,
  Globe,
  Handshake,
  Home,
  Lightbulb,
  Megaphone,
  Palette,
  TrendingUp,
} from "lucide-react";
import * as motion from "motion/react-client";

const benefits = [
  {
    title: "Cutting-Edge AI Technology",
    description:
      "Work with the latest in NLP, machine learning, and marketing automation",
    Icon: Cpu,
  },
  {
    title: "Remote-Friendly Culture",
    description: "Flexible work arrangements and work-life balance",
    Icon: Home,
  },
  {
    title: "Growth Opportunities",
    description:
      "Continuous learning, skill development, and career advancement",
    Icon: TrendingUp,
  },
  {
    title: "Global Impact",
    description: "Your work reaches millions of users across 150+ countries",
    Icon: Globe,
  },
  {
    title: "Collaborative Team",
    description: "Work with talented professionals from diverse backgrounds",
    Icon: Handshake,
  },
  {
    title: "Innovation Driven",
    description: "Your ideas matter and can shape product direction",
    Icon: Lightbulb,
  },
];

const departments = [
  {
    title: "Engineering Team",
    description: "Full-stack developers, AI engineers, and system architects",
    Icon: Code,
    color: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    title: "Design Team",
    description: "UI/UX designers creating beautiful user experiences",
    Icon: Palette,
    color: "bg-purple-50 dark:bg-purple-950/30",
  },
  {
    title: "Product & Strategy",
    description: "Visionary leaders guiding our strategic direction",
    Icon: Briefcase,
    color: "bg-green-50 dark:bg-green-950/30",
  },
  {
    title: "Marketing Team",
    description: "Growth hackers and content strategists",
    Icon: Megaphone,
    color: "bg-orange-50 dark:bg-orange-950/30",
  },
];

export default function CareerWhyJoin() {
  return (
    <div className="py-16">
      {/* Why Join Section */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className="mb-12 text-center"
      >
        <Badge className="mb-4 px-4 py-2 text-sm font-medium">
          Why Shothik AI?
        </Badge>
        <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
          Why Join Our Team?
        </h2>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          Be part of a mission-driven team building tools that empower millions
        </p>
      </motion.div>

      <div className="mb-20 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {benefits.map((benefit, index) => (
          <motion.div
            key={index}
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 * (index + 1) }}
            viewport={{ once: true }}
          >
            <Card className="h-full border-0 shadow-md transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="bg-primary/10 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg">
                  <benefit.Icon className="text-primary h-6 w-6" />
                </div>
                <h4 className="mb-2 text-lg font-semibold">{benefit.title}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Departments Section */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        viewport={{ once: true }}
        className="mb-12 text-center"
      >
        <h3 className="mb-4 text-2xl font-bold sm:text-3xl">
          Teams You Could Join
        </h3>
        <p className="text-muted-foreground mx-auto max-w-2xl">
          Discover the different teams building Shothik AI's ecosystem
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {departments.map((dept, index) => (
          <motion.div
            key={index}
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 * (index + 1) }}
            viewport={{ once: true }}
          >
            <Card
              className={`h-full border-0 shadow-md transition-all duration-300 hover:shadow-lg ${dept.color}`}
            >
              <CardContent className="p-6 text-center">
                <div className="bg-primary/10 mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg">
                  <dept.Icon className="text-primary h-7 w-7" />
                </div>
                <h4 className="mb-2 text-lg font-semibold">{dept.title}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {dept.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
