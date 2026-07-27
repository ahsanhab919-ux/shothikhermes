"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import { RefObject } from "react";
import heroImage from "@/components/(primary-layout)/(home-v3-page)/attached_assets/B80BBD6F-003A-44F9-B9B6-31569128A57E_1759865243321.png";

interface HeroVideoProps {
  videoRef: RefObject<HTMLDivElement>;
  scrollY: number;
  videoPulseStyle: React.CSSProperties;
  onVideoClick: () => void;
  className?: string;
}

export default function HeroVideo({
  videoRef,
  scrollY,
  videoPulseStyle,
  onVideoClick,
  className,
}: HeroVideoProps) {
  return (
    <div className={`mb-0 ${className || ""}`}>
      <div
        ref={videoRef}
        onClick={onVideoClick}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onVideoClick();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Play introduction video - Watch Shothik founders explain the platform"
        data-testid="video-hero"
        className="border-border focus-visible:outline-primary relative mx-auto aspect-video h-fit w-full cursor-pointer overflow-hidden rounded-2xl border shadow-[0_0_2px_0_rgba(145,158,171,0.2),0_12px_24px_-4px_rgba(145,158,171,0.12)] transition-all duration-300 ease-out hover:shadow-[0_12px_24px_-4px_rgba(145,158,171,0.16)] focus-visible:outline-3 focus-visible:outline-offset-2 motion-reduce:transform-none md:w-xl xl:w-3xl"
        style={{
          transform: `scale(${1 + scrollY * 0.0001})`,
          ...videoPulseStyle,
        }}
      >
        <Image
          src={heroImage}
          alt="Shothik AI Founders - Introducing Shothik"
          fill
          priority
          style={{
            objectFit: "contain",
          }}
          sizes="(max-width: 768px) 100vw, 750px"
        />

        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <button
            aria-label="Play introduction video"
            data-testid="button-play-video"
            className="hover:border-primary bg-card/50 text-card-foreground light hover:text-primary flex aspect-square h-1/4 shrink-0 items-center justify-center rounded-full border backdrop-blur-xl transition-all duration-300"
          >
            <Play strokeWidth={1.5} className="aspect-square h-1/2 w-1/2" />
          </button>
        </div>
      </div>
    </div>
  );
}
