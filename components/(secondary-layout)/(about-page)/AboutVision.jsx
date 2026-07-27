"use client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Eye, Globe, Target } from "lucide-react";
import * as motion from "motion/react-client";

const visionPoints = [
  {
    icon: Eye,
    title: "Most Trusted Platform",
    description:
      "Be the most trusted AI writing tool and Meta marketing automation platform in the world",
  },
  {
    icon: Target,
    title: "Empower Creators",
    description:
      "Empowering creators around the world to communicate with clarity, authenticity, and impact",
  },
  {
    icon: Globe,
    title: "Global Accessibility",
    description:
      "Making cutting-edge AI writing aids available to everybody, everywhere",
  },
  {
    icon: Award,
    title: "Quality & Innovation",
    description:
      "Delivering the best in quality and innovation with every tool we create",
  },
];

export default function AboutVision() {
  return (
    <div className="bg-muted/20 px-4 py-20 sm:px-6 md:px-10">
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
            Our Vision & Mission
          </Badge>
          <h2 className="mb-6 text-3xl font-bold sm:text-4xl lg:text-5xl">
            Shaping the Future of AI Writing
          </h2>
          <p className="text-muted-foreground mx-auto max-w-3xl text-xl leading-relaxed">
            We're on a mission to revolutionize how the world creates content,
            making powerful AI assistance accessible to everyone.
          </p>
        </motion.div>

        {/* Vision Statement */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <Card className="bg-primary/5 border-0 shadow-lg">
            <CardContent className="p-8 text-center lg:p-12">
              <div className="mx-auto max-w-3xl">
                <h3 className="text-primary mb-4 text-2xl font-bold lg:text-3xl">
                  Vision
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Be the most trusted AI writing tool and Meta marketing
                  automation platform in the world empowering creators around
                  the world to communicate with clarity, authenticity, and
                  impact.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Mission Statement */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <Card className="bg-card border-0 shadow-lg">
            <CardContent className="p-8 text-center lg:p-12">
              <div className="mx-auto max-w-3xl">
                <h3 className="mb-4 text-2xl font-bold lg:text-3xl">Mission</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  To make cutting-edge AI writing aids (including our
                  paraphrasing tool, plagiarism checker, AI humanizer and
                  grammar checker) available to everybody - all while delivering
                  with the best in quality and innovation.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Vision Points Grid */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {visionPoints.map((point, index) => (
            <motion.div
              key={index}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 * (index + 1) }}
              viewport={{ once: true }}
            >
              <Card className="h-full border-0 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="bg-primary/10 rounded-full p-3">
                      <point.icon className="text-primary h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="mb-3 text-lg font-semibold">{point.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {point.description}
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
