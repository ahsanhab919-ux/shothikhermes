"use client";
import { headerInformation } from "@/_mock/b2b/headerInformantion";
import { informations } from "@/_mock/b2b/informations";
import * as motion from "motion/react-client";
import Link from "next/link";

export const HeroSection = ({ slug }) => {
  const information = informations[slug];
  const headerInfo = headerInformation[slug];

  return (
    <div>
      <motion.p
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-primary mb-1 text-center text-3xl font-semibold md:text-5xl"
      >
        {headerInfo?.title}
      </motion.p>

      {headerInfo?.img && (
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="block h-48 w-full overflow-hidden sm:h-[25rem] md:h-[35rem]"
        >
          <img
            src={headerInfo?.img}
            alt="Workspace"
            className="block h-full w-full object-cover object-center"
          />
        </motion.div>
      )}

      <div className="px-3 py-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          {information?.map((item, index) => (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 * (index + 1) }}
              viewport={{ once: true }}
              key={index}
              className="border-primary flex flex-col items-center justify-center border-r py-4 last:border-r-0"
            >
              {item.description && (
                <p className="text-primary text-xl font-semibold">
                  {item.description}
                </p>
              )}
              {item.isLink ? (
                <Link href="#" className="text-primary underline">
                  {item.title}
                </Link>
              ) : (
                <p className="text-primary text-xl font-semibold">
                  {item.title}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
