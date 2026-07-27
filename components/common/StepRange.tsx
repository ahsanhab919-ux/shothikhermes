"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import * as React from "react";
import DiamondIcon from "../icons/DiamondIcon";

interface Step {
  label: string;
  value: string;
  disabled?: boolean;
}

interface StepRangeProps {
  className?: string;
  value: string;
  onChange: (value: string) => void;
  steps: Step[];
  showDiamond?: boolean;
}

export const StepRange: React.FC<StepRangeProps> = ({
  className,
  value,
  onChange,
  steps,
}) => {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);
  const currentIndex = steps.findIndex((s) => s.value === value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIndex = Number(e.target.value);
    const step = steps[newIndex];
    if (step?.disabled) return;
    onChange(step.value);
  };

  const stepPercent = (index: number) => {
    if (steps.length === 1) return 0;
    return (index / (steps.length - 1)) * 100;
  };

  const handleInputMouseMove = (e: React.MouseEvent<HTMLInputElement>) => {
    if (!trackRef.current) return;
    
    // Get the track's bounding rect (not the input's, to account for negative margins)
    const trackRect = trackRef.current.getBoundingClientRect();
    
    // Calculate mouse position relative to track
    const mouseX = e.clientX - trackRect.left;
    
    // Calculate thumb center position on track
    const thumbCenter = (stepPercent(currentIndex) / 100) * trackRect.width;
    const hoverRadius = 20; // Hover detection radius in pixels
    
    // Check if mouse is within hover radius of thumb center
    const distance = Math.abs(mouseX - thumbCenter);
    setIsHovered(distance <= hoverRadius);
  };

  const handleInputMouseLeave = () => {
    setIsHovered(false);
  };

  const handleInputTouchStart = (e: React.TouchEvent<HTMLInputElement>) => {
    // Show tooltip immediately on touch start
    setIsHovered(true);
  };

  const handleInputTouchMove = (e: React.TouchEvent<HTMLInputElement>) => {
    // Keep tooltip visible during touch move
    setIsHovered(true);
  };

  const handleInputTouchEnd = () => {
    // Keep tooltip visible briefly on touch end, then hide it
    // This gives users time to see the selected value
    setTimeout(() => {
      setIsHovered(false);
    }, 1000);
  };

  return (
    <div className={cn("relative z-auto flex w-full items-center", className)}>
      <div className="relative h-4 w-full flex-1 py-1">
        {/* Slider track */}
        <div
          ref={trackRef}
          className="bg-primary/25 absolute top-1.5 right-0 bottom-1.5 left-0 w-full rounded-full backdrop-blur-sm"
        >
          {/* Active background (primary color) */}
          <div
            className="bg-primary absolute top-0 bottom-0 left-0 h-full rounded-full transition-all duration-100"
            style={{
              width: `${stepPercent(currentIndex)}%`,
            }}
          />

          {/* Disabled segments overlay */}
          {steps?.map((step, index) => {
            if (!step.disabled || index === 0) return null;

            const startPercent = stepPercent(index - 1);
            const endPercent = stepPercent(index);
            const width = `${endPercent - startPercent}%`;

            return (
              <div
                key={step.value}
                className="bg-muted-foreground/50 absolute top-0 h-full rounded-full"
                style={{ left: `${startPercent}%`, width }}
              />
            );
          })}

          {/* Dividers */}
          {steps.map((_, index) => (
            <div
              key={index}
              className="bg-card absolute top-0 bottom-0 z-10 aspect-square h-full overflow-hidden rounded-full"
              style={{
                left: `${stepPercent(index)}%`,
                transform: "translateX(-50%)",
              }}
            >
              <div className="bg-primary/50 size-full" />
            </div>
          ))}
        </div>

        {/* Slider input */}
        <input
          ref={inputRef}
          type="range"
          min={0}
          max={steps.length - 1}
          step={1}
          value={currentIndex}
          onChange={handleChange}
          onMouseMove={handleInputMouseMove}
          onMouseLeave={handleInputMouseLeave}
          onTouchStart={handleInputTouchStart}
          onTouchMove={handleInputTouchMove}
          onTouchEnd={handleInputTouchEnd}
          className="absolute inset-0 -right-2 -left-2 z-30 h-full cursor-pointer opacity-0"
          style={{ pointerEvents: "all" }}
        />

        {/* Thumb visual */}
        <div
          className="absolute top-0 bottom-0 z-20 flex items-center justify-center pointer-events-none"
          style={{
            left: `${stepPercent(currentIndex)}%`,
            transform: "translateX(-50%)",
            width: "24px",
            height: "100%",
          }}
        >
          <div
            className="bg-primary size-4 cursor-pointer rounded-full border shadow-lg transition-all duration-100"
          />
        </div>

        {/* Tooltip below thumb */}
        <Tooltip open={isHovered}>
          <TooltipTrigger asChild>
            <div
              className="absolute top-0 bottom-0 z-20 flex items-center justify-center pointer-events-none"
              style={{
                left: `${stepPercent(currentIndex)}%`,
                transform: "translateX(-50%)",
                width: "24px",
                height: "100%",
              }}
            />
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="bg-primary text-primary-foreground border-primary z-50 [--foreground:var(--primary)]"
          >
            <span>{steps?.[currentIndex]?.label}</span>
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="relative z-20 -ms-1">
        <DiamondIcon className="size-6" />
      </div>
    </div>
  );
};
