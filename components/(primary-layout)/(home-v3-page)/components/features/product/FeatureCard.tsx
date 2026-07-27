"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FeatureCardProps {
  icon: ReactNode;
  tag: string;
  title: string;
  description: string;
  accentColor: string;
  mockup: ReactNode;
  reverse?: boolean;
  index: number;
  mockupType: string;
}

export default function FeatureCard({
  icon,
  tag,
  title,
  description,
  accentColor,
  mockup,
  reverse = false,
  index,
  mockupType,
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      data-testid={`feature-${mockupType}`}
      className="mb-32 md:mb-48"
    >
      <div
        className={`grid grid-cols-1 items-center gap-16 md:grid-cols-2 md:gap-24`}
      >
        <div className={reverse ? "md:order-2" : "md:order-1"}>
          <div
            className="mb-8 inline-flex items-center gap-3 rounded-lg border px-5 py-2 transition-all duration-200 hover:translate-x-1"
            style={{
              backgroundColor: `${accentColor}10`,
              borderColor: `${accentColor}30`,
            }}
          >
            <div className="flex items-center" style={{ color: accentColor }}>
              {icon}
            </div>
            <span
              className="text-caption text-xs font-bold tracking-wider uppercase"
              style={{ color: accentColor }}
            >
              {tag}
            </span>
          </div>

          <h3 className="text-h3 text-foreground mb-6 text-4xl leading-tight font-bold tracking-tight md:text-5xl">
            {title}
          </h3>

          <p className="text-body1 text-muted-foreground mb-10 text-base leading-relaxed tracking-wide md:text-lg">
            {description}
          </p>

          <Button
            size="lg"
            data-testid={`button-try-${mockupType}`}
            className="rounded-lg px-10 py-7 text-base font-semibold tracking-wide shadow-[0_4px_14px_rgba(24,119,242,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(24,119,242,0.4)]"
            style={{ backgroundColor: "#1877F2" }}
          >
            Try It Now
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.5,
            delay: index * 0.1 + 0.2,
            ease: "easeOut",
          }}
          className={`${reverse ? "md:order-1" : "md:order-2"} hover-card-mockup`}
        >
          {mockup}
        </motion.div>
      </div>

      <style jsx>{`
        .hover-card-mockup:hover :global(.mockup-container) {
          transform: translateY(-4px);
          box-shadow: 0 24px 64px rgba(24, 119, 242, 0.2);
        }
        :global(.dark) .hover-card-mockup:hover :global(.mockup-container) {
          box-shadow: 0 24px 64px rgba(24, 119, 242, 0.35);
        }
      `}</style>
    </motion.div>
  );
}
