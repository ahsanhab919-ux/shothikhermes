"use client";

import { useEffect, useRef } from "react";

interface Dot {
  x: number;
  y: number;
}

export default function NeuralNetworkDots() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const pulsePhaseRef = useRef<number>(0);

  const dotColor = "180, 180, 180";
  const baseOpacity = 0.1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      initializeDots();
    };

    const initializeDots = () => {
      const dots: Dot[] = [];
      const spacing = 80;
      const cols = Math.floor(canvas.offsetWidth / spacing);
      const rows = Math.floor(canvas.offsetHeight / spacing);

      const offsetX = (canvas.offsetWidth - (cols - 1) * spacing) / 2;
      const offsetY = (canvas.offsetHeight - (rows - 1) * spacing) / 2;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          dots.push({
            x: offsetX + i * spacing,
            y: offsetY + j * spacing,
          });
        }
      }
      dotsRef.current = dots;
    };

    const animate = () => {
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      const dots = dotsRef.current;

      pulsePhaseRef.current += 0.015;
      const breathe = Math.sin(pulsePhaseRef.current) * 0.08;

      const opacity = baseOpacity + breathe;

      dots.forEach((dot) => {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dotColor}, ${opacity})`;
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    animate();

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dotColor, baseOpacity]);

  return (
    <div className="pointer-events-none absolute top-0 right-0 bottom-0 left-0 z-0 opacity-70 motion-reduce:hidden">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
