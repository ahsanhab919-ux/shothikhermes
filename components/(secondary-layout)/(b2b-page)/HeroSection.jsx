"use client";
import { carousels } from "@/_mock/b2b/carousels";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import * as motion from "motion/react-client";
import Link from "next/link";
import { useEffect, useState } from "react";

export const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  const [api, setApi] = useState(null);

  useEffect(() => {
    if (!api) return;
    setSnapCount(api.scrollSnapList().length);
    const onSelect = () => setCurrentSlide(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  return (
    <div className="relative">
      <Carousel setApi={setApi} opts={{ align: "start", loop: true }}>
        <CarouselContent>
          {carousels.map((item, index) => (
            <CarouselItem key={index} className="basis-full">
              <div className="relative flex h-[500px] shrink-0 items-center py-2 sm:py-3 md:py-0">
                {/* Background image */}
                <img
                  src={item?.image}
                  alt="slide"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {/* Overlay to improve text contrast */}
                <div className="bg-foreground/10 absolute inset-0 z-10" />

                <div className="relative z-20 flex h-full w-full flex-col justify-center gap-4 px-6 py-6 sm:px-10 sm:py-10">
                  <motion.p
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-primary-foreground font-sans text-3xl leading-snug font-bold sm:text-5xl md:text-6xl"
                  >
                    {item?.title}
                  </motion.p>

                  <motion.p
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-primary-foreground/90 pr-0 font-sans text-sm leading-relaxed font-normal sm:pr-32 sm:text-base md:pr-64 md:text-base"
                  >
                    {item.description}
                  </motion.p>

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {item.buttons.map((button, buttonIndex) => (
                      <Link
                        key={buttonIndex}
                        href={button.href}
                        className="no-underline"
                      >
                        <Button
                          variant={button.primary ? "default" : "ghost"}
                          className={cn(
                            "h-10 px-4 sm:px-6",
                            button.primary
                              ? "bg-primary text-primary-foreground"
                              : "border-primary-foreground text-primary-foreground hover:bg-primary hover:text-primary-foreground border bg-transparent",
                          )}
                        >
                          {button.label}
                          {button.primary ? (
                            <ArrowRight className="ml-2 h-4 w-4" />
                          ) : null}
                        </Button>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Arrows (hidden by default per design; can be enabled if desired) */}
        <CarouselPrevious className="hidden sm:flex" />
        <CarouselNext className="hidden sm:flex" />

        {/* Dots */}
        <div className="absolute inset-x-0 bottom-10 z-30 flex justify-center">
          <ul className="m-0 flex list-none items-center justify-center gap-2 p-0 drop-shadow">
            {Array.from({ length: snapCount }).map((_, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => api?.scrollTo(i)}
                  className={cn(
                    "block h-2.5 w-2.5 rounded-full transition-colors duration-300 sm:h-3 sm:w-3",
                    i === currentSlide ? "bg-foreground" : "bg-foreground/30",
                  )}
                  aria-label={`Go to slide ${i + 1}`}
                />
              </li>
            ))}
          </ul>
        </div>
      </Carousel>
    </div>
  );
};
