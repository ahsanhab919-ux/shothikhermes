import { Badge } from "@/components/ui/badge";
import * as motion from "motion/react-client";

export default function TeamHero() {
  return (
    <div
      className="relative flex min-h-[500px] items-center bg-cover bg-center px-4 py-24 sm:px-6 md:px-10"
      style={{
        backgroundImage: "url(/overlay_1.svg), url(/secondary/who.jpg)",
      }}
    >
      <div className="container mx-auto text-center">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Badge className="bg-primary/90 mb-6 px-4 py-2 text-sm font-medium">
            Our Team
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-primary-foreground mb-6 text-4xl font-bold sm:text-5xl lg:text-6xl"
        >
          Meet the Team Behind Shothik AI
        </motion.h1>

        <motion.p
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-primary-foreground/90 mx-auto max-w-3xl text-xl leading-relaxed sm:text-2xl"
        >
          Talented professionals from Bangladesh and beyond, united in our
          mission to democratize AI writing and marketing automation for
          everyone.
        </motion.p>
      </div>
    </div>
  );
}
