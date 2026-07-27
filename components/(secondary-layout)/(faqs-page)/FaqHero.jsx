import * as motion from "motion/react-client";

export default function FaqsHero() {
  return (
    <div
      className="relative bg-cover bg-center px-4 sm:px-6 md:px-10 py-10 h-[560px] flex items-end"
      style={{
        backgroundImage: "url(/overlay_1.svg), url(/secondary/hero.jpg)",
      }}
    >
      <div className="container mx-auto">
        <div className="flex flex-row items-center gap-1">
          {["H", "o", "w"].map((w, i) => (
            <motion.h1
              key={w}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 * (i + 1) }}
              className="text-6xl font-bold text-primary"
            >
              {w}
            </motion.h1>
          ))}
        </div>
        <div className="inline-flex flex-row gap-2 text-primary-foreground">
          {["can", "we", "help", "you?"].map((w, i) => (
            <motion.h1
              key={w}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 * (i + 1) }}
              className="text-6xl font-bold"
            >
              {w}
            </motion.h1>
          ))}
        </div>
      </div>
    </div>
  );
}
