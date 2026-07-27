"use client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Globe, Users, Zap } from "lucide-react";
import * as motion from "motion/react-client";
import Link from "next/link";

const stats = [
  { icon: Globe, label: "Countries Served", value: "150+" },
  { icon: Users, label: "Active Users", value: "Thousands" },
  { icon: Zap, label: "Words Processed", value: "Millions" },
];

export default function AboutHero() {
  return (
    <div className="relative overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted via-background to-muted/50">
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5" />
      </div>
      
      {/* Hero content */}
      <div className="relative px-4 sm:px-6 md:px-10 py-20 lg:py-32">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main heading */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-6"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
                <span className="text-primary">
                  Making AI Writing
                </span>
                <br />
                <span className="text-foreground">Simple & Accessible</span>
              </h1>
            </motion.div>

            {/* Subheading */}
            <motion.p
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              Spice up your content and marketing with smart automation. 
              Where ideas become well-defined content ready for use.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <Link href="/tools" className="no-underline">
                <Button size="lg" className="px-8 py-3 text-base">
                  Start Writing Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#tools" className="no-underline">
                <Button variant="outline" size="lg" className="px-8 py-3 text-base">
                  Explore Tools
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto"
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-2">
                    <stat.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
