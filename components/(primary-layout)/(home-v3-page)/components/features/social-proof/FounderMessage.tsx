"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import shothikInterface from "@/components/(primary-layout)/(home-v3-page)/attached_assets/image_1760596886557.png";

export default function FounderMessage() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="bg-background py-32 md:py-48">
      <div className="mx-auto max-w-7xl px-8 md:px-16">
        <div
          className="mb-32 grid grid-cols-1 items-center gap-12 transition-all duration-700 ease-out md:mb-40 md:gap-16 lg:grid-cols-[1fr_1.8fr]"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(24px)",
          }}
        >
          <div className="flex flex-col gap-6">
            <h2 className="text-h2 text-foreground leading-tight font-bold">
              Write naturally, <br />
              perfect instantly.
            </h2>
            <p className="text-subtitle1 md:text-body1 text-muted-foreground max-w-lg leading-relaxed">
              Shothik's AI understands context and tone, helping you craft
              professional content that sounds authentically human—from your
              first draft to your final masterpiece.
            </p>
          </div>
          <div className="relative">
            <Image
              src={shothikInterface}
              alt="Shothik AI Writing Interface"
              width={900}
              height={600}
              className="h-auto w-full rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,167,111,0.2)]"
            />
          </div>
        </div>

        <div
          className="grid grid-cols-1 items-center gap-12 transition-all delay-200 duration-700 ease-out md:gap-16 lg:grid-cols-2"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(24px)",
          }}
        >
          <div className="order-1 flex flex-col gap-6 lg:order-2">
            <h2 className="text-h2 text-foreground leading-tight font-bold">
              Your lifelong writing companion.
            </h2>
            <p className="text-subtitle1 md:text-body1 text-muted-foreground max-w-lg leading-relaxed">
              From your first essay as a student to your first business proposal
              as an entrepreneur—Shothik grows with you through every milestone
              of your journey.
            </p>
          </div>
          <div className="relative order-2 lg:order-1">
            <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-8 shadow-[0_20px_60px_rgba(24,119,242,0.2)]">
              <div className="text-center text-white/40">
                <p className="text-body2 text-muted-foreground font-normal">
                  Secondary screenshot will be placed here
                </p>
                <p className="text-caption text-muted-foreground mt-2 block">
                  Add your feature showcase image
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
