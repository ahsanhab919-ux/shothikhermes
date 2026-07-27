import { Button } from "@/components/ui/button";
import { PATH_PAGE, PATH_TOOLS } from "@/config/route";
import { ChevronRight } from "lucide-react";
import * as motion from "motion/react-client";
import Image from "next/image";
import Link from "next/link";

export default function HomeAdvertisement() {
  return (
    <div className="p-6">
      <div className="from-primary to-primary/80 mb-20 flex flex-col items-center justify-between rounded-3xl bg-gradient-to-br px-8 py-16 md:flex-row md:px-16 md:py-24">
        <Content />
        <Description />
      </div>
    </div>
  );
}

function Description() {
  return (
    <div className="w-full px-4 text-center md:w-1/2 md:px-8 md:text-left">
      <motion.h2
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className="text-primary-foreground mb-10 text-3xl leading-tight font-bold md:text-4xl lg:text-5xl"
      >
        Get started with
        <br />
        Shothik.ai today
      </motion.h2>

      <motion.div
        initial={{ x: 30, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        viewport={{ once: true }}
        className="flex flex-col justify-center gap-4 sm:flex-row md:justify-start"
      >
        <Button
          size="lg"
          variant="secondary"
          asChild
          className="min-w-[160px] font-semibold"
        >
          <Link href={PATH_PAGE.pricing} rel="noopener">
            Upgrade To Pro
          </Link>
        </Button>
        <Button
          size="lg"
          variant="outline"
          asChild
          className="border-primary-foreground/60 text-primary-foreground hover:border-primary-foreground hover:text-primary-foreground min-w-[180px] border-2 bg-transparent font-semibold hover:bg-transparent"
        >
          <Link href={PATH_TOOLS.discord} target="_blank" rel="noopener">
            Join Us On Discord
            <ChevronRight className="ml-1 h-5 w-5" />
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}

// ----------------------------------------------------------------------

function Content() {
  return (
    <motion.div
      initial={{ x: -50, opacity: 0 }}
      whileInView={{ x: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="mb-8 flex w-full items-center justify-center md:mb-0 md:w-1/2"
    >
      <motion.div
        animate={{ y: [-20, 0, -20] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="w-full max-w-[320px] md:max-w-[400px]"
      >
        <Image
          height={400}
          width={400}
          className="h-auto w-full"
          alt="Shothik AI Mascot"
          src="/moscot.png"
          priority
        />
      </motion.div>
    </motion.div>
  );
}
