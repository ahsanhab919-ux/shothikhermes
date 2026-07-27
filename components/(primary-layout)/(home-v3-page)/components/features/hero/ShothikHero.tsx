"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import checkmarkLogo from "@/components/(primary-layout)/(home-v3-page)/attached_assets/Checkmark_1759923653930.png";
import HeroVideo from "./HeroVideo";
import NeuralNetworkDots from "./NeuralNetworkDots";
import VideoModal from "./VideoModal";
import { useMouseTracking } from "./hooks/useMouseTracking";
import { useScrollLock } from "./hooks/useScrollLock";
import { useTextRotation } from "./hooks/useTextRotation";
import { useTranslation } from "@/i18n";

export default function ShothikHero() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const checkmarkRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const TYPING_TEXTS = [
    t("hero.writingReports"),
    t("hero.creatingSlides"),
    t("hero.runningAds"),
  ];

  const currentText = useTextRotation(TYPING_TEXTS);
  useScrollLock(isVideoOpen);
  const { mousePos, scrollY } = useMouseTracking(heroRef);

  const getCheckmarkTilt = () => {
    if (!checkmarkRef.current || !heroRef.current) return {};
    const heroRect = heroRef.current.getBoundingClientRect();
    const rect = checkmarkRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2 - heroRect.left;
    const centerY = rect.top + rect.height / 2 - heroRect.top;
    const deltaX = mousePos.x - centerX;
    const deltaY = mousePos.y - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > 200) return {};

    const tiltX = (deltaY / distance) * 5;
    const tiltY = -(deltaX / distance) * 5;

    return {
      transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
      transition: "transform 0.1s ease-out",
    };
  };

  const getVideoPulse = () => {
    if (!videoRef.current || !heroRef.current) return {};
    const heroRect = heroRef.current.getBoundingClientRect();
    const rect = videoRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2 - heroRect.left;
    const centerY = rect.top + rect.height / 2 - heroRect.top;
    const distance = Math.sqrt(
      Math.pow(mousePos.x - centerX, 2) + Math.pow(mousePos.y - centerY, 2),
    );

    if (distance < 300) {
      const intensity = 1 - distance / 300;
      return {
        transform: `scale(${1 + intensity * 0.02})`,
        boxShadow: `0 0 ${intensity * 30}px rgba(0, 167, 111, ${intensity * 0.3})`,
      };
    }
    return {};
  };

  return (
    <section
      ref={heroRef}
      className="bg-background relative flex min-h-[75vh] flex-col items-center justify-center overflow-visible px-6 py-24 md:min-h-[80vh] md:px-16 md:py-32 lg:px-24"
    >
      <div className="pointer-events-none absolute top-0 right-0 bottom-0 left-0 z-[1] bg-[radial-gradient(circle_at_70%_50%,rgba(0,167,111,0.015),transparent_60%)] dark:bg-[radial-gradient(circle_at_70%_50%,rgba(0,167,111,0.025),transparent_60%)]" />

      <NeuralNetworkDots />

      <div
        className="absolute top-0 right-0 bottom-0 left-0 z-0 transition-transform duration-100 ease-out motion-reduce:transform-none"
        style={{
          transform: `translateY(${scrollY * 0.3}px)`,
        }}
      />

      <div className="relative z-10 mx-auto max-w-[80rem] text-center">
        <div className="mb-12 md:mb-16">
          <div className="mb-6 flex items-center justify-center gap-4 md:mb-8 md:gap-6">
            <div
              ref={checkmarkRef}
              className="animate-checkmark-bounce h-14 w-14 shrink-0 motion-reduce:transform-none motion-reduce:animate-none md:h-20 md:w-20"
              style={getCheckmarkTilt()}
            >
              <Image
                src={checkmarkLogo}
                alt="Shothik Success"
                width={80}
                height={80}
                data-testid="img-checkmark-logo"
                className="h-full w-full"
              />
            </div>
            <h1
              className="text-h1 text-foreground m-0"
              data-testid="text-hero-heading"
            >
              {t("hero.heading")}
            </h1>
          </div>

          <div className="mb-8 flex min-h-[36px] items-center justify-center md:mb-10 md:min-h-[44px]">
            <h2
              className="text-h5 md:text-h4 text-primary animate-fade-in motion-reduce:animate-none"
              key={currentText}
            >
              {TYPING_TEXTS[currentText]}
            </h2>
          </div>

          <p className="text-muted-foreground text-body1 md:text-subtitle1 mx-auto mb-3 max-w-3xl px-4 md:mb-4">
            {t("hero.description")}
          </p>
          <p className="text-muted-foreground text-body2 md:text-subtitle2 mx-auto mb-6 max-w-2xl px-4">
            {t("hero.subDescription")}
          </p>
        </div>

        <div className="animate-bounce-slow mt-20 mb-16 flex flex-col items-center gap-3 motion-reduce:animate-none md:mt-24 md:mb-20">
          <span className="text-body2 md:text-body1 text-muted-foreground">
            {t("hero.cta")}
          </span>
          <ChevronDown className="text-muted-foreground h-6 w-6" />
        </div>

        <HeroVideo
          videoRef={videoRef}
          scrollY={scrollY}
          videoPulseStyle={getVideoPulse()}
          onVideoClick={() => setIsVideoOpen(true)}
        />
      </div>

      <VideoModal isOpen={isVideoOpen} onClose={() => setIsVideoOpen(false)} />

      <style jsx>{`
        @keyframes checkmarkBounceIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-checkmark-bounce {
          animation: checkmarkBounceIn 0.8s
            cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        @keyframes fadeIn {
          0% {
            transform: translateY(10px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in;
        }

        @keyframes bounceSlow {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(8px);
          }
        }
        .animate-bounce-slow {
          animation: bounceSlow 2s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-checkmark-bounce,
          .animate-fade-in,
          .animate-bounce-slow {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
