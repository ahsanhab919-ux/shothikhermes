import { useEffect, useState } from "react";

// Tailwind's default breakpoints (you can edit these if customized)
const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

type Breakpoint = keyof typeof breakpoints;
type QueryType = "up" | "down" | "between" | "only";

const useResponsive = (
  query: QueryType,
  start?: Breakpoint,
  end?: Breakpoint,
): boolean => {
  const getMatches = (): boolean => {
    const min = start ? breakpoints[start] : null;
    const max = end ? breakpoints[end] - 0.02 : null; // small offset to match Tailwind’s max-width logic

    switch (query) {
      case "up":
        return min ? window.matchMedia(`(min-width:${min}px)`).matches : false;
      case "down":
        return min
          ? window.matchMedia(`(max-width:${min - 0.02}px)`).matches
          : false;
      case "between":
        return min && max
          ? window.matchMedia(`(min-width:${min}px) and (max-width:${max}px)`)
            .matches
          : false;
      default: // "only"
        return min && max
          ? window.matchMedia(`(min-width:${min}px) and (max-width:${max}px)`)
            .matches
          : min
            ? window.matchMedia(`(min-width:${min}px)`).matches
            : false;
    }
  };

  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Set initial value on client side
    setMatches(getMatches());

    // Listen for resize
    const handleResize = () => setMatches(getMatches());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [query, start, end]);

  return matches;
};

export default useResponsive;
