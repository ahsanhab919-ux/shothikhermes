import * as motion from "motion/react-client";

export default function CareerHero() {
  return (
    <div
      className="relative flex h-[560px] items-end bg-cover bg-center px-4 py-10 sm:px-6 md:px-10"
      style={{
        backgroundImage: "url(/overlay_1.svg), url(/secondary/who.jpg)",
      }}
    >
      <div className="container mx-auto">
        <div className="flex flex-row items-center gap-1">
          {["C", "a", "r", "e", "e", "r", "s"].map((w, i) => (
            <motion.h1
              key={`${w}-${i}`}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 * (i + 1) }}
              className="text-primary text-6xl font-bold"
            >
              {w}
            </motion.h1>
          ))}
        </div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-primary-foreground inline-flex flex-col"
        >
          <h2 className="text-4xl font-bold sm:text-5xl">Join Our Mission</h2>
        </motion.div>
        <motion.h4
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="text-primary-foreground mt-4 text-2xl font-semibold"
        >
          Build the future of AI writing tools <br /> and Meta marketing
          automation
        </motion.h4>
      </div>
    </div>
  );
}
