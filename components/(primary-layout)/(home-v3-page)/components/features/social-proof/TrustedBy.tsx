"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import chargebeeLogo from "@/components/(primary-layout)/(home-v3-page)/attached_assets/CB Primary Logo Blue and Orange 1_1759922325254.png";
import microsoftLogo from "@/components/(primary-layout)/(home-v3-page)/attached_assets/Company logo-10_1759922325255.png";
import zapierLogo from "@/components/(primary-layout)/(home-v3-page)/attached_assets/Company logo-7_1759922325255.png";
import stripeLogo from "@/components/(primary-layout)/(home-v3-page)/attached_assets/Company logo_1759922325256.png";
import googleCloudLogo from "@/components/(primary-layout)/(home-v3-page)/attached_assets/google-cloud-platform-gcp-seeklogo 1_1759922325257.png";
import amplitudeLogo from "@/components/(primary-layout)/(home-v3-page)/attached_assets/AMPLITUDE_FULL_BLACK 1_1759922325253.png";

export default function TrustedBy() {
  const prefersReducedMotion = useReducedMotion();

  const companies = [
    {
      name: "Amplitude",
      logo: amplitudeLogo,
    },
    {
      name: "Chargebee",
      logo: chargebeeLogo,
    },
    {
      name: "Zapier",
      logo: zapierLogo,
    },
    {
      name: "Microsoft",
      logo: microsoftLogo,
    },
    {
      name: "Stripe",
      logo: stripeLogo,
    },
    {
      name: "Google Cloud",
      logo: googleCloudLogo,
    },
  ];

  const containerVariants = {
    hidden: { opacity: prefersReducedMotion ? 1 : 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.08,
        delayChildren: prefersReducedMotion ? 0 : 0.3,
      },
    },
  };

  const logoVariants = {
    hidden: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : {
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1] as const,
          },
    },
  };

  return (
    <section className="bg-background relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-8 md:px-16">
        <motion.div
          initial={{
            opacity: prefersReducedMotion ? 1 : 0,
            y: prefersReducedMotion ? 0 : 20,
          }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
          }
        >
          <p
            className="text-overline text-muted-foreground mb-16 block text-center tracking-[0.1em]"
            data-testid="text-trusted-by"
          >
            Trusted by teams at
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <div className="grid grid-cols-2 items-center justify-items-center gap-16 md:grid-cols-3 lg:grid-cols-6">
            {companies.map((company, i) => (
              <motion.div key={i} variants={logoVariants}>
                <div
                  className="flex items-center justify-center"
                  data-testid={`logo-${company.name.toLowerCase().replace(/\s+/g, "-")}`}
                  title={company.name}
                >
                  <Image
                    src={company.logo}
                    alt={company.name}
                    width={160}
                    height={40}
                    className="h-10 w-auto object-contain opacity-50 grayscale transition-all duration-200 hover:opacity-80 hover:grayscale-0 dark:brightness-100 dark:invert"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
