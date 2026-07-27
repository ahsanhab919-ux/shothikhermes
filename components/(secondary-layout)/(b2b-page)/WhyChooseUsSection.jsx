import { whyChooseUs } from "@/_mock/b2b/whychooseusdata";
import * as motion from "motion/react-client";
import Image from "next/image";

export const WhyChooseUsSection = () => (
  <div className="bg-primary text-primary-foreground grid grid-cols-1 pt-4 md:h-[40rem] md:grid-cols-12 md:pt-0">
    <div className="border-border col-span-12 flex flex-col items-center justify-center border-b p-4 md:col-span-4 md:border-r md:border-b-0 md:p-10">
      <motion.p
        initial={{ x: -20, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className="text-center text-5xl leading-none font-semibold md:text-[6rem]"
      >
        Why{" "}
        <Image
          src="/b2b/icon-1.svg"
          alt="icon"
          width={56}
          height={56}
          className="inline-block h-14 w-14 shrink-0 object-cover object-center"
        />{" "}
        choose us?
      </motion.p>
    </div>
    <div className="col-span-12 h-full w-full md:col-span-8">
      <div className="grid h-full w-full grid-cols-1 md:grid-cols-2">
        {whyChooseUs.map((item, index) => (
          <motion.div
            key={index}
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 * (index + 1) }}
            viewport={{ once: true }}
            className="border-border flex flex-col items-center justify-center border-r border-b p-4"
          >
            <Image src={item.icon} alt={item.title} width={60} height={45} />
            <p className="text-primary-foreground mt-8 mb-4 text-center text-2xl font-bold">
              {item.title}
            </p>
            <p className="text-primary-foreground/80 mx-auto text-center text-sm font-normal md:w-[22.75rem] md:text-base">
              {item.content}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);
