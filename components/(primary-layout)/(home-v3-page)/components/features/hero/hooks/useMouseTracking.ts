import { useState, useEffect, RefObject } from "react";

export function useMouseTracking(heroRef: RefObject<HTMLDivElement>) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let rafId: number | null = null;
    let lastMousePos = { x: 0, y: 0 };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    const handleWindowMouseMove = (e: MouseEvent) => {
      lastMousePos = { x: e.clientX, y: e.clientY };
      
      if (rafId !== null) return;
      
      rafId = requestAnimationFrame(() => {
        if (heroRef.current) {
          const rect = heroRef.current.getBoundingClientRect();
          setMousePos({ 
            x: lastMousePos.x - rect.left, 
            y: lastMousePos.y - rect.top 
          });
        }
        rafId = null;
      });
    };

    window.addEventListener('mousemove', handleWindowMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [heroRef]);

  return { mousePos, scrollY };
}
