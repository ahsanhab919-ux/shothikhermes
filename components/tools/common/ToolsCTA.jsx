import { toolsCta } from "@/_mock/toolsCta";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import * as motion from "motion/react-client";
import CTAImages from "./CTAImages";

export default function ToolsCTA({ toolType }) {
  const toolConfig = toolsCta[toolType];

  if (!toolConfig) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="from-primary/5 to-primary/10 w-full rounded-3xl bg-gradient-to-br px-6 py-16 md:px-12 md:py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div className="w-full">
            <Description config={toolConfig} />
          </div>

          <div className="flex w-full justify-center">
            <CTAImages
              title={toolConfig.title}
              lightImage={toolConfig.image.light}
              darkImage={toolConfig.image.dark}
              sx={{
                img: {
                  borderRadius: { xs: "8px", md: "0px" },
                  width: { xs: "100%", md: "auto" },
                  height: { xs: "auto", md: "auto" },
                  aspectRatio: { xs: "1 / 1", md: "unset" },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Description({ config }) {
  return (
    <div className="w-full text-center md:text-left">
      <motion.p
        initial={{ x: -35, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className="text-primary/80 mb-4 text-xs tracking-wider uppercase"
      >
        {config.title}
      </motion.p>

      <motion.h2
        initial={{ x: -40, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        viewport={{ once: true }}
        className="text-foreground mb-6 text-3xl font-bold md:text-4xl"
      >
        {config.heading}
      </motion.h2>

      <motion.div
        initial={{ x: -45, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        viewport={{ once: true }}
        className="text-muted-foreground mb-8 leading-relaxed"
      >
        {config.description}
      </motion.div>

      <motion.div
        initial={{ x: -50, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        viewport={{ once: true }}
      >
        <Button
          size="lg"
          variant="default"
          asChild
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
        >
          {config.buttonLink?.startsWith("/") ? (
            <Link href={config.buttonLink}>
              {config.buttonText}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          ) : (
            <a href={config.buttonLink}>
              {config.buttonText}
              <ChevronRight className="ml-2 h-4 w-4" />
            </a>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
