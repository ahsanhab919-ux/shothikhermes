import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as motion from "motion/react-client";
import Link from "next/link";

export const FeaturesSection = ({ features, title, subtitle }) => {
  return (
    <div id="services">
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className="text-center text-3xl md:text-5xl font-semibold leading-10 md:leading-[3.9rem] w-full md:w-[60.625rem] mx-auto mb-8 md:mb-12"
      >
        <span className="font-semibold text-primary">
          {title}
        </span>
        {subtitle}
      </motion.div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {features?.map((feature, index) => {
          if (feature.image) {
            return (
              <div key={index}>
                <Link href="/b2b">
                  <div
                    className="cursor-pointer p-3 h-full min-h-[200px] mx-auto max-w-full md:max-w-[25.98031rem] w-full bg-card bg-cover bg-center transition-transform duration-300 ease-in-out rounded-lg overflow-hidden"
                    style={{
                      backgroundImage: feature?.image,
                    }}
                  />
                </Link>
              </div>
            );
          }
          return (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 * (index + 1) }}
              viewport={{ once: true }}
              key={index}
              className="bg-primary/90 text-primary-foreground rounded flex p-4 flex-col items-start justify-between gap-6 transition-all duration-300 ease-in-out hover:shadow-md hover:bg-primary group"
            >
              <h3 className="text-4xl font-bold text-primary-foreground/60 group-hover:text-primary-foreground">
                {index < 9 ? `0${index + 1}` : index + 1}
              </h3>
              <div className="mt-1 relative after:content-[''] after:absolute after:w-[10%] after:left-[0.0631rem] after:border-t-[0.0625rem] after:border-primary-foreground/60 group-hover:after:w-1/2 group-hover:after:border-primary-foreground/80 after:transition-all after:duration-300">
                <h4 className="text-2xl font-semibold">{feature.title}</h4>
              </div>
              <p className="text-sm">{feature.content}</p>
              <div className="flex w-full justify-end">
                <Link href={`/b2b/services?slug=${feature.slug}`}>
                  <Button
                    variant="outline"
                    className="bg-primary/90 border-primary-foreground/60 h-10 px-2 hover:bg-primary hover:border-primary-foreground"
                    size="lg"
                  >
                    Read more
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
