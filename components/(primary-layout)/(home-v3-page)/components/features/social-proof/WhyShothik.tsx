"use client";

import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { CreditCard, DollarSign, Globe } from "lucide-react";

export default function WhyShothik() {
  const fadeInUp = {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
  };

  const pillars = [
    {
      icon: <Globe size={32} />,
      title: "Truly Multilingual",
      subtitle: "100+ Languages Supported",
      description:
        "From Bangla to Swahili, Urdu to Vietnamese—your language shouldn't limit your ambitions. We speak the world's languages, not just the privileged few.",
      accentColor: "#00A76F",
    },
    {
      icon: <CreditCard size={32} />,
      title: "Hyperlocal Payments",
      subtitle: "India 🇮🇳 Bangladesh 🇧🇩 + More Coming",
      description:
        "Pay with bKash, Nagad, UPI, or international cards. No credit card? No problem. Local currencies, local payment methods, global access.",
      accentColor: "#1877F2",
    },
    {
      icon: <DollarSign size={32} />,
      title: "Built for Everyone",
      subtitle: "Enterprise Features, Not Enterprise Prices",
      description:
        "From students to SMBs to Fortune 500s—AI tools shouldn't cost a month's salary. Premium capabilities at prices the world can actually afford.",
      accentColor: "#00A76F",
    },
  ];

  return (
    <section
      data-testid="section-why-shothik"
      className="bg-background relative py-24 md:py-40"
    >
      <div className="bg-gradient-radial pointer-events-none absolute top-0 right-0 left-0 h-[400px] from-[rgba(0,167,111,0.04)] to-transparent dark:from-[rgba(0,167,111,0.08)]" />

      <div className="relative z-10 container mx-auto max-w-6xl px-4">
        <motion.div
          {...fadeInUp}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16 text-center md:mb-24"
        >
          <h2
            className="text-h2 text-foreground mb-4 text-4xl leading-tight font-extrabold tracking-tight md:text-6xl"
            data-testid="heading-why-shothik"
          >
            Why Shothik AI?
          </h2>
          <h6 className="text-muted-foreground mx-auto max-w-3xl text-lg leading-relaxed font-normal tracking-wide md:text-xl">
            AI That Speaks Your Language, Accepts Your Currency
          </h6>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {pillars.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="h-full"
              data-testid={`card-pillar-${index}`}
            >
              <Card className="flex h-full flex-col rounded-xl border-white/30 bg-white/25 p-8 shadow-lg backdrop-blur-[8px] backdrop-saturate-[180%] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl md:p-10 dark:border-white/[0.08] dark:bg-white/[0.02] dark:shadow-[0_8px_32px_rgba(0,167,111,0.12)] dark:hover:shadow-[0_12px_48px_rgba(0,167,111,0.2)]">
                <div
                  className="mb-6 inline-flex w-fit rounded-lg p-4"
                  style={{
                    backgroundColor: `rgba(${pillar.accentColor === "#00A76F" ? "0, 167, 111" : "24, 119, 242"}, 0.1)`,
                    color: pillar.accentColor,
                  }}
                >
                  {pillar.icon}
                </div>

                <h5 className="text-h5 text-foreground mb-2 text-xl leading-snug font-bold md:text-2xl">
                  {pillar.title}
                </h5>
                <p
                  className="text-body2 mb-4 text-sm font-semibold tracking-wide"
                  style={{ color: pillar.accentColor }}
                >
                  {pillar.subtitle}
                </p>

                <p className="text-body1 text-muted-foreground leading-relaxed font-normal tracking-wide">
                  {pillar.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 text-center md:mt-24"
        >
          <h6 className="text-muted-foreground/60 mx-auto max-w-4xl text-base leading-relaxed font-normal tracking-wide md:text-lg">
            Most AI tools were built in Silicon Valley for Silicon Valley.
            Shothik AI was built in Bangladesh{" "}
            <span className="text-foreground font-bold">for the world</span>.{" "}
            This is AI built for humanity. All 8 billion of us.
          </h6>
        </motion.div>
      </div>
    </section>
  );
}
