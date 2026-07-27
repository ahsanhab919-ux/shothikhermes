import * as motion from "motion/react-client";
import Link from "next/link";

export const ClientsSection = ({ title, images, subtitle }) => {
  return (
    <div>
      <motion.p
        initial={{ x: -20, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className="text-center text-3xl md:text-5xl font-semibold leading-10 md:leading-[3.9rem] w-full md:w-[60.625rem] mx-auto mb-8 md:mb-12"
      >
        {subtitle}
        <span className="font-semibold text-primary">
          {title}
        </span>
      </motion.p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-2 justify-center items-center mx-auto">
        {images.map((item, index) => (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 * (index + 1) }}
            viewport={{ once: true }}
            key={index}
          >
            <Link href={item.href ?? "/"}>
              <div
                className="bg-card rounded bg-cover bg-center w-full h-[400px] "
                style={{
                  backgroundImage: item.img,
                }}
              />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
