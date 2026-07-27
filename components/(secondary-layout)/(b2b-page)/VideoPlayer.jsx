"use client";
import { useState } from "react";

export const VideoPlayer = ({
  videoSrc = "/assets/background/b2b/computer.mp4",
  thumbnailSrc = "/assets/background/b2b/computer.png",
  name = "name",
  title = "title",
  isShowInfo = true,
  isShowPlayIcon = true,
  sx,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className={`relative max-w-[34.95288rem] max-h-[34.19956rem] overflow-hidden rounded cursor-${
      isShowPlayIcon ? "pointer" : "default"
    }`}>
      {isPlaying ? (
        <video
          src={videoSrc}
          controls
          autoPlay
          className="h-full w-full object-cover object-center [aspect-ratio:1/1]"
        />
      ) : (
        <>
          <img
            src={thumbnailSrc}
            alt="Video Thumbnail"
            className="h-full w-full object-cover object-center [aspect-ratio:1/1]"
          />
          {isShowPlayIcon && (
            <img
              onClick={() => setIsPlaying(true)}
              src="/b2b/play.svg"
              alt="Play"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            />
          )}
        </>
      )}
      {!isPlaying && isShowInfo && (
        <div className="absolute bottom-2 left-2">
          <p className="font-sans text-base font-bold uppercase leading-[1.65] text-primary-foreground">
            {name}
          </p>
          <p className="font-sans text-[0.5625rem] font-normal leading-[0.859rem] tracking-[0.01688rem] text-primary-foreground">
            {title}
          </p>
        </div>
      )}
    </div>
  );
};
