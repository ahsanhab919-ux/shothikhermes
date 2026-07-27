import { ArrowRight } from "lucide-react";
import * as motion from "motion/react-client";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const stats = [
  { value: "10+", label: "Years of Experience" },
  { value: "157", label: "Satisfied Clients" },
  { value: "54", label: "Countries" },
];

export const StatsSection = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2">
      <div className="flex flex-col items-start justify-center gap-8 border-b md:border-b-0 md:border-r border-border pr-0 md:pr-2">
        <div className="flex flex-col gap-2">
          <motion.p
            initial={{ x: -20, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-2xl font-semibold text-foreground md:text-3xl"
          >
            Powering Smarter, Safer & More Efficient Business Operations
          </motion.p>
          <motion.p
            initial={{ x: -20, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-base text-muted-foreground"
          >
            At Shothik.ai, we don&apos;t just offer solutions—we transform
            businesses with AI-driven efficiency, security, and innovation.
            Whether it&apos;s travel, fashion, trade, or healthcare, we ensure
            seamless automation, data-driven decision-making, and operational
            excellence.
          </motion.p>
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <Link href="#services" className="no-underline">
              <Button className="bg-primary text-primary-foreground" size="lg">
                Services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
        <div className="grid w-full grid-cols-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.value}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 * (index + 1) }}
              viewport={{ once: true }}
              className={
                index !== stats.length - 1
                  ? "flex flex-col items-center justify-center border-r border-border py-2 md:py-0"
                  : "flex flex-col items-center justify-center py-2 md:py-0"
              }
            >
              <p className="text-2xl font-semibold text-foreground md:text-3xl">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center">
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-2 h-full w-full overflow-hidden rounded-md sm:mt-0 sm:h-4/5 sm:w-4/5"
        >
          <Image
            src="/b2b/image1.png"
            alt="Business solutions"
            width={1200}
            height={1200}
            className="h-full w-full object-cover"
          />
        </motion.div>
      </div>
    </div>
  );
};
