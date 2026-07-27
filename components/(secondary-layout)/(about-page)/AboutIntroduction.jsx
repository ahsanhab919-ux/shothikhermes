"use client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Lightbulb, Target, Users } from "lucide-react";
import * as motion from "motion/react-client";

const milestones = [
  {
    year: "Founded",
    title: "AI Content Professionals & Researchers",
    description:
      "Launched by AI content professionals and researchers with the belief that advanced AI writing should be available to all writers.",
    icon: Lightbulb,
  },
  {
    year: "Mission",
    title: "Democratizing AI Writing",
    description:
      "Founded on the principle that from solo entrepreneurs to enterprise teams, everyone deserves access to premium AI writing tools.",
    icon: Target,
  },
  {
    year: "Growth",
    title: "Trusted by Thousands",
    description:
      "Now used by tens of thousands of users worldwide who trust our paraphrasing tool, plagiarism checker, and Meta marketing automation.",
    icon: Users,
  },
  {
    year: "Excellence",
    title: "Industry Leading",
    description:
      "Recognized as one of the best AI writing software in Bangladesh and globally, with cutting-edge technology and user-centric design.",
    icon: Award,
  },
];

export default function AboutIntroduction() {
  return (
    <div className="px-4 py-20 sm:px-6 md:px-10">
      <div className="container mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <Badge className="mb-4 px-4 py-2 text-sm font-medium">
            The Shothik AI Journey
          </Badge>
          <h2 className="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl">
            Who We Are
          </h2>
          <p className="text-muted-foreground mx-auto max-w-3xl text-xl leading-relaxed">
            Shothik AI is an AI writing tool platform powered by cutting-edge
            machine learning, natural language generation, and marketing
            automation technology. We offer premium AI writing software to
            content creators, marketers, students, and businesses worldwide.
          </p>
        </motion.div>

        {/* Main Description */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-4xl"
        >
          <Card className="bg-card border-0 shadow-lg">
            <CardContent className="p-8 lg:p-12">
              <div className="prose prose-lg max-w-none">
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  As one of the best AI writing software in Bangladesh and
                  globally, Shothik.ai is used by tens of thousands of users who
                  trust our paraphrasing tool, plagiarism checker, and Meta
                  marketing automation they can't live without.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Launched by AI content professionals & researchers, Shothik.ai
                  was founded on the belief that advanced AI writing assistants
                  should be available for all types of writers—from solo
                  entrepreneurs to business owners and employees of different
                  teams. All of our AI tools are on display at our Shothik AI
                  homepage with the suite for professional content creation.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Milestones Grid */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {milestones.map((milestone, index) => (
            <motion.div
              key={index}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 * (index + 1) }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-0 shadow-md transition-shadow duration-300 hover:shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="bg-primary/10 rounded-full p-3">
                      <milestone.icon className="text-primary h-6 w-6" />
                    </div>
                  </div>
                  <Badge variant="secondary" className="mb-3">
                    {milestone.year}
                  </Badge>
                  <h3 className="mb-3 text-lg font-semibold">
                    {milestone.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {milestone.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
