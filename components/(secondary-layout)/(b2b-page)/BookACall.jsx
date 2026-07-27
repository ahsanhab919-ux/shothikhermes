import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import * as motion from "motion/react-client";
import Link from "next/link";

export const BookACall = () => {
  return (
    <div className="bg-primary/90 text-primary-foreground p-4 md:p-16">
      <div className="grid grid-cols-1 items-start justify-between gap-4 md:grid-cols-2">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="mb-2 flex flex-col items-start md:mb-0"
        >
          <h2 className="w-full text-2xl leading-8 font-semibold md:w-3/5 md:text-3xl md:leading-[2.9375rem]">
            Book a call with our Excellent Team
          </h2>
          <div className="bg-primary-foreground h-0.5 w-full md:w-1/2" />
        </motion.div>
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex h-full flex-col content-center items-start gap-6"
        >
          <p className="text-base">
            Book a 15-minute call with our team to discuss your business goals
          </p>
          <Link href="/contact-us" className="no-underline">
            <Button variant="secondary" className="h-10">
              Book a Discovery Call
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};
